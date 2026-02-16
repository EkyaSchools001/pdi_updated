import { Request, Response, NextFunction } from 'express';
import prisma from '../../infrastructure/database/prisma';
import { AuthRequest } from '../middlewares/auth';
import { AppError } from '../../infrastructure/utils/AppError';
import { createGoalSchema } from '../../core/models/schemas';

export const getAllGoals = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        let filter = {};
        if (authReq.user?.role === 'TEACHER') {
            filter = { teacherId: authReq.user.id };
        }

        const goals = await prisma.goal.findMany({
            where: filter,
            orderBy: { createdAt: 'desc' },
            include: {
                teacher: {
                    select: {
                        fullName: true,
                        email: true
                    }
                }
            }
        });

        const formattedGoals = goals.map(g => ({
            ...g,
            teacher: g.teacher?.fullName || 'Unknown Teacher',
            teacherEmail: g.teacherEmail || g.teacher?.email || null
        }));

        res.status(200).json({
            status: 'success',
            results: formattedGoals.length,
            data: { goals: formattedGoals }
        });
    } catch (err) {
        next(err);
    }
};

export const createGoal = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const result = createGoalSchema.safeParse(req.body);
        if (!result.success) {
            return next(new AppError('Validation failed', 400));
        }

        const data = result.data;
        let teacherId = data.teacherId;

        // If leader/admin is assigning and teacherEmail is provided
        if (authReq.user?.role !== 'TEACHER' && !teacherId && data.teacherEmail) {
            const targetTeacher = await prisma.user.findUnique({ where: { email: data.teacherEmail } });
            if (targetTeacher) {
                teacherId = targetTeacher.id;
            } else {
                // Return error if teacher not found - or auto-create? 
                // Let's return error for now as goals are more sensitive
                return next(new AppError('Target teacher not found', 404));
            }
        }

        // If still no teacherId, fallback to current user if teacher
        if (!teacherId) {
            if (authReq.user?.role === 'TEACHER') {
                teacherId = authReq.user.id;
            } else {
                return next(new AppError('A valid teacherId or teacherEmail is required for leader assignments', 400));
            }
        }

        const newGoal = await prisma.goal.create({
            data: {
                ...data,
                teacherId: teacherId
            }
        });

        res.status(201).json({
            status: 'success',
            data: { goal: newGoal }
        });
    } catch (err) {
        next(err);
    }
};
