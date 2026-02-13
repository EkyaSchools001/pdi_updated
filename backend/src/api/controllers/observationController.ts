import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { AppError } from '../../infrastructure/utils/AppError';
import prisma from '../../infrastructure/database/prisma';
import bcrypt from 'bcryptjs';
import { getIO } from '../../core/socket';

export const getAllObservations = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        let filter: any = {};

        // RBAC logic: Teachers only see their own
        if (authReq.user?.role === 'TEACHER') {
            filter = { teacherId: authReq.user.id };
        }

        const observations = await prisma.observation.findMany({
            where: filter,
            include: {
                teacher: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true
                    }
                },
                domainRatings: true
            }
        });

        // Map domainRatings to domains for frontend consistency
        const mappedObservations = observations.map(obs => {
            const { domainRatings, ...rest } = obs;
            return {
                ...rest,
                domains: domainRatings
            };
        });

        res.status(200).json({
            status: 'success',
            results: mappedObservations.length,
            data: { observations: mappedObservations }
        });
    } catch (err) {
        next(err);
    }
};

export const createObservation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const data = req.body;

        // Try to link to a teacher user if email is provided
        let teacherId = data.teacherId;
        if (!teacherId && data.teacherEmail) {
            const teacher = await prisma.user.findUnique({ where: { email: data.teacherEmail } });
            if (teacher) {
                teacherId = teacher.id;
            } else {
                // Auto-create teacher if not found to support manual input
                try {
                    const newTeacher = await prisma.user.create({
                        data: {
                            email: data.teacherEmail,
                            fullName: data.teacher || 'Manual Entry Teacher',
                            passwordHash: await bcrypt.hash('Teacher@123', 10), // Default passwordHash
                            role: 'TEACHER'
                        }
                    });
                    teacherId = newTeacher.id;
                } catch (userErr) {
                    console.error("Error auto-creating teacher:", userErr);
                    // Fallback to unknown if creation fails (e.g. race condition)
                    teacherId = (await prisma.user.findUnique({ where: { email: data.teacherEmail } }))?.id || 'unknown';
                }
            }
        }

        const newObservationData = {
            teacherId: String(teacherId && teacherId !== 'unknown' ? teacherId : ''),
            observerId: String(authReq.user?.id || ''),
            date: String(data.date || new Date().toISOString()),
            domain: String(data.domain || 'General'),
            score: Number(data.score || 0),
            notes: String(data.notes || data.feedback || ''),
            status: 'SUBMITTED' as const,
            actionStep: String(data.actionStep || ''),
            teacherReflection: String(data.teacherReflection || ''),
            discussionMet: !!data.discussionMet,
            hasReflection: !!data.hasReflection,
            createdAt: new Date()
        };

        if (!newObservationData.teacherId || !newObservationData.observerId) {
            return next(new AppError('A valid teacher and authenticated observer are required', 400));
        }

        const createdObservation = await prisma.observation.create({
            data: newObservationData,
            include: {
                teacher: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true
                    }
                },
                domainRatings: true
            }
        });

        // Map for frontend
        const { domainRatings, ...rest } = createdObservation;
        const mappedObservation = {
            ...rest,
            domains: domainRatings
        };

        // Real-time update
        getIO().emit('observation:created', mappedObservation);

        res.status(201).json({
            status: 'success',
            data: { observation: mappedObservation }
        });
    } catch (err) {
        next(err);
    }
};

export const updateObservation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const authReq = req as AuthRequest;
        const currentUserId = authReq.user?.id;
        const userRole = authReq.user?.role;

        // Fetch existing observation to check ownership
        const existingObservation = await prisma.observation.findUnique({
            where: { id: String(id) }
        });

        if (!existingObservation) {
            return next(new AppError('Observation not found', 404));
        }

        // If user is a teacher, they can only update THEIR OWN observation
        // and only reflection-related fields
        if (userRole === 'TEACHER') {
            if (existingObservation.teacherId !== currentUserId) {
                return next(new AppError('You are not authorized to update this reflection', 403));
            }

            // Strictly limit what a teacher can update
            const allowedForTeacher = ['teacherReflection', 'detailedReflection', 'hasReflection', 'status'];
            const forbiddenKeys = Object.keys(data).filter(key => !allowedForTeacher.includes(key));

            if (forbiddenKeys.length > 0) {
                // If they try to update forbidden fields, we still allow the update but only of the allowed fields
                // OR we can throw error. Let's just filter them.
            }
        }

        // Pick only fields supported by the Prisma schema
        // and normalize status case
        const updateData: any = {
            updatedAt: new Date()
        };

        const allowedFields = userRole === 'TEACHER'
            ? ['teacherReflection', 'detailedReflection', 'hasReflection', 'status']
            : ['teacherReflection', 'detailedReflection', 'hasReflection', 'notes', 'actionStep', 'discussionMet', 'score', 'domain', 'status'];

        allowedFields.forEach(field => {
            if (data[field] !== undefined) {
                if (field === 'status') {
                    const statusMap: Record<string, string> = {
                        'Submitted': 'SUBMITTED',
                        'submitted': 'SUBMITTED',
                        'Draft': 'DRAFT',
                        'draft': 'DRAFT',
                        'Reviewed': 'REVIEWED',
                        'reviewed': 'REVIEWED'
                    };
                    updateData.status = (statusMap[data.status] || data.status.toUpperCase()) as any;
                } else if (field === 'score') {
                    updateData.score = Number(data[field]);
                } else if (['hasReflection', 'discussionMet'].includes(field)) {
                    updateData[field] = !!data[field];
                } else {
                    updateData[field] = field === 'detailedReflection' ? data[field] : String(data[field]);
                }
            }
        });

        const updatedObservation = await prisma.observation.update({
            where: { id: String(id) },
            data: updateData,
            include: {
                teacher: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true
                    }
                },
                domainRatings: true
            }
        });

        // Map for frontend
        const { domainRatings, ...rest } = updatedObservation;
        const mappedObservation = {
            ...rest,
            domains: domainRatings
        };

        getIO().emit('observation:updated', mappedObservation);

        res.status(200).json({
            status: 'success',
            data: { observation: mappedObservation }
        });
    } catch (err) {
        next(err);
    }
};
