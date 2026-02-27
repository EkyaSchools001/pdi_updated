import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import prisma from '../../infrastructure/database/prisma';
import { AppError } from '../../infrastructure/utils/AppError';
import { createNotification } from './notificationController';
import { getIO } from '../../core/socket';

export const createGrowthObservation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const {
            teacherId,
            academicYear,
            moduleType,
            subject,
            block,
            grade,
            section,
            observationDate,
            overallRating,
            status,
            formPayload
        } = req.body;

        if (!teacherId || !academicYear || !moduleType) {
            return next(new AppError('teacherId, academicYear, and moduleType are required', 400));
        }

        const teacher = await prisma.user.findUnique({ where: { id: teacherId } });
        if (!teacher) {
            return next(new AppError('Teacher not found', 404));
        }

        const observation = await prisma.growthObservation.create({
            data: {
                teacherId,
                observerId: authReq.user!.id,
                campusId: teacher.campusId, // Link to teacher's campus
                academicYear,
                moduleType,
                subject,
                block,
                grade,
                section,
                observationDate: observationDate ? new Date(observationDate) : new Date(),
                overallRating: Number(overallRating) || 0,
                status: status || 'SUBMITTED',
                formPayload: typeof formPayload === 'object' ? JSON.stringify(formPayload) : formPayload,
            },
            include: {
                teacher: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        campusId: true
                    }
                },
                observer: {
                    select: {
                        id: true,
                        fullName: true,
                        role: true
                    }
                }
            }
        });

        // Real-time update
        getIO().emit('growth-observation:created', observation);

        // Notify teacher
        await createNotification({
            userId: teacherId,
            title: 'New Observation',
            message: `A new ${moduleType.replace('_', ' ')} observation has been submitted by ${authReq.user?.fullName}.`,
            type: 'SUCCESS',
            link: '/teacher/observations'
        });

        res.status(201).json({
            status: 'success',
            data: { observation }
        });
    } catch (err) {
        next(err);
    }
};

export const getGrowthObservations = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const { teacherId, campusId, moduleType, academicYear, status } = req.query;

        let filter: any = {};

        // Security / RBAC
        if (authReq.user?.role === 'TEACHER') {
            filter.teacherId = authReq.user.id;
        } else if (teacherId) {
            filter.teacherId = String(teacherId);
        }

        if (campusId) filter.campusId = String(campusId);
        if (moduleType) filter.moduleType = moduleType as any;
        if (academicYear) filter.academicYear = String(academicYear);
        if (status) filter.status = status as any;

        const observations = await prisma.growthObservation.findMany({
            where: filter,
            include: {
                teacher: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true
                    }
                },
                observer: {
                    select: {
                        id: true,
                        fullName: true,
                        role: true
                    }
                }
            },
            orderBy: {
                observationDate: 'desc'
            }
        });

        const mappedObservations = observations.map(obs => ({
            ...obs,
            formPayload: (() => {
                try {
                    return JSON.parse(obs.formPayload || '{}');
                } catch (e) {
                    return obs.formPayload;
                }
            })()
        }));

        res.status(200).json({
            status: 'success',
            results: mappedObservations.length,
            data: { observations: mappedObservations }
        });
    } catch (err) {
        next(err);
    }
};

export const getGrowthObservationById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const { id } = req.params;

        const observation = await prisma.growthObservation.findUnique({
            where: { id: String(id) },
            include: {
                teacher: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        campusId: true
                    }
                },
                observer: {
                    select: {
                        id: true,
                        fullName: true,
                        role: true
                    }
                }
            }
        });

        if (!observation) {
            return next(new AppError('Observation not found', 404));
        }

        // Security: Teachers can only view their own
        if (authReq.user?.role === 'TEACHER' && observation.teacherId !== authReq.user.id) {
            return next(new AppError('You are not authorized to view this observation', 403));
        }

        const mappedObservation = {
            ...observation,
            formPayload: (() => {
                try {
                    return JSON.parse(observation.formPayload || '{}');
                } catch (e) {
                    return observation.formPayload;
                }
            })()
        };

        res.status(200).json({
            status: 'success',
            data: { observation: mappedObservation }
        });
    } catch (err) {
        next(err);
    }
};

export const updateGrowthObservation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const { id } = req.params;
        const data = req.body;

        const existing = await prisma.growthObservation.findUnique({ where: { id: String(id) } });
        if (!existing) return next(new AppError('Observation not found', 404));

        // Security: Leaders can update almost anything, teachers maybe just reflections (though not requested yet for unified table)
        // For now, let's just implement a general update for leaders
        if (authReq.user?.role === 'TEACHER' && existing.teacherId !== authReq.user.id) {
            return next(new AppError('Not authorized', 403));
        }

        const updated = await prisma.growthObservation.update({
            where: { id: String(id) },
            data: {
                ...data,
                observationDate: data.observationDate ? new Date(data.observationDate) : undefined,
                formPayload: typeof data.formPayload === 'object' ? JSON.stringify(data.formPayload) : data.formPayload,
            }
        });

        res.status(200).json({
            status: 'success',
            data: { observation: updated }
        });
    } catch (err) {
        next(err);
    }
};
