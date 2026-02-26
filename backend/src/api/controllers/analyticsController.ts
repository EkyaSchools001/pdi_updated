import { Request, Response } from 'express';
import prisma from '../../infrastructure/database/prisma';



export const getCampusEngagement = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const role = user.role;
        const userCampusId = user.campusId;

        let whereClause: any = {};

        // Campus scoping
        if (role !== 'SUPERADMIN' && role !== 'ADMIN' && role !== 'MANAGEMENT') {
            if (!userCampusId) {
                return res.status(403).json({ error: 'Campus ID not found for this user.' });
            }
            whereClause.campusId = userCampusId;
        }

        // We only want data for TEACHER roles in this context
        whereClause.role = 'TEACHER';

        // Fetch teachers in scope with their course enrollments
        const teachers = await prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                fullName: true,
                email: true,
                department: true,
                campusId: true,
                status: true,
                lastActive: true,
                enrollments: {
                    select: {
                        courseId: true,
                        progress: true
                    }
                },
                pdHours: { // Just basic activity check if they have done any PD
                    select: { id: true }
                }
            }
        });

        const teacherEngagements = teachers.map(teacher => {
            const enrollments = teacher.enrollments || [];
            const totalEnrolled = enrollments.length;
            const totalCompleted = enrollments.filter(e => e.progress === 100).length;
            const engagementPercent = totalEnrolled > 0 ? Math.round((totalCompleted / totalEnrolled) * 100) : 0;

            // Assume active if they have enrollments or logged PD hours
            const isActive = totalEnrolled > 0 || (teacher.pdHours && teacher.pdHours.length > 0) || teacher.status === 'Active';
            const lastActivityDate = teacher.lastActive; // Use the actual DB field

            return {
                id: teacher.id,
                name: teacher.fullName,
                email: teacher.email,
                role: teacher.department ? `${teacher.department} Teacher` : 'Teacher',
                campusId: teacher.campusId,
                coursesEnrolled: totalEnrolled,
                coursesCompleted: totalCompleted,
                engagementPercent,
                isActive,
                lastActivityDate: null // Placeholder for UI
            };
        });

        // Calculate campus averages
        const totalTeachers = teacherEngagements.length;
        const activeTeachersCount = teacherEngagements.filter(t => t.isActive).length;
        const overallEngagement = totalTeachers > 0
            ? Math.round(teacherEngagements.reduce((acc, t) => acc + t.engagementPercent, 0) / totalTeachers)
            : 0;

        res.json({
            summary: {
                campusAverageEngagement: overallEngagement,
                totalTeachersEnrolled: teacherEngagements.filter(t => t.coursesEnrolled > 0).length,
                totalTeachersActive: activeTeachersCount,
                averageCourseCompletionRate: overallEngagement // Usually the same logic for simplicity unless defined differently
            },
            teachers: teacherEngagements
        });

    } catch (error) {
        console.error('Error fetching campus engagement analytics:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
};
