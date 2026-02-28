import { Request, Response, NextFunction } from 'express';
import prisma from '../../infrastructure/database/prisma';
import { AuthRequest } from '../middlewares/auth';
import { AppError } from '../../infrastructure/utils/AppError';
import { createGoalSchema } from '../../core/models/schemas';
import { createNotification } from './notificationController';
import { isWindowOpen } from './goalWindowController';

export const getAllGoals = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        let filter: any = {};
        if (authReq.user?.role === 'TEACHER') {
            filter.teacherId = authReq.user.id;
        }

        const goals = await prisma.goal.findMany({
            where: filter,
            orderBy: { createdAt: 'desc' },
            include: {
                teacher: {
                    select: {
                        fullName: true,
                        email: true,
                        academics: true,
                        campusId: true,
                        department: true
                    }
                }
            }
        });

        const formattedGoals = goals.map(g => ({
            ...g,
            teacher: g.teacher?.fullName || 'Unknown Teacher',
            teacherEmail: g.teacherEmail || g.teacher?.email || null,
            teacherDepartment: g.teacher?.department || null,
            academics: g.teacher?.academics || 'CORE'
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

        if (authReq.user?.role !== 'TEACHER' && !teacherId && data.teacherEmail) {
            const targetTeacher = await prisma.user.findUnique({ where: { email: data.teacherEmail } });
            if (targetTeacher) {
                teacherId = targetTeacher.id;
            } else {
                return next(new AppError('Target teacher not found', 404));
            }
        }

        if (!teacherId) {
            if (authReq.user?.role === 'TEACHER') {
                teacherId = authReq.user.id;
            } else {
                return next(new AppError('A valid teacherId or teacherEmail is required', 400));
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
                status: 'IN_PROGRESS',
                isSchoolAligned: data.isSchoolAligned ?? false,
                category: data.category || undefined,
                assignedBy: authReq.user?.id,
                actionStep: data.actionStep || undefined,
                campus: data.campus || undefined,
                academicType: data.academicType || 'CORE'
            }
        });

        res.status(201).json({ status: 'success', data: { goal: newGoal } });
    } catch (err) {
        next(err);
    }
};

export const updateGoal = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const { id } = req.params as { id: string };
        const { progress, status, title, description, dueDate, category, actionStep, campus } = req.body;

        const existing = await prisma.goal.findUnique({ where: { id } });
        if (!existing) return next(new AppError('Goal not found', 404));

        if (authReq.user?.role === 'TEACHER' && existing.teacherId !== authReq.user.id) {
            return next(new AppError('Access denied', 403));
        }

        const updated = await prisma.goal.update({
            where: { id },
            data: {
                progress: typeof progress === 'number' ? progress : undefined,
                status: status || undefined,
                title: title || undefined,
                description: description || undefined,
                dueDate: dueDate || undefined,
                category: category || undefined,
                actionStep: actionStep || undefined,
                campus: campus || undefined
            }
        });

        res.status(200).json({ status: 'success', data: { goal: updated } });
    } catch (err) {
        next(err);
    }
};

export const submitSelfReflection = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const { id } = req.params as { id: string };
        const { reflectionData } = req.body;

        if (!(await isWindowOpen('SELF_REFLECTION'))) {
            return next(new AppError('Self-reflection window is closed', 403));
        }

        const goal = await prisma.goal.findUnique({ where: { id } });
        if (!goal || goal.teacherId !== authReq.user?.id) {
            return next(new AppError('Goal not found or access denied', 404));
        }

        const updated = await prisma.goal.update({
            where: { id },
            data: {
                selfReflectionForm: JSON.stringify(reflectionData),
                selfReflectionCompletedAt: new Date(),
                status: 'SELF_REFLECTION_SUBMITTED'
            }
        });

        // Notify HOS
        const teacher = await prisma.user.findUnique({ where: { id: goal.teacherId } });
        if (teacher?.campusId) {
            const hos = await prisma.user.findFirst({ where: { role: 'LEADER', campusId: teacher.campusId } });
            if (hos) {
                await createNotification({
                    userId: hos.id,
                    title: 'New Self-Reflection',
                    message: `${teacher.fullName} has submitted a self-reflection.`,
                    type: 'INFO',
                    link: `/leader/goals`
                });
            }
        }

        res.status(200).json({ status: 'success', data: { goal: updated } });
    } catch (err) {
        next(err);
    }
};

export const submitGoalSetting = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params as { id: string };
        const { settingData } = req.body;

        if (!(await isWindowOpen('GOAL_SETTING'))) {
            return next(new AppError('Goal setting window is closed', 403));
        }

        const goal = await prisma.goal.findUnique({ where: { id } });
        if (!goal) return next(new AppError('Goal not found', 404));

        if (goal.status !== 'SELF_REFLECTION_SUBMITTED') {
            return next(new AppError('Workflow violation: Self-reflection required first', 400));
        }

        const updated = await prisma.goal.update({
            where: { id },
            data: {
                goalSettingForm: JSON.stringify(settingData),
                goalSettingCompletedAt: new Date(),
                status: 'GOAL_SET'
            }
        });

        await createNotification({
            userId: goal.teacherId,
            title: 'Goal Expectations Set',
            message: `Expectations have been set for your goal: ${goal.title}`,
            type: 'INFO',
            link: '/teacher/goals'
        });

        res.status(200).json({ status: 'success', data: { goal: updated } });
    } catch (err) {
        next(err);
    }
};

export const submitGoalCompletion = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params as { id: string };
        const { completionData, status: finalStatus } = req.body;

        if (!(await isWindowOpen('GOAL_COMPLETION'))) {
            return next(new AppError('Goal completion window is closed', 403));
        }

        const goal = await prisma.goal.findUnique({ where: { id } });
        if (!goal) return next(new AppError('Goal not found', 404));

        if (goal.status !== 'GOAL_SET') {
            return next(new AppError('Workflow violation: Goal setting required first', 400));
        }

        const updated = await prisma.goal.update({
            where: { id },
            data: {
                goalCompletionForm: JSON.stringify(completionData),
                goalCompletionCompletedAt: new Date(),
                status: finalStatus,
                progress: finalStatus === 'GOAL_COMPLETED' ? 100 : finalStatus === 'PARTIALLY_MET' ? 50 : 0
            }
        });

        await createNotification({
            userId: goal.teacherId,
            title: 'Goal Finalized',
            message: `Evaluation completed for: ${goal.title}. Status: ${finalStatus}`,
            type: 'SUCCESS',
            link: '/teacher/goals'
        });

        res.status(200).json({ status: 'success', data: { goal: updated } });
    } catch (err) {
        next(err);
    }
};

export const getGoalAnalyticsDashboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const campusId = req.query.campusId as string | undefined;

        let filter: any = {};
        if (authReq.user?.role === 'LEADER') filter.campus = authReq.user.campusId;
        if (campusId) filter.campus = campusId;

        const allGoals = await prisma.goal.findMany({
            where: filter,
            include: { teacher: { select: { campusId: true, fullName: true, role: true } } }
        });

        const total = allGoals.length;
        const reflected = allGoals.filter(g => g.status === 'SELF_REFLECTION_SUBMITTED' || g.status === 'GOAL_SET' || g.status === 'GOAL_COMPLETED' || g.status === 'PARTIALLY_MET' || g.status === 'NOT_MET').length;
        const set = allGoals.filter(g => ['GOAL_SET', 'GOAL_COMPLETED', 'PARTIALLY_MET', 'NOT_MET'].includes(g.status)).length;
        const completed = allGoals.filter(g => ['GOAL_COMPLETED', 'PARTIALLY_MET', 'NOT_MET'].includes(g.status)).length;

        res.status(200).json({
            status: 'success',
            data: {
                summary: {
                    total,
                    reflectionRate: total > 0 ? (reflected / total) * 100 : 0,
                    settingRate: total > 0 ? (set / total) * 100 : 0,
                    completionRate: total > 0 ? (completed / total) * 100 : 0
                },
                goals: allGoals
            }
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

        for (const t of teachers) {
            await createNotification({
                userId: t.id,
                title: 'Goal Window Open',
                message: 'A new goal submission window has been opened.',
                type: 'INFO',
                link: '/teacher/goals'
            });
        }

        res.status(200).json({ status: 'success', message: 'Notifications sent' });
    } catch (err) {
        next(err);
    }
};
