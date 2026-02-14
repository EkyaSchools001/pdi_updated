import { Request, Response, NextFunction } from 'express';
import prisma from '../../infrastructure/database/prisma';

export const getAdminStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const [totalUsers, totalTrainingEvents] = await Promise.all([
            prisma.user.count(),
            prisma.trainingEvent.count()
        ]);

        // Calculate functionality for "this month" if needed, but for now total counts are a good start
        // To get "new users this month":
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const newUsersThisMonth = await prisma.user.count({
            where: {
                createdAt: {
                    gte: startOfMonth
                }
            }
        });

        const newEventsThisMonth = await prisma.trainingEvent.count({
            where: {
                date: {
                    gte: startOfMonth.toISOString()
                }
            }
        });


        res.status(200).json({
            status: 'success',
            data: {
                users: {
                    total: totalUsers,
                    newThisMonth: newUsersThisMonth
                },
                trainingEvents: {
                    total: totalTrainingEvents,
                    thisMonth: newEventsThisMonth
                }
            }
        });
    } catch (error) {
        next(error);
    }
};
