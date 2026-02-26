import { Request, Response } from 'express';
import prisma from '../../infrastructure/database/prisma';
import { AuthRequest } from '../middlewares/auth'; // Corrected path



export const getAssessments = async (req: AuthRequest, res: Response) => {
    try {
        const assessments = await prisma.assessment.findMany({
            include: { questions: true, assignments: true }
        });
        res.status(200).json({ status: 'success', data: { assessments } });
    } catch (error: any) {
        console.error('Error fetching assessments:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

export const createAssessment = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id as string;
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }

        const { title, description, type, isTimed, timeLimitMinutes, maxAttempts, questions } = req.body;

        const assessment = await prisma.assessment.create({
            data: {
                title: title as string,
                description: description as string,
                type: (type as string) || 'CUSTOM',
                isTimed: Boolean(isTimed),
                timeLimitMinutes: timeLimitMinutes ? Number(timeLimitMinutes) : null,
                maxAttempts: maxAttempts ? Number(maxAttempts) : 1,
                createdById: userId,
                questions: {
                    create: (questions || []).map((q: any) => ({
                        prompt: q.prompt as string,
                        type: (q.type as string) || 'MCQ',
                        options: JSON.stringify(q.options),
                        correctAnswer: q.correctAnswer as string,
                        points: q.points ? Number(q.points) : 1
                    }))
                }
            },
            include: { questions: true }
        });

        res.status(201).json({ status: 'success', data: { assessment } });
    } catch (error: any) {
        console.error('Error creating assessment:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

export const updateAssessment = async (req: AuthRequest, res: Response) => {
    try {
        const assessmentId = req.params.assessmentId as string;
        const { title, description, type, isTimed, timeLimitMinutes, maxAttempts, questions } = req.body;

        const updatedAssessment = await prisma.$transaction(async (tx) => {
            // Update basic info
            const assessment = await tx.assessment.update({
                where: { id: assessmentId },
                data: {
                    title: title as string,
                    description: description as string,
                    type: (type as string) || 'CUSTOM',
                    isTimed: Boolean(isTimed),
                    timeLimitMinutes: timeLimitMinutes ? Number(timeLimitMinutes) : null,
                    maxAttempts: maxAttempts ? Number(maxAttempts) : 1
                }
            });

            // If questions provided, replace them
            if (questions && Array.isArray(questions)) {
                // Delete old questions
                await tx.assessmentQuestion.deleteMany({
                    where: { assessmentId: assessmentId }
                });

                // Create new ones
                await tx.assessmentQuestion.createMany({
                    data: questions.map((q: any) => ({
                        assessmentId: assessmentId,
                        prompt: q.prompt as string,
                        type: (q.type as string) || 'MCQ',
                        options: JSON.stringify(q.options),
                        correctAnswer: q.correctAnswer as string,
                        points: q.points ? Number(q.points) : 1
                    }))
                });
            }

            return tx.assessment.findUnique({
                where: { id: assessmentId },
                include: { questions: true }
            });
        });

        res.status(200).json({ status: 'success', data: { assessment: updatedAssessment } });
    } catch (error: any) {
        console.error('Error updating assessment:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

export const assignAssessment = async (req: AuthRequest, res: Response) => {
    try {
        const assessmentId = req.params.assessmentId as string;
        const { targetIds, assignToType } = req.body; // assignToType: 'USER', 'CAMPUS', 'ROLE'
        const assignedById = req.user?.id as string;

        if (!assignedById) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

        const assignments = await Promise.all((targetIds || []).map((targetId: string) => {
            const data: any = { assessmentId, assignedById };
            if (assignToType === 'USER') data.assignedToId = targetId as string;
            else if (assignToType === 'CAMPUS') data.assignedToCampusId = targetId as string;
            else if (assignToType === 'ROLE') data.assignedToRole = targetId as string;

            return prisma.assessmentAssignment.create({ data });
        }));

        res.status(201).json({ status: 'success', data: { assignments } });
    } catch (error: any) {
        console.error('Error assigning assessment:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

export const getMyAssignedAssessments = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id as string;
        const role = req.user?.role as string;
        const campusId = req.user?.campusId as string;

        if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

        // Find assignments targeting user specifically, their role, or their campus
        const assignments = await prisma.assessmentAssignment.findMany({
            where: {
                OR: [
                    { assignedToId: userId },
                    { assignedToRole: role },
                    { assignedToCampusId: campusId }
                ]
            },
            include: { assessment: { include: { questions: true } } }
        });

        // Find user's attempts
        const attempts = await prisma.assessmentAttempt.findMany({
            where: { userId: userId }
        });

        res.status(200).json({ status: 'success', data: { assignments, attempts } });
    } catch (error: any) {
        console.error('Error fetching assignments:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

export const startAttempt = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id as string;
        const assessmentId = req.params.assessmentId as string;

        if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

        const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
        if (!assessment) return res.status(404).json({ status: 'error', message: 'Assessment not found' });

        const pastAttempts = await prisma.assessmentAttempt.count({
            where: {
                assessmentId: assessmentId,
                userId: userId
            }
        });

        if (pastAttempts >= assessment.maxAttempts) {
            return res.status(403).json({ status: 'error', message: 'Maximum attempts reached' });
        }

        const attempt = await prisma.assessmentAttempt.create({
            data: {
                assessmentId: assessmentId,
                userId: userId,
                status: 'IN_PROGRESS',
                attemptNumber: pastAttempts + 1
            }
        });

        res.status(201).json({ status: 'success', data: { attempt } });
    } catch (error: any) {
        console.error('Error starting attempt:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

export const saveAttemptProgress = async (req: AuthRequest, res: Response) => {
    try {
        const attemptId = req.params.attemptId as string;
        const { answers } = req.body;
        const userId = req.user?.id as string;

        const attempt = await prisma.assessmentAttempt.findUnique({ where: { id: attemptId } });
        if (!attempt || attempt.userId !== userId) return res.status(403).json({ status: 'error', message: 'Forbidden' });
        if (attempt.status !== 'IN_PROGRESS') return res.status(400).json({ status: 'error', message: 'Attempt already finished' });

        const updatedAttempt = await prisma.assessmentAttempt.update({
            where: { id: attemptId },
            data: { answers: JSON.stringify(answers) }
        });

        res.status(200).json({ status: 'success', data: { attempt: updatedAttempt } });
    } catch (error: any) {
        console.error('Error saving attempt:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

export const submitAttempt = async (req: AuthRequest, res: Response) => {
    try {
        const attemptId = req.params.attemptId as string;
        const { answers } = req.body;
        const userId = req.user?.id as string;

        const attempt = await prisma.assessmentAttempt.findUnique({
            where: { id: attemptId },
            include: { assessment: { include: { questions: true } } }
        }) as any;

        if (!attempt || attempt.userId !== userId) return res.status(403).json({ status: 'error', message: 'Forbidden' });
        if (attempt.status !== 'IN_PROGRESS') return res.status(400).json({ status: 'error', message: 'Attempt already finished' });

        // Process Score
        let score = 0;
        const finalAnswers = answers || (attempt.answers ? JSON.parse(attempt.answers) : {});
        const questions = (attempt.assessment?.questions || []) as any[];

        questions.forEach((q: any) => {
            const userAnswer = String(finalAnswers[q.id] || "").trim();
            const correctAnswer = String(q.correctAnswer || "").trim();

            if (q.type === 'MCQ' && userAnswer === correctAnswer && correctAnswer !== "") {
                score += q.points;
            }
        });

        const totalPoints = questions.reduce((acc: number, q: any) => acc + (q.points || 0), 0);
        const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;

        const updatedAttempt = await prisma.assessmentAttempt.update({
            where: { id: attemptId },
            data: {
                answers: JSON.stringify(finalAnswers),
                status: 'SUBMITTED',
                endTime: new Date(),
                score: percentage
            }
        });

        res.status(200).json({ status: 'success', data: { attempt: updatedAttempt } });
    } catch (error: any) {
        console.error('Error submitting attempt:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

export const getAnalytics = async (req: AuthRequest, res: Response) => {
    try {
        const role = req.user?.role as string;
        const campusId = req.user?.campusId as string;

        const whereClause: any = (role === 'ADMIN' || role === 'SUPERADMIN')
            ? {}
            : { user: { campusId: campusId } };

        // Fetch all attempts
        const attempts = await prisma.assessmentAttempt.findMany({
            where: whereClause,
            include: {
                user: { select: { id: true, fullName: true, campusId: true, role: true, email: true } },
                assessment: { select: { id: true, title: true, type: true } }
            }
        });

        // Fetch all assignments (relevant for completion rate)
        const assignments = await prisma.assessmentAssignment.findMany({
            where: (role === 'ADMIN' || role === 'SUPERADMIN')
                ? {}
                : {
                    OR: [
                        { assignedToCampusId: campusId },
                        { assignedToId: { not: null }, assignedTo: { campusId: campusId } },
                        { assignedToRole: { not: null } }
                    ]
                },
            include: {
                assessment: { select: { id: true, title: true, type: true } },
                assignedTo: { select: { id: true, campusId: true } }
            }
        });

        // Fetch users to map assignments to individuals
        const users = await prisma.user.findMany({
            where: {
                role: { in: ['TEACHER', 'SCHOOL_LEADER', 'LEADER'] },
                ...((role === 'ADMIN' || role === 'SUPERADMIN') ? {} : { campusId: campusId })
            },
            select: { id: true, fullName: true, campusId: true, role: true, email: true }
        });

        res.status(200).json({ status: 'success', data: { analytics: { attempts, assignments, users } } });
    } catch (error: any) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

export const deleteAssessment = async (req: AuthRequest, res: Response) => {
    try {
        const assessmentId = req.params.assessmentId as string;
        const userId = req.user?.id as string;

        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }

        // Delete the assessment template. 
        // Note: Prisma should handle cascading deletes if configured in the schema, 
        // but we'll trust the schema's 'onDelete: Cascade' for questions and assignments.
        await prisma.assessment.delete({
            where: { id: assessmentId }
        });

        res.status(200).json({ status: 'success', message: 'Assessment template deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting assessment:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};
