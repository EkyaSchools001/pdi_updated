import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { AppError } from '../../infrastructure/utils/AppError';
import prisma from '../../infrastructure/database/prisma';
import { getIO } from '../../core/socket';

export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.id;

        if (!userId) return next(new AppError('User not authenticated', 401));

        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        res.status(200).json({
            status: 'success',
            results: notifications.length,
            data: { notifications }
        });
    } catch (err) {
        next(err);
    }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params as { id: string };
        const authReq = req as AuthRequest;
        const userId = authReq.user?.id;

        const notification = await prisma.notification.findUnique({ where: { id } });

        if (!notification) return next(new AppError('Notification not found', 404));
        if (notification.userId !== userId) return next(new AppError('You are not authorized to access this notification', 403));

        const updatedNotification = await prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });

        res.status(200).json({
            status: 'success',
            data: { notification: updatedNotification }
        });
    } catch (err) {
        next(err);
    }
};

export const markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.id;

        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        });

        res.status(200).json({
            status: 'success',
            message: 'All notifications marked as read'
        });
    } catch (err) {
        next(err);
    }
};

export const deleteNotification = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params as { id: string };
        const authReq = req as AuthRequest;
        const userId = authReq.user?.id;

        const notification = await prisma.notification.findUnique({ where: { id } });

        if (!notification) return next(new AppError('Notification not found', 404));
        if (notification.userId !== userId) return next(new AppError('You are not authorized to delete this notification', 403));

        await prisma.notification.delete({ where: { id } });

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Utility function to create a notification (to be used by other controllers)
 */
export const createNotification = async (data: {
    userId: string;
    title: string;
    message: string;
    type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
    link?: string;
}) => {
    try {
        const notification = await prisma.notification.create({
            data: {
                userId: data.userId,
                title: data.title,
                message: data.message,
                type: data.type || 'INFO',
                link: data.link
            }
        });

        // Emit socket event
        getIO().to(`user:${data.userId}`).emit('notification:new', notification);

        return notification;
    } catch (err) {
        console.error('Failed to create notification', err);
        return null;
    }
};
