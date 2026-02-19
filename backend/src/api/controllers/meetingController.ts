import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { AppError } from '../../infrastructure/utils/AppError';
import prisma from '../../infrastructure/database/prisma';
import { getIO } from '../../core/socket';
import { createNotification } from './notificationController';

export const getAllMeetings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const user = authReq.user;
        const role = user?.role;
        const id = user?.id;
        const campusId = user?.campusId;

        let filter: any = {};

        // RBAC & Campus Isolation
        if (role === 'TEACHER') {
            // Teachers see meetings where they are invited OR published MoMs they have access to
            filter = {
                OR: [
                    { attendees: { some: { userId: id } } },
                    { createdById: id },
                    { momStatus: 'Published' } // Simplified: if published, teachers might see it (can be refined)
                ]
            };
        } else if (role === 'LEADER' || role === 'COORDINATOR' || role === 'HOS') {
            // Campus isolation for leaders
            if (campusId) {
                filter = {
                    OR: [
                        { campusId: campusId },
                        { createdById: id }
                    ]
                };
            }
        }
        // ADMIN and MANAGEMENT see all (filter remains empty or refined)

        const meetings = await prisma.meeting.findMany({
            where: filter,
            include: {
                createdBy: {
                    select: { id: true, fullName: true, role: true }
                },
                attendees: {
                    include: {
                        user: {
                            select: { id: true, fullName: true, email: true }
                        }
                    }
                },
                _count: {
                    select: { replies: true }
                }
            },
            orderBy: { meetingDate: 'desc' }
        });

        res.status(200).json({
            status: 'success',
            results: meetings.length,
            data: { meetings }
        });
    } catch (err) {
        next(err);
    }
};

export const getMeetingById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id as string;
        const meeting = await prisma.meeting.findUnique({
            where: { id },
            include: {
                createdBy: {
                    select: { id: true, fullName: true, role: true }
                },
                attendees: {
                    include: {
                        user: {
                            select: { id: true, fullName: true, email: true }
                        }
                    }
                },
                minutes: {
                    include: {
                        createdBy: {
                            select: { id: true, fullName: true }
                        }
                    }
                },
                actionItems: true,
                replies: {
                    include: {
                        user: {
                            select: { id: true, fullName: true }
                        }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        if (!meeting) {
            return next(new AppError('Meeting not found', 404));
        }

        // Parse JSON fields in minutes if they exist
        if ((meeting as any).minutes) {
            const minutes: any = (meeting as any).minutes;
            try {
                if (typeof minutes.agendaPoints === 'string') minutes.agendaPoints = JSON.parse(minutes.agendaPoints);
                if (typeof minutes.decisions === 'string') minutes.decisions = JSON.parse(minutes.decisions);
                if (typeof minutes.departments === 'string') minutes.departments = JSON.parse(minutes.departments);
                if (typeof minutes.attachments === 'string') minutes.attachments = JSON.parse(minutes.attachments);
            } catch (e) {
                console.error("Failed to parse MoM JSON fields", e);
            }
        }

        res.status(200).json({
            status: 'success',
            data: { meeting }
        });
    } catch (err) {
        next(err);
    }
};

export const createMeeting = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const { title, description, meetingType, meetingDate, startTime, endTime, mode, locationLink, attendees, status } = req.body;

        if (!title || !meetingType || !meetingDate || !startTime || !endTime) {
            return next(new AppError('Missing required meeting details', 400));
        }

        const newMeeting = await prisma.meeting.create({
            data: {
                title,
                description,
                meetingType,
                meetingDate,
                startTime,
                endTime,
                mode,
                locationLink,
                status: status || 'Scheduled',
                campusId: authReq.user?.campusId,
                departmentId: authReq.user?.department,
                createdById: authReq.user?.id || '',
                attendees: {
                    create: (attendees || []).map((userId: string) => ({
                        userId
                    }))
                }
            },
            include: {
                createdBy: {
                    select: { id: true, fullName: true }
                },
                attendees: {
                    include: {
                        user: {
                            select: { id: true, fullName: true }
                        }
                    }
                }
            }
        });

        // Notify via socket
        getIO().emit('meeting:created', newMeeting);

        // Send in-app notifications to attendees
        for (const attendee of newMeeting.attendees) {
            await createNotification({
                userId: attendee.userId,
                title: 'New Meeting Invitation',
                message: `You have been invited to "${newMeeting.title}" on ${newMeeting.meetingDate} by ${authReq.user?.fullName}.`,
                type: 'INFO',
                link: `/meetings/${newMeeting.id}`
            });
        }

        res.status(201).json({
            status: 'success',
            data: { meeting: newMeeting }
        });
    } catch (err) {
        next(err);
    }
};

export const updateMeeting = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id as string;
        const authReq = req as AuthRequest;
        const data = req.body;

        const meeting = await prisma.meeting.findUnique({ where: { id } });
        if (!meeting) return next(new AppError('Meeting not found', 404));

        // Authorization: Only creator or admin can update meeting details
        if (meeting.createdById !== authReq.user?.id && authReq.user?.role !== 'ADMIN') {
            return next(new AppError('You are not authorized to update this meeting', 403));
        }

        // Handle attendees update separately if provided
        if (data.attendees) {
            await prisma.meetingAttendee.deleteMany({ where: { meetingId: id } });
            data.attendees = {
                create: data.attendees.map((userId: string) => ({ userId }))
            };
        }

        const updatedMeeting = await prisma.meeting.update({
            where: { id },
            data: {
                ...data,
                updatedAt: new Date()
            },
            include: {
                createdBy: { select: { id: true, fullName: true } },
                attendees: { include: { user: { select: { id: true, fullName: true } } } }
            }
        });

        getIO().emit('meeting:updated', updatedMeeting);

        res.status(200).json({
            status: 'success',
            data: { meeting: updatedMeeting }
        });
    } catch (err) {
        next(err);
    }
};

export const deleteMeeting = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id as string;
        const authReq = req as AuthRequest;

        const meeting = await prisma.meeting.findUnique({ where: { id } });
        if (!meeting) return next(new AppError('Meeting not found', 404));

        if (meeting.createdById !== authReq.user?.id && authReq.user?.role !== 'ADMIN') {
            return next(new AppError('You are not authorized to delete this meeting', 403));
        }

        await prisma.meeting.delete({ where: { id } });

        getIO().emit('meeting:deleted', id);

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (err) {
        next(err);
    }
};
export const completeMeeting = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id as string;
        const authReq = req as AuthRequest;

        const meeting = await prisma.meeting.findUnique({ where: { id } });
        if (!meeting) return next(new AppError('Meeting not found', 404));

        // Authorization: Only creator or admin can mark as completed
        if (meeting.createdById !== authReq.user?.id && authReq.user?.role !== 'ADMIN') {
            return next(new AppError('You are not authorized to complete this meeting', 403));
        }

        const updatedMeeting = await prisma.meeting.update({
            where: { id },
            data: {
                status: 'Completed',
                updatedAt: new Date()
            },
            include: {
                createdBy: { select: { id: true, fullName: true } },
                attendees: { include: { user: { select: { id: true, fullName: true } } } }
            }
        });

        getIO().emit('meeting:updated', updatedMeeting);

        res.status(200).json({
            status: 'success',
            data: { meeting: updatedMeeting }
        });
    } catch (err) {
        next(err);
    }
};
