import { Request, Response, NextFunction } from 'express';
import prisma from '../../infrastructure/database/prisma';

const CAMPUS_OPTIONS = [
    "CMR NPS", "EJPN", "EITPL", "EBTM", "EBYR", "ENICE", "ENAVA",
    "PU BTM", "PU BYR", "PU HRBR", "PU ITPL", "PU NICE", "HO"
];
export const getAvgHoursPerSchool = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const teachers = await prisma.user.findMany({
            where: { role: 'TEACHER' },
            select: { id: true, campusId: true }
        });

        const pdHours = await prisma.pDHour.findMany({
            where: { status: 'APPROVED' },
            select: { userId: true, hours: true }
        });

        // Group hours by userId
        const userHours: Record<string, number> = {};
        pdHours.forEach(h => {
            userHours[h.userId] = (userHours[h.userId] || 0) + h.hours;
        });

        // Group by Campus
        const campusData: Record<string, { totalHours: number, teacherCount: number }> = {};
        teachers.forEach(t => {
            const campus = t.campusId || 'Unassigned';
            if (!campusData[campus]) {
                campusData[campus] = { totalHours: 0, teacherCount: 0 };
            }
            campusData[campus].teacherCount++;
            campusData[campus].totalHours += userHours[t.id] || 0;
        });

        const results = Object.entries(campusData).map(([campus, data]) => ({
            campus,
            avgHours: data.teacherCount > 0 ? parseFloat((data.totalHours / data.teacherCount).toFixed(2)) : 0,
            teacherCount: data.teacherCount
        }));

        res.status(200).json({
            status: 'success',
            data: { results }
        });
    } catch (error) {
        next(error);
    }
};

export const getTeacherHoursDetails = async (req: Request, res: Response, next: NextFunction) => {
    const { campusId } = req.params;
    try {
        const teachers = await prisma.user.findMany({
            where: {
                role: 'TEACHER',
                campusId: campusId === 'Unassigned' ? null : campusId
            } as any,
            include: {
                pdHours: {
                    where: { status: 'APPROVED' }
                }
            }
        });

        const results = (teachers as any[]).map(t => ({
            id: t.id,
            fullName: t.fullName,
            email: t.email,
            totalHours: t.pdHours.reduce((sum: number, h: any) => sum + h.hours, 0)
        }));

        res.status(200).json({
            status: 'success',
            data: { teachers: results }
        });
    } catch (error) {
        next(error);
    }
};

export const getCutoffStats = async (req: Request, res: Response, next: NextFunction) => {
    const cutoff = parseInt(req.query.cutoff as string) || 20;
    try {
        const teachers = await prisma.user.findMany({
            where: { role: 'TEACHER' },
            select: {
                id: true,
                campusId: true,
                pdHours: {
                    where: { status: 'APPROVED' },
                    select: { hours: true }
                }
            }
        });

        const campusStats: Record<string, { above: number, below: number, total: number }> = {};

        CAMPUS_OPTIONS.forEach(c => {
            campusStats[c] = { above: 0, below: 0, total: 0 };
        });

        (teachers as any[]).forEach(t => {
            const campus = t.campusId || 'Unassigned';
            const totalHours = t.pdHours.reduce((sum: number, h: any) => sum + h.hours, 0);

            if (!campusStats[campus]) {
                campusStats[campus] = { above: 0, below: 0, total: 0 };
            }

            if (totalHours >= cutoff) {
                campusStats[campus].above++;
            } else {
                campusStats[campus].below++;
            }
            campusStats[campus].total++;
        });

        const results = Object.entries(campusStats)
            .filter(([campus, stats]) => CAMPUS_OPTIONS.includes(campus) || stats.total > 0)
            .map(([campus, stats]) => ({
                campus,
                abovePercent: stats.total > 0 ? parseFloat(((stats.above / stats.total) * 100).toFixed(1)) : 0,
                belowPercent: stats.total > 0 ? parseFloat(((stats.below / stats.total) * 100).toFixed(1)) : 0,
                total: stats.total
            }));

        res.status(200).json({
            status: 'success',
            data: { results, cutoff }
        });
    } catch (error) {
        next(error);
    }
};

export const getAttendanceAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const events = await prisma.trainingEvent.findMany({
            include: {
                registrations: true,
                attendanceRecords: {
                    where: { status: true }
                }
            }
        });

        const results = (events as any[]).map(e => ({
            id: e.id,
            title: e.title,
            date: e.date,
            registered: e.registrations.length,
            attended: e.attendanceRecords.length,
            attendanceRate: e.registrations.length > 0
                ? parseFloat(((e.attendanceRecords.length / e.registrations.length) * 100).toFixed(1))
                : 0
        }));

        res.status(200).json({
            status: 'success',
            data: { events: results }
        });
    } catch (error) {
        next(error);
    }
};

export const getCampusAttendanceAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const events = await prisma.trainingEvent.findMany({
            include: {
                registrations: {
                    include: {
                        user: { select: { campusId: true } }
                    }
                },
                attendanceRecords: {
                    where: { status: true }
                }
            }
        });

        const campusStats: Record<string, { registered: number, attended: number }> = {};
        CAMPUS_OPTIONS.forEach(c => {
            campusStats[c] = { registered: 0, attended: 0 };
        });

        (events as any[]).forEach(event => {
            // Group registrations by campus
            event.registrations.forEach((reg: any) => {
                const campus = reg.user?.campusId || 'Unassigned';
                if (!campusStats[campus]) campusStats[campus] = { registered: 0, attended: 0 };
                campusStats[campus].registered++;
            });

            // Group attendance by campus
            // attendanceRecords doesn't directly give us campusId reliably, so we match teacherEmail
            // with our registrations to find their campus, or just use the schoolId attached to the attendance
            event.attendanceRecords.forEach((att: any) => {
                const regMatch = event.registrations.find((r: any) => r.user.email === att.teacherEmail || r.user.id === att.teacherId);
                const campus = regMatch?.user?.campusId || att.schoolId || 'Unassigned';

                if (!campusStats[campus]) campusStats[campus] = { registered: 0, attended: 0 };
                campusStats[campus].attended++;
            });
        });

        const results = Object.entries(campusStats)
            .filter(([campus, stats]) => CAMPUS_OPTIONS.includes(campus) || stats.registered > 0 || stats.attended > 0)
            .map(([campus, stats]) => {
                const rate = stats.registered > 0
                    ? Math.min(100, (stats.attended / stats.registered) * 100)
                    : 100;

                return {
                    campus,
                    registered: stats.registered,
                    attended: stats.attended,
                    attendancePercent: stats.registered > 0 ? parseFloat(rate.toFixed(1)) : 0
                };
            });

        res.status(200).json({
            status: 'success',
            data: { results }
        });
    } catch (error) {
        next(error);
    }
};

export const getEventAttendees = async (req: Request, res: Response, next: NextFunction) => {
    const { eventId } = req.params;
    try {
        const attendance = await prisma.eventAttendance.findMany({
            where: {
                eventId: eventId as string,
                status: true
            } as any,
            select: {
                teacherName: true,
                teacherEmail: true,
                submittedAt: true
            }
        });

        res.status(200).json({
            status: 'success',
            data: { attendees: attendance }
        });
    } catch (error) {
        next(error);
    }
};

export const getFeedbackAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let eventStats: any[] = [];
        let globalAvg = 0;

        try {
            const events = await prisma.trainingEvent.findMany({
                include: {
                    feedbacks: true
                } as any
            });

            eventStats = (events as any[]).map(e => ({
                id: e.id,
                title: e.title,
                avgRating: e.feedbacks?.length > 0
                    ? parseFloat((e.feedbacks.reduce((sum: number, f: any) => sum + f.rating, 0) / e.feedbacks.length).toFixed(1))
                    : 0,
                feedbackCount: e.feedbacks?.length || 0
            }));

            const allFeedbacks = await (prisma as any).trainingFeedback.findMany();
            globalAvg = allFeedbacks.length > 0
                ? parseFloat((allFeedbacks.reduce((sum: number, f: any) => sum + f.rating, 0) / allFeedbacks.length).toFixed(1))
                : 0;
        } catch (dbError) {
            console.warn("Feedback data not found or schema missing, defaulting to zero");
        }

        res.status(200).json({
            status: 'success',
            data: {
                events: eventStats,
                globalAverage: globalAvg
            }
        });
    } catch (error) {
        next(error);
    }
};

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

        const teacherEngagements = (teachers as any[]).map(teacher => {
            const enrollments = teacher.enrollments || [];
            const totalEnrolled = enrollments.length;
            const totalCompleted = enrollments.filter((e: any) => e.progress === 100).length;
            const engagementPercent = totalEnrolled > 0 ? Math.round((totalCompleted / totalEnrolled) * 100) : 0;

            // Assume active if they have enrollments or logged PD hours
            const isActive = totalEnrolled > 0 || (teacher.pdHours && teacher.pdHours.length > 0) || teacher.status === 'Active';

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
                lastActivityDate: teacher.lastActive
            };
        });

        // Calculate campus averages
        const totalTeachers = teacherEngagements.length;
        const activeTeachersCount = teacherEngagements.filter(t => t.isActive).length;
        const overallEngagement = totalTeachers > 0
            ? Math.round(teacherEngagements.reduce((acc: number, t: any) => acc + t.engagementPercent, 0) / totalTeachers)
            : 0;

        res.json({
            status: 'success',
            data: {
                summary: {
                    campusAverageEngagement: overallEngagement,
                    totalTeachersEnrolled: teacherEngagements.filter(t => t.coursesEnrolled > 0).length,
                    totalTeachersActive: activeTeachersCount,
                    averageCourseCompletionRate: overallEngagement
                },
                teachers: teacherEngagements
            }
        });

    } catch (error) {
        console.error('Error fetching campus engagement analytics:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
};
