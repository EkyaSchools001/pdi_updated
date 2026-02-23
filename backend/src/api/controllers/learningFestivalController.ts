import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getFestivals = async (req: Request, res: Response) => {
    try {
        const festivals = await prisma.learningFestival.findMany({
            orderBy: { startDate: 'desc' }
        });
        res.json(festivals);
    } catch (error) {
        console.error('Error fetching learning festivals:', error);
        res.status(500).json({ error: 'Failed to fetch learning festivals' });
    }
};

export const createFestival = async (req: Request, res: Response) => {
    try {
        const { name, theme, description, startDate, endDate, applyDeadline, eligibilityRules, campusLimits } = req.body;
        const newFestival = await prisma.learningFestival.create({
            data: {
                name,
                theme,
                description,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                applyDeadline: new Date(applyDeadline),
                eligibilityRules: JSON.stringify(eligibilityRules || {}),
                campusLimits: JSON.stringify(campusLimits || {}),
                status: 'Upcoming'
            },
        });
        res.status(201).json(newFestival);
    } catch (error) {
        console.error('Error creating learning festival:', error);
        res.status(500).json({ error: 'Failed to create learning festival' });
    }
};

export const updateFestival = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, theme, description, startDate, endDate, applyDeadline, status, eligibilityRules, campusLimits } = req.body;
        const updated = await prisma.learningFestival.update({
            where: { id: id as string },
            data: {
                name,
                theme,
                description,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                applyDeadline: applyDeadline ? new Date(applyDeadline) : undefined,
                status,
                eligibilityRules: eligibilityRules !== undefined ? JSON.stringify(eligibilityRules) : undefined,
                campusLimits: campusLimits !== undefined ? JSON.stringify(campusLimits) : undefined,
            },
        });
        res.json(updated);
    } catch (error) {
        console.error('Error updating learning festival:', error);
        res.status(500).json({ error: 'Failed to update learning festival' });
    }
};

export const applyToFestival = async (req: Request, res: Response) => {
    try {
        const { id: festivalId } = req.params;
        const userId = (req as any).user.id;
        const { statementOfPurpose, relevantExperience, preferredStrand, documents } = req.body;

        const existingApplication = await prisma.learningFestivalApplication.findFirst({
            where: { festivalId: festivalId as string, userId }
        });

        if (existingApplication) {
            return res.status(400).json({ error: 'You have already applied for this festival.' });
        }

        const application = await prisma.learningFestivalApplication.create({
            data: {
                festivalId: festivalId as string,
                userId,
                statementOfPurpose,
                relevantExperience,
                preferredStrand,
                documents: JSON.stringify(documents || []),
                status: 'Submitted',
                appliedAt: new Date(),
            }
        });
        res.status(201).json(application);
    } catch (error) {
        console.error('Error applying to learning festival:', error);
        res.status(500).json({ error: 'Failed to submit application' });
    }
};

export const getApplications = async (req: Request, res: Response) => {
    try {
        const userRole = (req as any).user.role;
        const userCampusId = (req as any).user.campusId;
        const { festivalId } = req.query;

        let whereClause: any = {};
        if (festivalId) {
            whereClause.festivalId = festivalId as string;
        }

        // Role-based visibility
        if (userRole === 'TEACHER') {
            whereClause.userId = (req as any).user.id; // Only their own
        } else if (userRole === 'LEADER' || userRole === 'ACADEMIC_COORDINATOR' || userRole === 'COORDINATOR' || userRole === 'HOS') {
            // Only campus teachers
            whereClause.user = { campusId: userCampusId };
        }
        // Admin, SUPERADMIN see all (no user scope restriction)

        const applications = await prisma.learningFestivalApplication.findMany({
            where: whereClause,
            include: {
                user: {
                    select: { fullName: true, email: true, role: true, campusId: true, department: true }
                },
                festival: {
                    select: { name: true, theme: true }
                }
            },
            orderBy: { appliedAt: 'desc' }
        });
        res.json(applications);
    } catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
};

export const updateApplicationStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, feedback } = req.body;
        const reviewerId = (req as any).user.id;

        const application = await prisma.learningFestivalApplication.update({
            where: { id: id as string },
            data: {
                status,
                feedback,
                reviewedById: reviewerId,
                reviewedAt: new Date(),
            },
            include: {
                user: { select: { fullName: true, email: true } },
                festival: { select: { name: true } }
            }
        });

        res.json(application);
    } catch (error) {
        console.error('Error updating application status:', error);
        res.status(500).json({ error: 'Failed to update application status' });
    }
};

export const getEngagementAnalytics = async (req: Request, res: Response) => {
    try {
        // A simplified version. Real version would aggregate courses & festival participation
        const summary = await prisma.learningFestivalApplication.groupBy({
            by: ['status'],
            _count: { id: true }
        });
        res.json(summary);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
};
