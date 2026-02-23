import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../../infrastructure/utils/AppError';
import { AuthRequest } from '../middlewares/auth';
import { getIO } from '../../core/socket';
import { createNotification } from './notificationController';

const prisma = new PrismaClient();

export const submitMoocEvidence = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new AppError('Authentication required', 401);
        }

        const {
            courseName,
            platform,
            otherPlatform,
            hours,
            startDate,
            endDate,
            hasCertificate,
            certificateType,
            proofLink,
            certificateFile,
            certificateFileName,
            keyTakeaways,
            unansweredQuestions,
            enjoyedMost,
            effectivenessRating,
            additionalFeedback,
            name,
            email
        } = req.body;

        const submission = await prisma.moocSubmission.create({
            data: {
                userId,
                courseName,
                platform,
                otherPlatform,
                hours: parseFloat(hours),
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                hasCertificate,
                certificateType,
                proofLink,
                certificateFile,
                certificateFileName,
                keyTakeaways,
                unansweredQuestions,
                enjoyedMost,
                effectivenessRating: Array.isArray(effectivenessRating) ? effectivenessRating[0] : effectivenessRating,
                additionalFeedback,
                teacherName: name,
                teacherEmail: email,
                status: 'PENDING'
            },
            include: {
                user: {
                    select: {
                        fullName: true,
                        email: true
                    }
                }
            }
        });

        // Emit to leaders
        const io = getIO();
        io.to('leaders').emit('mooc:created', submission);

        res.status(201).json({
            status: 'success',
            data: { submission }
        });
    } catch (error: any) {
        console.error('Error submitting MOOC evidence:', error);
        res.status(error.statusCode || 500).json({
            status: 'error',
            message: error.message || 'Internal server error'
        });
    }
};

export const getAllMoocSubmissions = async (req: AuthRequest, res: Response) => {
    try {
        const role = req.user?.role;
        const userId = req.user?.id;

        let submissions;
        if (role === 'TEACHER') {
            submissions = await prisma.moocSubmission.findMany({
                where: { userId },
                orderBy: { submittedAt: 'desc' }
            });
        } else {
            // Leaders/Admins see everything
            submissions = await prisma.moocSubmission.findMany({
                include: {
                    user: {
                        select: {
                            fullName: true,
                            email: true,
                            campusId: true
                        }
                    }
                },
                orderBy: { submittedAt: 'desc' }
            });
        }

        const mappedSubmissions = submissions.map((sub: any) => ({
            ...sub,
            name: sub.teacherName || sub.user?.fullName || 'Unknown',
            email: sub.teacherEmail || sub.user?.email || '',
            campus: sub.user?.campusId || 'Unknown',
            completionDate: sub.endDate || sub.submittedAt
        }));

        res.status(200).json({
            status: 'success',
            data: { submissions: mappedSubmissions }
        });
    } catch (error: any) {
        console.error('Error fetching MOOC submissions:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

export const updateMoocStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const { status } = req.body;

        if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
            throw new AppError('Invalid status', 400);
        }

        const submission = await prisma.moocSubmission.update({
            where: { id },
            data: { status },
            include: {
                user: {
                    select: {
                        fullName: true,
                        email: true
                    }
                }
            }
        });

        // Emit to the specific teacher and all leaders
        const io = getIO();
        io.to(submission.userId).emit('mooc:updated', submission);
        io.to(`user:${submission.userId}`).emit('mooc:updated', submission); // Using new user:ID room convention
        io.to('leaders').emit('mooc:updated', submission);

        // Persist notification for the teacher
        await createNotification({
            userId: submission.userId,
            title: `MOOC Submission ${status}`,
            message: `Your evidence for "${submission.courseName}" has been ${status.toLowerCase()}.`,
            type: status === 'APPROVED' ? 'SUCCESS' : 'WARNING',
            link: '/teacher/mooc'
        });

        res.status(200).json({
            status: 'success',
            data: { submission }
        });
    } catch (error: any) {
        console.error('Error updating MOOC status:', error);
        res.status(error.statusCode || 500).json({
            status: 'error',
            message: error.message || 'Internal server error'
        });
    }
};
