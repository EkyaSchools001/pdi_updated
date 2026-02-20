import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../../infrastructure/utils/AppError';
import { AuthRequest } from '../middlewares/auth';

const prisma = new PrismaClient();

// Get active survey for the current term
export const getActiveSurvey = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { academicYear, term } = req.query;

        // Optionally filter by query params, otherwise get the latest active
        const whereClause: any = { isActive: true };
        if (academicYear) whereClause.academicYear = String(academicYear);
        if (term) whereClause.term = String(term);

        const survey = await prisma.survey.findFirst({
            where: whereClause,
            include: {
                questions: {
                    orderBy: { orderIndex: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        if (!survey) {
            return next(new AppError('No active survey found.', 404));
        }

        // Check if user has already submitted (for Teacher/Leader)
        // Admin/Mgmt can see survey regardless
        let myResponse = null;
        if (req.user) {
            myResponse = await prisma.surveyResponse.findFirst({
                where: {
                    surveyId: survey.id,
                    userId: req.user.id
                },
                include: {
                    answers: true
                }
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                survey,
                myResponse
            }
        });
    } catch (err) {
        next(err);
    }
};

// Submit survey response
export const submitSurvey = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { surveyId, answers, isCompleted } = req.body;
        const userId = req.user!.id;

        // Check if survey is active
        const survey = await prisma.survey.findUnique({ where: { id: surveyId } });
        if (!survey || !survey.isActive) {
            return next(new AppError('Survey is not active.', 400));
        }

        // Check if already submitted
        const existingResponse = await prisma.surveyResponse.findFirst({
            where: { surveyId, userId }
        });

        if (existingResponse && existingResponse.isCompleted) {
            return next(new AppError('You have already submitted this survey.', 400));
        }

        // Upsert response
        const responseCallback = async (tx: any) => {
            const response = await tx.surveyResponse.upsert({
                where: existingResponse ? { id: existingResponse.id } : {
                    // Start a new one if not exists (Prisma upsert needs unique field, 
                    // but we don't have unique on surveyId+userId in schema yet? 
                    // Let's check schema... I didn't add @@unique([surveyId, userId]).
                    // So I should use findFirst logic or create.
                    // Actually, if existingResponse exists, update it. Else create.
                    id: "non-existent-id" // fallback
                },
                update: {
                    isCompleted: isCompleted || false,
                    campus: req.user?.campusId,
                    submittedAt: new Date()
                },
                create: {
                    surveyId,
                    userId,
                    campus: req.user?.campusId,
                    isCompleted: isCompleted || false,
                }
            });

            // Should properly handle this with if-else since upsert with non-unique is tricky without composite key
            return response;
        }

        // Better logic without upsert on non-unique
        let response;
        if (existingResponse) {
            response = await prisma.surveyResponse.update({
                where: { id: existingResponse.id },
                data: {
                    isCompleted: isCompleted || false,
                    submittedAt: new Date()
                }
            });
        } else {
            response = await prisma.surveyResponse.create({
                data: {
                    surveyId,
                    userId,
                    campus: req.user?.campusId,
                    isCompleted: isCompleted || false,
                }
            });
        }

        // Save answers
        if (answers && Array.isArray(answers)) {
            // Delete existing answers for this response to avoid dupes/stale data
            await prisma.surveyAnswer.deleteMany({ where: { responseId: response.id } });

            const answerData = answers.map((ans: any) => ({
                responseId: response.id,
                questionId: ans.questionId,
                answerText: ans.answerText,
                answerNumeric: ans.answerNumeric,
                answerJson: ans.answerJson
            }));

            await prisma.surveyAnswer.createMany({ data: answerData });
        }

        res.status(200).json({
            status: 'success',
            data: { response }
        });

    } catch (err) {
        next(err);
    }
};

// Analytics (Admin/Mgmt only)
export const getSurveyAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { surveyId } = req.params;

        // 1. Completion Rate by Campus
        const totalTeachersByCampus = await prisma.user.groupBy({
            by: ['campusId'],
            where: { role: 'TEACHER', status: 'Active' },
            _count: { id: true }
        });

        const responsesByCampus = await prisma.surveyResponse.groupBy({
            by: ['campus'],
            where: { surveyId: String(surveyId), isCompleted: true },
            _count: { id: true }
        });

        const completionStats = totalTeachersByCampus.map(t => {
            const completed = responsesByCampus.find(r => r.campus === t.campusId)?._count.id || 0;
            return {
                campus: t.campusId,
                total: t._count.id,
                completed,
                rate: t._count.id > 0 ? (completed / t._count.id) * 100 : 0
            };
        });

        // 2. Leadership Support Score (Q11 typically)
        // We need to find the Question ID for "Leadership Support" or generic matching
        // For now, let's fetch answers for numeric rating questions grouped by question and campus

        // This is complex to do with pure Prisma groupBy for relations.
        // We'll fetch all numeric answers for this survey and process in JS or raw query.
        // JS processing is fine for < 1000 responses.

        const numericAnswers = await prisma.surveyAnswer.findMany({
            where: {
                response: { surveyId: String(surveyId), isCompleted: true },
                answerNumeric: { not: null }
            },
            include: {
                response: { select: { campus: true } },
                question: { select: { questionText: true, pageNumber: true } }
            }
        });

        // Aggregate
        const questionStats: Record<string, any> = {};
        numericAnswers.forEach(ans => {
            const qKey = ans.question.questionText;
            const campus = ans.response.campus || 'Unknown';

            if (!questionStats[qKey]) questionStats[qKey] = {};
            if (!questionStats[qKey][campus]) questionStats[qKey][campus] = { sum: 0, count: 0 };

            questionStats[qKey][campus].sum += ans.answerNumeric!;
            questionStats[qKey][campus].count += 1;
        });

        // Format
        const formattedStats = Object.keys(questionStats).map(q => {
            const campusData = Object.keys(questionStats[q]).map(c => ({
                campus: c,
                avg: questionStats[q][c].sum / questionStats[q][c].count
            }));
            return { question: q, data: campusData };
        });

        res.status(200).json({
            status: 'success',
            data: {
                completionStats,
                questionStats: formattedStats
            }
        });

    } catch (err) {
        next(err);
    }
};

export const getSurveyById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const survey = await prisma.survey.findUnique({
            where: { id: String(id) },
            include: { questions: { orderBy: { orderIndex: 'asc' } } }
        });

        if (!survey) return next(new AppError('Survey not found', 404));

        res.status(200).json({ status: 'success', data: { survey } });
    } catch (err) {
        next(err);
    }
};

// --- Survey Management (Admin/Mgmt) ---

export const updateSurvey = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { title, description, isActive, isAnonymous, academicYear, term } = req.body;

        const survey = await prisma.survey.update({
            where: { id: String(id) },
            data: {
                title,
                description,
                isActive,
                isAnonymous,
                academicYear,
                term
            }
        });

        res.status(200).json({ status: 'success', data: { survey } });
    } catch (err) {
        next(err);
    }
};

export const createQuestion = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { surveyId } = req.params;
        const { questionText, questionType, options, isRequired, pageNumber } = req.body;

        // Get max order index to append
        const lastQuestion = await prisma.surveyQuestion.findFirst({
            where: { surveyId: String(surveyId) },
            orderBy: { orderIndex: 'desc' }
        });
        const newOrderIndex = (lastQuestion?.orderIndex || 0) + 1;

        const question = await prisma.surveyQuestion.create({
            data: {
                surveyId: String(surveyId),
                questionText,
                questionType,
                options: options ? JSON.stringify(options) : undefined,
                isRequired: isRequired !== undefined ? isRequired : true,
                pageNumber: pageNumber || 1,
                orderIndex: newOrderIndex
            }
        });

        res.status(201).json({ status: 'success', data: { question } });
    } catch (err) {
        next(err);
    }
};

export const updateQuestion = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { questionText, questionType, options, isRequired, pageNumber, orderIndex } = req.body;

        const question = await prisma.surveyQuestion.update({
            where: { id: String(id) },
            data: {
                questionText,
                questionType,
                options: options ? JSON.stringify(options) : undefined,
                isRequired,
                pageNumber,
                orderIndex
            }
        });

        res.status(200).json({ status: 'success', data: { question } });
    } catch (err) {
        next(err);
    }
};

export const deleteQuestion = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        await prisma.surveyQuestion.delete({
            where: { id: String(id) }
        });

        res.status(204).json({ status: 'success', data: null });
    } catch (err) {
        next(err);
    }
};

export const exportSurveyResults = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { surveyId } = req.params;

        // 1. Fetch Survey with Questions
        const survey = await prisma.survey.findUnique({
            where: { id: String(surveyId) },
            include: {
                questions: { orderBy: { orderIndex: 'asc' } }
            }
        });

        if (!survey) return next(new AppError('Survey not found', 404));

        // 2. Fetch all completed responses with answers and user details
        // 2. Fetch all completed responses with answers and user details
        const responses = await prisma.surveyResponse.findMany({
            where: {
                surveyId: String(surveyId),
                isCompleted: true
            },
            include: {
                user: { select: { fullName: true, email: true, campusId: true } },
                answers: true
            },
            orderBy: { submittedAt: 'desc' }
        });

        // 3. specific CSV Headers
        // Basic Info + Question Texts
        const headers = ['Response ID', 'Submitted At', 'Campus', 'User Name', 'User Email'];
        survey.questions.forEach(q => headers.push(`"${q.questionText.replace(/"/g, '""')}"`)); // Escape quotes in headers

        // 4. Build CSV Rows
        const rows = responses.map((r: any) => {
            const submittedAt = r.submittedAt ? new Date(r.submittedAt).toISOString() : '';
            const basicInfo = [
                r.id,
                submittedAt,
                r.campus || '',
                survey.isAnonymous ? 'Anonymous' : (r.user?.fullName || 'Unknown'),
                survey.isAnonymous ? 'Anonymous' : (r.user?.email || 'Unknown')
            ];

            // Map answers to questions order
            const answerCells = survey.questions.map((q: any) => {
                const ans = r.answers.find((a: any) => a.questionId === q.id);
                let val = '';
                if (ans) {
                    if (ans.answerText) val = ans.answerText;
                    else if (ans.answerNumeric !== null && ans.answerNumeric !== undefined) val = String(ans.answerNumeric);
                    else if (ans.answerJson) val = ans.answerJson; // Raw JSON for now
                }
                // Escape quotes and wrap in quotes
                return `"${val.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
            });

            return [...basicInfo, ...answerCells].join(',');
        });

        // 5. Combine and Send
        const csvContent = [headers.join(','), ...rows].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="survey_results_${surveyId}.csv"`);
        res.status(200).send(csvContent);

    } catch (err) {
        next(err);
    }
};
