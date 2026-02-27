import { Request, Response, NextFunction } from 'express';
import prisma from '../../infrastructure/database/prisma';
import { AuthRequest } from '../middlewares/auth';
import { AppError } from '../../infrastructure/utils/AppError';
import { createGoalSchema } from '../../core/models/schemas';
import { createNotification } from './notificationController';
import { getIO } from '../../core/socket';

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
                teacherId: teacherId,
                teacherEmail: data.teacherEmail || undefined,
                title: data.title,
                description: data.description || undefined,
                dueDate: data.dueDate,
                progress: data.progress ?? 0,
                status: (data.status === 'COMPLETED' ? 'COMPLETED' : data.status) || 'IN_PROGRESS',
                isSchoolAligned: data.isSchoolAligned ?? false,
                category: data.category || undefined,
                assignedBy: data.assignedBy || undefined,
                actionStep: data.actionStep || undefined,
                campus: data.campus || undefined
            },
            include: {
                teacher: { select: { fullName: true, email: true } }
            }
        });

        const formatted = {
            ...newGoal,
            teacher: newGoal.teacher?.fullName || 'Unknown Teacher',
            teacherEmail: newGoal.teacherEmail || newGoal.teacher?.email || null
        };

        res.status(201).json({
            status: 'success',
            data: { goal: formatted }
        });
    } catch (err) {
        next(err);
    }
};

export const updateGoal = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const { progress, status: statusUpdate, title, description, dueDate, selfReflectionForm, goalSettingForm, goalCompletionForm, selfReflectionCompletedAt, goalSettingCompletedAt, goalCompletionCompletedAt, category, actionStep, pillar, campus } = req.body;

        const existing = await prisma.goal.findUnique({ where: { id } });
        if (!existing) {
            return next(new AppError('Goal not found', 404));
        }

        // Teachers can only update their own goals (progress, status)
        if (authReq.user?.role === 'TEACHER' && existing.teacherId !== authReq.user.id) {
            return next(new AppError('You can only update your own goals', 403));
        }

        const updateData: Record<string, unknown> = {};
        if (typeof progress === 'number' && progress >= 0 && progress <= 100) updateData.progress = progress;
        if (statusUpdate && ['IN_PROGRESS', 'COMPLETED'].includes(statusUpdate)) updateData.status = statusUpdate;
        if (title) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (dueDate) updateData.dueDate = dueDate;
        if (category) updateData.category = category;
        if (actionStep !== undefined) updateData.actionStep = actionStep;
        if (campus) updateData.campus = campus;

        // Form updates
        if (selfReflectionForm !== undefined) updateData.selfReflectionForm = selfReflectionForm;
        if (goalSettingForm !== undefined) updateData.goalSettingForm = goalSettingForm;
        if (goalCompletionForm !== undefined) updateData.goalCompletionForm = goalCompletionForm;

        if (selfReflectionCompletedAt !== undefined) updateData.selfReflectionCompletedAt = selfReflectionCompletedAt;
        if (goalSettingCompletedAt !== undefined) updateData.goalSettingCompletedAt = goalSettingCompletedAt;
        if (goalCompletionCompletedAt !== undefined) updateData.goalCompletionCompletedAt = goalCompletionCompletedAt;

        const updated = await prisma.goal.update({
            where: { id },
            data: updateData,
            include: {
                teacher: { select: { fullName: true, email: true } }
            }
        });

        const updatedWithTeacher = updated as typeof updated & { teacher?: { fullName: string; email: string; campusId?: string | null } };
        const formatted = {
            ...updated,
            teacher: updatedWithTeacher.teacher?.fullName || 'Unknown Teacher',
            teacherEmail: updated.teacherEmail || updatedWithTeacher.teacher?.email || null
        };

        // NOTIFICATIONS
        // 1. Goal Setting Form Filled -> Notify Teacher
        if (goalSettingForm && !(existing as any).goalSettingForm) {
            await createNotification({
                userId: updated.teacherId,
                title: 'Goal Setting Added',
                message: `Your HOS has added Goal Setting expectations for: ${updated.title}`,
                type: 'INFO',
                link: '/teacher/goals'
            });
        }

        // 2. Goal Completion Form Filled -> Notify Teacher
        if (goalCompletionForm && !(existing as any).goalCompletionForm) {
            await createNotification({
                userId: updated.teacherId,
                title: 'Goal Completed',
                message: `Your HOS has finalized the Completion form for: ${updated.title}`,
                type: 'SUCCESS',
                link: '/teacher/goals'
            });
        }

        // 3. Self Reflection Filled -> Notify HOS
        if (selfReflectionForm && !(existing as any).selfReflectionForm) {
            // Find leader to notify - try to find leader of same campus or assignedBy
            let notifyLeaderId = existing.assignedBy;
            if (!notifyLeaderId) {
                const teacherDetails = await prisma.user.findUnique({ where: { id: updated.teacherId } });
                if (teacherDetails?.campusId) {
                    const campusLeader = await prisma.user.findFirst({
                        where: { role: 'LEADER', campusId: teacherDetails.campusId }
                    });
                    if (campusLeader) notifyLeaderId = campusLeader.id;
                }
            }
            if (notifyLeaderId) {
                await createNotification({
                    userId: notifyLeaderId,
                    title: 'Self-Reflection Submitted',
                    message: `${formatted.teacher} has submitted a self-reflection for: ${updated.title}`,
                    type: 'INFO',
                    link: '/leader/goals'
                });
            }
        }

        res.status(200).json({
            status: 'success',
            data: { goal: formatted }
        });
    } catch (err) {
        next(err);
    }
};

export const notifyWindowOpen = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const teachers = await prisma.user.findMany({
            where: { role: 'TEACHER' },
            select: { id: true }
        });

        const notifications = teachers.map(t => ({
            userId: t.id,
            title: 'Goal Setting Window Open',
            message: 'The self reflection and goal setting window is now open. Please review and submit your goals.',
            type: 'INFO',
            link: '/teacher/goals'
        }));

        for (const n of notifications) {
            await createNotification(n as any);
        }

        res.status(200).json({
            status: 'success',
            message: `Notifications sent to ${teachers.length} teachers.`
        });
    } catch (err) {
        next(err);
    }
};
