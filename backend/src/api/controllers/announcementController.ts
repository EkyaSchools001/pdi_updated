import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { AppError } from '../../infrastructure/utils/AppError';
import prisma from '../../infrastructure/database/prisma';
import { getIO } from '../../core/socket';
import { createNotification } from './notificationController';

export const getAnnouncements = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role?.toUpperCase() || '';
        const userCampusId = req.user?.campusId;
        const userDepartment = req.user?.department;

        // Base query - only return PUBLISHED unless the user is a creator or admin
        // But for simplicity, we first fetch all then filter by RBAC or use complex Prisma query

        // Fetch all announcements that are either Published or were created by the user
        const announcements = await (prisma as any).announcement.findMany({
            where: {
                OR: [
                    { status: 'Published' },
                    { createdById: userId }
                ],
                // Admins/Management see everything eventually, but others only see Published
                ...(userRole !== 'ADMIN' && userRole !== 'SUPERADMIN' && userRole !== 'MANAGEMENT' ? {
                    status: 'Published'
                } : {})
            },
            include: {
                createdBy: {
                    select: {
                        fullName: true,
                        role: true
                    }
                },
                acknowledgements: {
                    where: {
                        userId: userId
                    }
                }
            },
            orderBy: [
                { isPinned: 'desc' },
                { priority: 'desc' },
                { createdAt: 'desc' }
            ]
        });

        // Filter based on Target Roles, Campuses, and Departments in memory for accuracy
        const filteredAnnouncements = announcements.filter((a: any) => {
            // Creators always see their own
            if (a.createdById === userId) return true;

            const targetRoles = JSON.parse(a.targetRoles || '[]');
            const targetCampuses = JSON.parse(a.targetCampuses || '[]');
            const targetDepartments = JSON.parse(a.targetDepartments || '[]');

            const roleMatch = targetRoles.length === 0 || targetRoles.includes(userRole);
            const campusMatch = targetCampuses.length === 0 || targetCampuses.includes(userCampusId) || targetCampuses.includes('ALL');
            const deptMatch = targetDepartments.length === 0 || targetDepartments.includes(userDepartment) || targetDepartments.includes('ALL');

            return roleMatch && campusMatch && deptMatch;
        });

        // Map to include a simple "isAcknowledged" flag
        const mappedAnnouncements = filteredAnnouncements.map((a: any) => ({
            ...a,
            isAcknowledged: a.acknowledgements.length > 0,
            acknowledgements: undefined // Don't send the full array
        }));

        res.status(200).json({
            status: 'success',
            data: mappedAnnouncements
        });
    } catch (err) {
        next(err);
    }
};

export const createAnnouncement = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { title, description, priority, targetRoles, targetDepartments, targetCampuses, expiryDate, status } = req.body;
        const userId = req.user?.id;
        const userRole = req.user?.role || '';

        if (!userId) {
            return next(new AppError('User not authenticated', 401));
        }

        const announcement = await (prisma as any).announcement.create({
            data: {
                title,
                description,
                priority: priority || 'Normal',
                status: status || 'Published',
                isPinned: req.body.isPinned || false,
                targetRoles: Array.isArray(targetRoles) ? JSON.stringify(targetRoles) : targetRoles || '[]',
                targetDepartments: Array.isArray(targetDepartments) ? JSON.stringify(targetDepartments) : targetDepartments || '[]',
                targetCampuses: Array.isArray(targetCampuses) ? JSON.stringify(targetCampuses) : targetCampuses || '[]',
                expiryDate: expiryDate ? new Date(expiryDate) : null,
                createdById: userId,
                role: userRole
            },
            include: {
                createdBy: {
                    select: {
                        fullName: true,
                        role: true
                    }
                }
            }
        });

        // If published, notify users
        if (announcement.status === 'Published') {
            // Emit socket event to all (for immediate UI updates if they match)
            getIO().emit('announcement:new', announcement);

            // Create individual notifications for the targeted users
            const parsedRoles = Array.isArray(targetRoles) ? targetRoles : JSON.parse(targetRoles || '[]');
            const parsedCampuses = Array.isArray(targetCampuses) ? targetCampuses : JSON.parse(targetCampuses || '[]');
            const parsedDepts = Array.isArray(targetDepartments) ? targetDepartments : JSON.parse(targetDepartments || '[]');

            // Determine targeting filters
            const userFilters: any[] = [];
            if (parsedRoles.length > 0) userFilters.push({ role: { in: parsedRoles } });
            if (parsedCampuses.length > 0 && !parsedCampuses.includes('ALL')) userFilters.push({ campusId: { in: parsedCampuses } });
            if (parsedDepts.length > 0 && !parsedDepts.includes('ALL')) userFilters.push({ department: { in: parsedDepts } });

            // Fetch target users
            const targetUsers = await prisma.user.findMany({
                where: userFilters.length > 0 ? { AND: userFilters } : {}
            });

            // Create notifications in background
            targetUsers.forEach(user => {
                if (user.id !== userId) { // Don't notify the creator
                    createNotification({
                        userId: user.id,
                        title: `New Announcement: ${title}`,
                        message: description.substring(0, 100) + (description.length > 100 ? '...' : ''),
                        type: priority === 'High' ? 'WARNING' : 'INFO',
                        link: '/announcements'
                    });
                }
            });
        }

        res.status(201).json({
            status: 'success',
            data: announcement
        });
    } catch (err) {
        next(err);
    }
};

export const updateAnnouncement = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const userRole = req.user?.role?.toUpperCase() || '';

        const existing = await (prisma as any).announcement.findUnique({
            where: { id }
        });

        if (!existing) {
            return next(new AppError('Announcement not found', 404));
        }

        // RBAC Check: Only creator or high roles can edit
        const isCreator = existing.createdById === userId;
        const isAdmin = ['ADMIN', 'SUPERADMIN', 'MANAGEMENT'].includes(userRole);

        if (!isCreator && !isAdmin) {
            return next(new AppError('You do not have permission to edit this announcement', 403));
        }

        const updated = await (prisma as any).announcement.update({
            where: { id },
            data: {
                ...req.body,
                updatedAt: new Date()
            },
            include: {
                createdBy: {
                    select: {
                        fullName: true,
                        role: true
                    }
                }
            }
        });

        res.status(200).json({
            status: 'success',
            data: updated
        });
    } catch (err) {
        next(err);
    }
};

export const deleteAnnouncement = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const userRole = req.user?.role?.toUpperCase() || '';

        const existing = await (prisma as any).announcement.findUnique({
            where: { id }
        });

        if (!existing) {
            return next(new AppError('Announcement not found', 404));
        }

        // RBAC Check
        const isCreator = existing.createdById === userId;
        const isAdmin = ['ADMIN', 'SUPERADMIN', 'MANAGEMENT'].includes(userRole);

        // Management can delete anything except PDI (system) if we had that logic
        // For now, creators and admins/management can delete.
        if (!isCreator && !isAdmin) {
            return next(new AppError('You do not have permission to delete this announcement', 403));
        }

        await (prisma as any).announcement.delete({
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

export const acknowledgeAnnouncement = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        if (!userId) return next(new AppError('User not authenticated', 401));

        // Create acknowledgement only if it doesn't exist
        const ack = await (prisma as any).announcementAcknowledgement.upsert({
            where: {
                announcementId_userId: {
                    announcementId: id,
                    userId: userId
                }
            },
            update: {
                acknowledgedAt: new Date()
            },
            create: {
                announcementId: id,
                userId: userId
            }
        });

        res.status(200).json({
            status: 'success',
            data: ack
        });
    } catch (err) {
        next(err);
    }
};

export const getAnnouncementStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const announcement = await (prisma as any).announcement.findUnique({
            where: { id },
            include: {
                acknowledgements: {
                    include: {
                        user: {
                            select: {
                                fullName: true,
                                role: true,
                                campusId: true
                            }
                        }
                    }
                }
            }
        });

        if (!announcement) {
            return next(new AppError('Announcement not found', 404));
        }

        res.status(200).json({
            status: 'success',
            data: {
                count: announcement.acknowledgements.length,
                users: announcement.acknowledgements.map((ack: any) => ack.user)
            }
        });
    } catch (err) {
        next(err);
    }
};
