import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../../infrastructure/utils/AppError';
import { AuthRequest } from '../middlewares/auth';

const prisma = new PrismaClient();

export const getPdHistory = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new AppError('Authentication required', 401);
        }

        const pdHistory = await prisma.pDHour.findMany({
            where: { userId },
            orderBy: { date: 'desc' }
        });

        res.status(200).json({
            status: 'success',
            data: { pdHistory }
        });
    } catch (error: any) {
        console.error('Error fetching PD history:', error);
        res.status(error.statusCode || 500).json({
            status: 'error',
            message: error.message || 'Internal server error'
        });
    }
};

export const createPdEntry = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new AppError('Authentication required', 401);
        }

        const { activity, hours, category, status, date } = req.body;

        if (!activity || !hours || !category) {
            throw new AppError('Missing required fields: activity, hours, and category are required', 400);
        }

        const pdEntry = await prisma.pDHour.create({
            data: {
                userId,
                activity,
                hours: parseFloat(hours),
                category,
                status: status || 'APPROVED',
                date: date ? new Date(date) : new Date()
            }
        });

        res.status(201).json({
            status: 'success',
            data: { pdEntry }
        });
    } catch (error: any) {
        console.error('Error creating PD entry:', error);
        res.status(error.statusCode || 500).json({
            status: 'error',
            message: error.message || 'Internal server error'
        });
    }
};
