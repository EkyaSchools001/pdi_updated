import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { AppError } from '../../infrastructure/utils/AppError';
import prisma from '../../infrastructure/database/prisma';
import { getIO } from '../../core/socket';

export const getAllDocuments = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const documents = await prisma.document.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                createdBy: {
                    select: { fullName: true }
                },
                acknowledgements: {
                    include: {
                        teacher: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true
                            }
                        }
                    }
                }
            }
        });

        res.status(200).json({
            status: 'success',
            results: documents.length,
            data: { documents }
        });
    } catch (err) {
        next(err);
    }
};

export const uploadDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const { title, description, fileUrl, fileName, fileSize, version, requiresSignature } = req.body;

        const document = await prisma.document.create({
            data: {
                title,
                description,
                fileUrl: fileUrl || 'assigned_manually',
                fileName: fileName || 'document.pdf',
                fileSize: Number(fileSize) || 0,
                version: version || '1.0',
                requiresSignature: !!requiresSignature,
                createdById: authReq.user!.id
            }
        });

        res.status(201).json({
            status: 'success',
            data: { document }
        });
    } catch (err) {
        next(err);
    }
};

export const assignDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { documentId, teacherIds } = req.body;

        if (!documentId || !Array.isArray(teacherIds)) {
            return next(new AppError('documentId and teacherIds array are required', 400));
        }

        const createdAcks = [];
        for (const teacherId of teacherIds) {
            const existing = await prisma.documentAcknowledgement.findFirst({
                where: { documentId, teacherId }
            });

            if (!existing) {
                const newAck = await prisma.documentAcknowledgement.create({
                    data: { documentId, teacherId },
                    include: {
                        document: true,
                        teacher: {
                            select: { fullName: true }
                        }
                    }
                });
                createdAcks.push(newAck);

                // Broadcast specifically to the teacher and generally to observers
                getIO().emit(`document:assigned:${teacherId}`, newAck);
                getIO().emit('document:assigned', newAck);
            }
        }

        res.status(200).json({
            status: 'success',
            count: createdAcks.length,
            data: { acknowledgements: createdAcks }
        });
    } catch (err) {
        next(err);
    }
};

export const getTeacherAcknowledgements = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const teacherId = authReq.user!.id;

        const acknowledgements = await prisma.documentAcknowledgement.findMany({
            where: { teacherId },
            include: {
                document: {
                    include: {
                        createdBy: {
                            select: { fullName: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({
            status: 'success',
            results: acknowledgements.length,
            data: { acknowledgements }
        });
    } catch (err) {
        next(err);
    }
};

export const acknowledgeDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const ackId = typeof req.params.ackId === 'string' ? req.params.ackId : req.params.ackId?.[0];
        if (!ackId) {
            return next(new AppError('Acknowledgement ID is required', 400));
        }
        const { hash, ipAddress, userAgent } = req.body;
        const ack = await prisma.documentAcknowledgement.findUnique({
            where: { id: ackId }
        });

        if (!ack) {
            return next(new AppError('Acknowledgement record not found', 404));
        }

        if (ack.teacherId !== authReq.user!.id) {
            return next(new AppError('You can only acknowledge your own documents', 403));
        }

        const updatedAck = await prisma.documentAcknowledgement.update({
            where: { id: ackId },
            data: {
                status: 'ACKNOWLEDGED',
                acknowledgedAt: new Date(),
                documentHash: hash,
                ipAddress: ipAddress || req.ip,
                userAgent: userAgent || (Array.isArray(req.headers['user-agent']) ? req.headers['user-agent'][0] : req.headers['user-agent'])
            },
            include: {
                teacher: {
                    select: { fullName: true }
                },
                document: true
            }
        });

        // Broadcast to admins
        getIO().emit('document:acknowledged', updatedAck);

        res.status(200).json({
            status: 'success',
            data: { acknowledgement: updatedAck }
        });
    } catch (err) {
        next(err);
    }
};

export const markAsViewed = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const ackId = typeof req.params.ackId === 'string' ? req.params.ackId : req.params.ackId?.[0];
        if (!ackId) {
            return next(new AppError('Acknowledgement ID is required', 400));
        }
        const { hash, ipAddress, userAgent } = req.body;
        console.log("MARK AS VIEWED CALLED WITH ackId:", ackId);
        const ack = await prisma.documentAcknowledgement.findUnique({
            where: { id: ackId }
        });

        if (!ack) {
            console.error("ACK NOT FOUND FOR ID:", ackId);
            return next(new AppError('Acknowledgement record not found', 404));
        }

        if (ack.teacherId !== authReq.user!.id) {
            return next(new AppError('You can only view your own documents', 403));
        }

        const updatedAck = await prisma.documentAcknowledgement.update({
            where: { id: ackId },
            data: {
                status: (ack.status === 'PENDING') ? 'VIEWED' : ack.status,
                viewedAt: ack.viewedAt || new Date()
            }
        });

        res.status(200).json({
            status: 'success',
            data: { acknowledgement: updatedAck }
        });
    } catch (err) {
        next(err);
    }
};

export const deleteDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = typeof req.params.id === 'string' ? req.params.id : req.params.id?.[0];
        if (!id) {
            return next(new AppError('Document ID is required', 400));
        }

        await prisma.document.delete({
            where: { id }
        });

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (err) {
        next(err);
    }
};
