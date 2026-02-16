import { Response } from 'express';
import prisma from '../../infrastructure/database/prisma';
import { AppError } from '../../infrastructure/utils/AppError';
import { AuthRequest } from '../middlewares/auth';

export const getAllTrainingEvents = async (req: AuthRequest, res: Response) => {
    try {
        const events = await prisma.trainingEvent.findMany({
            include: {
                registrations: {
                    include: {
                        user: {
                            select: {
                                fullName: true,
                                role: true
                            }
                        }
                    }
                }
            },
            orderBy: { date: 'asc' }
        });

        res.status(200).json({
            status: 'success',
            data: { events }
        });
    } catch (error: any) {
        console.error('Error fetching training events:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

export const createTrainingEvent = async (req: AuthRequest, res: Response) => {
    try {
        const { title, topic, type, date, time, location, capacity, description, objectives, status, proposedById } = req.body;

        if (!title || !date || !location) {
            return res.status(400).json({
                status: 'error',
                message: 'Missing required fields: title, date, and location are required'
            });
        }

        const event = await prisma.trainingEvent.create({
            data: {
                title,
                topic,
                type,
                date,
                time,
                location,
                capacity: capacity ? parseInt(capacity.toString()) : 30, // Default to 30 if not provided
                description,
                objectives,
                status: status || 'PLANNED',
                proposedById: proposedById || req.user?.id
            }
        });

        res.status(201).json({
            status: 'success',
            data: { event }
        });
    } catch (error: any) {
        console.error('Error creating training event:', error);
        res.status(error.statusCode || 500).json({
            status: 'error',
            message: error.message || 'Internal server error'
        });
    }
};

export const registerForEvent = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { eventId } = req.params;

        if (!userId) {
            throw new AppError('Authentication required', 401);
        }

        const registration = await prisma.registration.create({
            data: {
                userId,
                eventId: eventId as string,
            }
        });

        res.status(200).json({
            status: 'success',
            data: { registration }
        });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(400).json({
                status: 'error',
                message: 'Already registered for this event'
            });
        }
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};


export const updateEventStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const event = await prisma.trainingEvent.update({
            where: { id: id as string },
            data: { status }
        });

        res.status(200).json({
            status: 'success',
            data: { event }
        });
    } catch (error: any) {
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};


export const deleteTrainingEvent = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        // Manual cascade: Delete all registrations for this event first
        await prisma.registration.deleteMany({
            where: { eventId: id as string }
        });

        await prisma.trainingEvent.delete({
            where: { id: id as string }
        });

        res.status(200).json({
            status: 'success',
            data: null
        });
    } catch (error: any) {
        console.error('Error deleting training event:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

export const updateTrainingEvent = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { title, topic, type, date, time, location, capacity, description, objectives, status } = req.body;

        const event = await prisma.trainingEvent.update({
            where: { id: id as string },
            data: {
                title,
                topic,
                type,
                date,
                time,
                location,
                capacity: capacity ? parseInt(capacity) : undefined,
                description,
                objectives,
                status
            }
        });

        res.status(200).json({
            status: 'success',
            data: { event }
        });
    } catch (error: any) {
        console.error('Error updating training event:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};
