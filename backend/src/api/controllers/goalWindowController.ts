import { Request, Response, NextFunction } from 'express';
import prisma from '../../infrastructure/database/prisma';
import { AppError } from '../../infrastructure/utils/AppError';

export const getGoalWindows = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const windows = await prisma.goalWindow.findMany({
            orderBy: { phase: 'asc' }
        });

        // Initialize if empty (first time)
        if (windows.length === 0) {
            const initialPhases = ['SELF_REFLECTION', 'GOAL_SETTING', 'GOAL_COMPLETION'];
            for (const phase of initialPhases) {
                await prisma.goalWindow.create({
                    data: { phase, status: 'CLOSED' }
                });
            }
            const reFetched = await prisma.goalWindow.findMany({ orderBy: { phase: 'asc' } });
            return res.status(200).json({ status: 'success', data: { windows: reFetched } });
        }

        res.status(200).json({
            status: 'success',
            data: { windows }
        });
    } catch (err) {
        next(err);
    }
};

export const updateGoalWindow = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const phase = req.params.phase as string;
        const { status, startDate, endDate } = req.body;

        const window = await prisma.goalWindow.update({
            where: { phase },
            data: {
                status,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined
            }
        });

        res.status(200).json({
            status: 'success',
            data: { window }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Utility to check if a window is currently open
 */
export const isWindowOpen = async (phase: string): Promise<boolean> => {
    const window = await prisma.goalWindow.findUnique({ where: { phase } });
    if (!window || window.status === 'CLOSED') return false;

    const now = new Date();
    if (window.startDate && now < window.startDate) return false;
    if (window.endDate && now > window.endDate) return false;

    return true;
};
