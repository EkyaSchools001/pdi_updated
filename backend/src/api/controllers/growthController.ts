import { Request, Response, NextFunction } from 'express';
import prisma from '../../infrastructure/database/prisma';
import { AppError } from '../../infrastructure/utils/AppError';

export const getGrowthAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const coreCount = await prisma.user.count({
            where: { academics: 'CORE', role: 'TEACHER' }
        });

        const nonCoreCount = await prisma.user.count({
            where: { academics: 'NON_CORE', role: 'TEACHER' }
        });

        // Mocking some transition data/trends for now
        const analytics = {
            totalCore: coreCount,
            totalNonCore: nonCoreCount,
            observationCompletionRate: 75, // percentage
            growthTrends: [
                { month: 'Jan', core: 10, nonCore: 5 },
                { month: 'Feb', core: 12, nonCore: 6 },
                { month: 'Mar', core: 15, nonCore: 8 },
            ],
            averageScores: {
                core: 4.2,
                nonCore: 3.8
            }
        };

        res.status(200).json({
            status: 'success',
            data: { analytics }
        });
    } catch (err) {
        next(err);
    }
};

export const validateGrowthAccess = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { teacherId } = req.params;
        const loggedInUser = (req as any).user;

        if (!loggedInUser) {
            return next(new AppError('Not authenticated', 401));
        }

        // if Teacher: can only access their own growth type
        if (loggedInUser.role === 'TEACHER') {
            const academicType = req.query.academicType as string;
            if (loggedInUser.academics !== academicType) {
                return next(new AppError('Unauthorized access to this growth module', 403));
            }
        }

        // if Leader: can only access teachers in their campus
        if ((loggedInUser.role === 'LEADER' || loggedInUser.role === 'SCHOOL_LEADER') && teacherId) {
            const teacher = await prisma.user.findUnique({
                where: { id: String(teacherId) }
            });
            if (!teacher || teacher.campusId !== loggedInUser.campusId) {
                return next(new AppError('Unauthorized access: Teacher not in your campus', 403));
            }
        }

        res.status(200).json({
            status: 'success',
            message: 'Access validated'
        });
    } catch (err) {
        next(err);
    }
};
