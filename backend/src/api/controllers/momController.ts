import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { AppError } from '../../infrastructure/utils/AppError';
import prisma from '../../infrastructure/database/prisma';
import { getIO } from '../../core/socket';
import { createNotification } from './notificationController';

export const createMoM = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const meetingId = req.params.meetingId as string;
        const authReq = req as AuthRequest;
        const { objective, agendaPoints, discussionSummary, decisions, attendanceCount, attendanceSummary, departments, attachments, actionItems } = req.body;

        const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });

        if (!meeting) return next(new AppError('Meeting not found', 404));

        // Validation: Only creator can create MoM
        if (meeting.createdById !== authReq.user?.id) {
            return next(new AppError('Only the meeting creator can create the MoM', 403));
        }

        // Validation: Meeting must be completed
        if (meeting.status !== 'Completed') {
            return next(new AppError('MoM can only be created after the meeting is completed', 400));
        }

        // Check if MoM already exists
        const existingMoM = await prisma.meetingMinutes.findUnique({ where: { meetingId } });
        if (existingMoM) return next(new AppError('MoM already exists for this meeting', 400));

        const newMoM = await prisma.meetingMinutes.create({
            data: {
                meetingId,
                objective: objective || '',
                agendaPoints: typeof agendaPoints === 'object' ? JSON.stringify(agendaPoints) : String(agendaPoints || ''),
                discussionSummary: discussionSummary || '',
                decisions: typeof decisions === 'object' ? JSON.stringify(decisions) : String(decisions || ''),
                attendanceCount: attendanceCount || 0,
                attendanceSummary: attendanceSummary || '',
                departments: typeof departments === 'object' ? JSON.stringify(departments) : String(departments || ''),
                attachments: typeof attachments === 'object' ? JSON.stringify(attachments) : String(attachments || ''),
                status: 'Draft',
                createdById: authReq.user?.id || ''
            }
        });

        // Create action items if provided
        if (actionItems && Array.isArray(actionItems)) {
            await prisma.meetingActionItem.createMany({
                data: actionItems.map(item => ({
                    meetingId,
                    taskDescription: item.taskDescription,
                    assignedTo: item.assignedTo,
                    deadline: item.deadline,
                    priority: item.priority || 'Medium',
                    status: 'Pending'
                }))
            });
        }

        // Update meeting momStatus
        await prisma.meeting.update({
            where: { id: meetingId },
            data: { momStatus: 'Draft' }
        });

        res.status(201).json({
            status: 'success',
            data: { mom: newMoM }
        });
    } catch (err) {
        next(err);
    }
};

export const updateMoM = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const meetingId = req.params.meetingId as string;
        const authReq = req as AuthRequest;
        const data = req.body;

        const mom = await prisma.meetingMinutes.findUnique({ where: { meetingId } });
        if (!mom) return next(new AppError('MoM not found', 404));

        if (mom.createdById !== authReq.user?.id) {
            return next(new AppError('Only the MoM creator can update it', 403));
        }

        if (mom.status === 'Published' && authReq.user?.role !== 'ADMIN') {
            return next(new AppError('Published MoM cannot be edited by non-admins', 403));
        }

        // Update action items if provided (recreate for simplicity or handle diff)
        if (data.actionItems && Array.isArray(data.actionItems)) {
            await prisma.meetingActionItem.deleteMany({ where: { meetingId } });
            await prisma.meetingActionItem.createMany({
                data: data.actionItems.map((item: any) => ({
                    meetingId,
                    taskDescription: item.taskDescription,
                    assignedTo: item.assignedTo,
                    deadline: item.deadline,
                    priority: item.priority || 'Medium',
                    status: item.status || 'Pending'
                }))
            });
            delete data.actionItems;
        }

        const updatedMoM = await prisma.meetingMinutes.update({
            where: { meetingId },
            data: {
                ...data,
                agendaPoints: typeof data.agendaPoints === 'object' ? JSON.stringify(data.agendaPoints) : data.agendaPoints,
                decisions: typeof data.decisions === 'object' ? JSON.stringify(data.decisions) : data.decisions,
                attendanceSummary: data.attendanceSummary,
                departments: typeof data.departments === 'object' ? JSON.stringify(data.departments) : data.departments,
                attachments: typeof data.attachments === 'object' ? JSON.stringify(data.attachments) : data.attachments,
                updatedAt: new Date()
            }
        });

        res.status(200).json({
            status: 'success',
            data: { mom: updatedMoM }
        });
    } catch (err) {
        next(err);
    }
};

export const publishMoM = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const meetingId = req.params.meetingId as string;
        const authReq = req as AuthRequest;

        const mom = await prisma.meetingMinutes.findUnique({ where: { meetingId } });
        if (!mom) return next(new AppError('MoM not found', 404));

        if (mom.createdById !== authReq.user?.id) {
            return next(new AppError('Only the creator can publish the MoM', 403));
        }

        const updatedMoM = await prisma.meetingMinutes.update({
            where: { meetingId },
            data: { status: 'Published' }
        });

        await prisma.meeting.update({
            where: { id: meetingId },
            data: { momStatus: 'Published' }
        });

        // Socket notification for published MoM
        getIO().emit('meeting:mom_published', { meetingId, momId: mom.id });

        res.status(200).json({
            status: 'success',
            data: { mom: updatedMoM }
        });
    } catch (err) {
        next(err);
    }
};

export const addReply = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const meetingId = req.params.meetingId as string;
        const authReq = req as AuthRequest;
        const { replyText } = req.body;

        if (!replyText) return next(new AppError('Reply text is required', 400));

        const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
        if (!meeting || meeting.momStatus !== 'Published') {
            return next(new AppError('Replies can only be added to published MoMs', 400));
        }

        const newReply = await prisma.meetingReply.create({
            data: {
                meetingId,
                userId: authReq.user?.id || '',
                replyText
            },
            include: {
                user: { select: { id: true, fullName: true } }
            }
        });

        getIO().emit('meeting:reply_added', { meetingId, reply: newReply });

        res.status(201).json({
            status: 'success',
            data: { reply: newReply }
        });
    } catch (err) {
        next(err);
    }
};

export const shareMoM = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const meetingId = req.params.meetingId as string;
        const authReq = req as AuthRequest;
        const { targetRole, targetCampusId, sendNotification } = req.body;

        const meeting = await prisma.meeting.findUnique({
            where: { id: meetingId },
            include: { minutes: true }
        });

        console.log("DEBUG: shareMoM", {
            meetingId,
            momStatus: meeting?.momStatus,
            minutesStatus: meeting?.minutes?.status,
            body: req.body
        });

        if (!meeting) return next(new AppError('Meeting not found', 404));
        if (!meeting.minutes || meeting.minutes.status !== 'Published') { // Line 198
            console.error("DEBUG: Share failed - MoM not published", {
                hasMinutes: !!meeting.minutes,
                status: meeting.minutes?.status
            });
            return next(new AppError('Only published MoMs can be shared', 400));
        }

        // Authorization: Creator, Admin, Management, or School Leader (for their campus)
        const isCreator = meeting.createdById === authReq.user?.id;
        const isAdmin = authReq.user?.role === 'ADMIN' || authReq.user?.role === 'SUPERADMIN';
        const isManagement = authReq.user?.role === 'MANAGEMENT';
        const isLeaderForCampus = authReq.user?.role === 'LEADER' && authReq.user?.campusId === meeting.campusId;

        if (!isCreator && !isAdmin && !isManagement && !isLeaderForCampus) {
            return next(new AppError('You are not authorized to share this MoM', 403));
        }

        const share = await prisma.meetingShare.create({
            data: {
                meetingId,
                sharedBy: authReq.user?.id || '',
                targetRole,
                targetCampusId: targetCampusId || null
            }
        });

        if (sendNotification) {
            getIO().emit('meeting:mom_shared', {
                meetingId,
                targetRole,
                targetCampusId,
                sharedBy: authReq.user?.fullName
            });

            // Send in-app notifications
            const usersToNotify = await prisma.user.findMany({
                where: {
                    role: targetRole,
                    ...(targetCampusId ? { campusId: targetCampusId } : {})
                },
                select: { id: true }
            });

            for (const user of usersToNotify) {
                await createNotification({
                    userId: user.id,
                    title: 'New MoM Shared',
                    message: `${authReq.user?.fullName} has shared the Minutes of Meeting for "${meeting.title}".`,
                    type: 'INFO',
                    link: `/meetings/${meeting.id}/mom`
                });
            }
        }

        res.status(201).json({
            status: 'success',
            data: { share }
        });
    } catch (err) {
        console.error("Error in shareMoM:", err);
        next(err);
    }
};



export const getMoM = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const meetingId = req.params.meetingId as string;
        const authReq = req as AuthRequest;
        const user = authReq.user;

        const meeting = await prisma.meeting.findUnique({
            where: { id: meetingId },
            include: {
                minutes: {
                    include: {
                        createdBy: { select: { id: true, fullName: true } }
                    }
                },
                actionItems: true,
                attendees: true,
                shares: true
            }
        });

        if (!meeting || !meeting.minutes) {
            return next(new AppError('MoM not found', 404));
        }

        // Visibility Rules:
        // 1. Creator and Admin see everything (including Drafts)
        const isCreator = meeting.createdById === user?.id || meeting.minutes.createdById === user?.id;
        const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';

        if (isCreator || isAdmin) {
            return res.status(200).json({ status: 'success', data: { mom: meeting.minutes, actionItems: meeting.actionItems } });
        }

        // 2. Drafts are ONLY visible to creator/admin
        if (meeting.minutes.status === 'Draft') {
            return next(new AppError('You are not authorized to view this draft MoM', 403));
        }

        // 3. Published MoMs visible to:
        // - Attendees
        // - Specific roles/campuses it was shared with
        // - Management/Leaders for their campus
        const isAttendee = meeting.attendees.some(a => a.userId === user?.id);
        const isSharedWithRole = meeting.shares.some(s => s.targetRole === user?.role && (!s.targetCampusId || s.targetCampusId === user?.campusId));
        const isManagement = user?.role === 'MANAGEMENT';
        const isCampusLeader = user?.role === 'LEADER' && user?.campusId === meeting.campusId;

        if (isAttendee || isSharedWithRole || isManagement || isCampusLeader) {
            return res.status(200).json({ status: 'success', data: { mom: meeting.minutes, actionItems: meeting.actionItems } });
        }

        return next(new AppError('You do not have permission to view this MoM', 403));
    } catch (err) {
        next(err);
    }
};
