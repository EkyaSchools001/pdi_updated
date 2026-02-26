import { Request, Response, NextFunction } from 'express';
import prisma from '../../infrastructure/database/prisma';
import { AppError } from '../../infrastructure/utils/AppError';
import { getIO } from '../../core/socket';
import { invalidateAccessMatrixCache } from '../middlewares/accessControl';



// Get all settings
export const getAllSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const settings = await prisma.systemSettings.findMany({
            orderBy: { updatedAt: 'desc' }
        });

        res.status(200).json({
            status: 'success',
            results: settings.length,
            data: { settings }
        });
    } catch (err) {
        next(err);
    }
};

// Get a setting by key
export const getSetting = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const key = Array.isArray(req.params.key) ? req.params.key[0] : req.params.key;

        const setting = await prisma.systemSettings.findUnique({
            where: { key }
        });

        if (!setting) {
            // Provide a default access_matrix_config if not yet initialized
            if (key === 'access_matrix_config') {
                return res.status(200).json({
                    status: 'success',
                    data: {
                        setting: {
                            key: 'access_matrix_config',
                            value: JSON.stringify({ accessMatrix: [], formFlows: [] })
                        }
                    }
                });
            }
            return next(new AppError('Setting not found', 404));
        }

        res.status(200).json({
            status: 'success',
            data: { setting }
        });
    } catch (err) {
        next(err);
    }
};

// Upsert a setting (create or update)
export const upsertSetting = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { key, value } = req.body;

        console.log(`[SETTINGS] Upserting key: ${key}`);

        const previousSetting = await prisma.systemSettings.findUnique({ where: { key } });

        const setting = await prisma.systemSettings.upsert({
            where: { key },
            update: {
                value: JSON.stringify(value)
            },
            create: {
                key,
                value: JSON.stringify(value)
            }
        });

        // Write to Action Audit Log
        if ((req as any).user) {
            await prisma.auditLog.create({
                data: {
                    actorId: (req as any).user.id || 'system',
                    actorName: (req as any).user.fullName || (req as any).user.role || 'SuperAdmin',
                    action: previousSetting ? 'UPDATED_SETTING' : 'CREATED_SETTING',
                    targetEntity: 'SystemSettings',
                    previousData: previousSetting ? previousSetting.value : null,
                    newData: setting.value,
                }
            });
            console.log(`[AUDIT] Action logged: ${key} by ${(req as any).user.id}`);
        }

        // Broadcast the update via Socket.io
        try {
            const io = getIO();
            const broadcastData = { key, value };
            console.log(`[SOCKET] Broadcasting SETTINGS_UPDATED:`, broadcastData);
            io.emit('SETTINGS_UPDATED', broadcastData);
            console.log(`[SOCKET] Broadcast complete to all clients`);
        } catch (socketErr) {
            console.error('[SOCKET] Failed to broadcast setting update:', socketErr);
        }

        // Immediately invalidate backend access matrix cache so API routes
        // use the new permissions on the very next request
        if (key === 'access_matrix_config') {
            invalidateAccessMatrixCache();
        }

        res.status(200).json({
            status: 'success',
            data: { setting }
        });
    } catch (err) {
        next(err);
    }
};

// Delete a setting
export const deleteSetting = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const key = Array.isArray(req.params.key) ? req.params.key[0] : req.params.key;

        await prisma.systemSettings.delete({
            where: { key }
        });

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (err) {
        next(err);
    }
};
