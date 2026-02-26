import { Request, Response } from 'express';
import prisma from '../../infrastructure/database/prisma';



export const getOKRData = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { id: userId, role, campusId } = user;

        const isAdmin = role === 'ADMIN' || role === 'SUPERADMIN';
        const isManagement = role === 'MANAGEMENT';
        const isHOS = role === 'SCHOOL_LEADER' || role === 'LEADER';
        const isTeacher = role === 'TEACHER';

        // ---------------------------------------------------------------
        // TEACHER view
        // ---------------------------------------------------------------
        if (isTeacher) {
            const [observations, goals, moocSubmissions, pdHours, eventAttendances, courseEnrollments] = await Promise.all([
                prisma.observation.findMany({
                    where: { teacherId: userId },
                    select: { score: true, hasReflection: true, teacherReflection: true, date: true }
                }),
                prisma.goal.findMany({
                    where: { teacherId: userId },
                    select: { status: true }
                }),
                prisma.moocSubmission.findMany({
                    where: { userId, status: 'APPROVED' },
                    select: { hours: true, effectivenessRating: true }
                }),
                prisma.pDHour.findMany({
                    where: { userId },
                    select: { hours: true }
                }),
                prisma.eventAttendance.findMany({
                    where: { teacherId: userId },
                    select: { eventId: true }
                }),
                prisma.courseEnrollment.findMany({
                    where: { userId },
                    select: { progress: true, status: true }
                }),
            ]);

            const avgObsScore = observations.length > 0
                ? observations.reduce((a, b) => a + b.score, 0) / observations.length
                : null;

            const reflectionCount = observations.filter(o => o.hasReflection || (o.teacherReflection && o.teacherReflection.length > 0)).length;
            const reflectionRate = observations.length > 0 ? (reflectionCount / observations.length) * 100 : 0;

            const totalPDHours = [
                ...moocSubmissions.map(m => m.hours),
                ...pdHours.map(p => p.hours),
            ].reduce((a, b) => a + b, 0);

            const targetPDHours = 20;
            const pdHoursPending = Math.max(0, targetPDHours - totalPDHours);

            const goalsCompleted = goals.filter(g => g.status === 'COMPLETED').length;
            const goalsTotal = goals.length;

            const selfPacedEngagement = courseEnrollments.length > 0
                ? courseEnrollments.reduce((a, b) => a + b.progress, 0) / courseEnrollments.length
                : null;

            return res.status(200).json({
                status: 'success',
                role: 'TEACHER',
                data: {
                    selfReflectionRate: Math.round(reflectionRate),
                    totalObservations: observations.length,
                    avgObservationScore: avgObsScore !== null ? parseFloat(avgObsScore.toFixed(2)) : null,
                    pdHoursCompleted: parseFloat(totalPDHours.toFixed(1)),
                    pdHoursPending: parseFloat(pdHoursPending.toFixed(1)),
                    pdTargetHours: targetPDHours,
                    goalsCompleted,
                    goalsTotal,
                    selfPacedEngagement: selfPacedEngagement !== null ? Math.round(selfPacedEngagement) : null,
                }
            });
        }

        // ---------------------------------------------------------------
        // HOS (School Leader / Leader) view
        // ---------------------------------------------------------------
        if (isHOS) {
            const [campusUsers, allObservations, allGoals, allMoocSubs, allPDHours] = await Promise.all([
                prisma.user.findMany({
                    where: { campusId, role: 'TEACHER' },
                    select: { id: true, fullName: true, email: true }
                }),
                prisma.observation.findMany({
                    where: { teacher: { campusId } },
                    select: { teacherId: true, observerId: true, score: true, hasReflection: true, teacherReflection: true }
                }),
                prisma.goal.findMany({
                    where: { teacher: { campusId } },
                    select: { teacherId: true, status: true }
                }),
                prisma.moocSubmission.findMany({
                    where: { user: { campusId }, status: 'APPROVED' },
                    select: { userId: true, hours: true }
                }),
                prisma.pDHour.findMany({
                    where: { user: { campusId } },
                    select: { userId: true, hours: true }
                }),
            ]);

            const teacherIds = campusUsers.map(u => u.id);
            const observedTeacherIds = new Set(allObservations.map(o => o.teacherId));
            const teachersObserved = teacherIds.filter(id => observedTeacherIds.has(id)).length;
            const teachersNotObserved = teacherIds.length - teachersObserved;

            const avgObsPerTeacher = teacherIds.length > 0 ? allObservations.length / teacherIds.length : 0;
            const avgObsScore = allObservations.length > 0
                ? allObservations.reduce((a, b) => a + b.score, 0) / allObservations.length
                : null;

            // Observations per observer
            const observerMap: Record<string, number> = {};
            allObservations.forEach(o => {
                observerMap[o.observerId] = (observerMap[o.observerId] || 0) + 1;
            });
            const observationTargetPerObserver = 10; // configurable
            const observerCompletion = Object.entries(observerMap).map(([observerId, count]) => ({
                observerId,
                count,
                targetCompletion: Math.min(100, Math.round((count / observationTargetPerObserver) * 100))
            }));

            // Goal completion per teacher
            const goalsByTeacher: Record<string, { total: number; completed: number }> = {};
            allGoals.forEach(g => {
                if (!goalsByTeacher[g.teacherId]) goalsByTeacher[g.teacherId] = { total: 0, completed: 0 };
                goalsByTeacher[g.teacherId].total++;
                if (g.status === 'COMPLETED') goalsByTeacher[g.teacherId].completed++;
            });
            const goalCompletionByTeacher = campusUsers.map(u => ({
                teacherId: u.id,
                teacherName: u.fullName,
                total: goalsByTeacher[u.id]?.total || 0,
                completed: goalsByTeacher[u.id]?.completed || 0,
                rate: goalsByTeacher[u.id]?.total
                    ? Math.round((goalsByTeacher[u.id].completed / goalsByTeacher[u.id].total) * 100)
                    : 0
            }));

            // Avg training hours
            const hoursMap: Record<string, number> = {};
            [...allMoocSubs.map(m => ({ userId: m.userId, hours: m.hours })),
            ...allPDHours.map(p => ({ userId: p.userId, hours: p.hours }))
            ].forEach(({ userId: uid, hours }) => {
                hoursMap[uid] = (hoursMap[uid] || 0) + hours;
            });
            const avgTrainingHours = teacherIds.length > 0
                ? teacherIds.reduce((a, id) => a + (hoursMap[id] || 0), 0) / teacherIds.length
                : 0;

            return res.status(200).json({
                status: 'success',
                role: 'HOS',
                data: {
                    campusId,
                    totalTeachers: teacherIds.length,
                    teachersObserved,
                    teachersNotObserved,
                    avgObservationsPerTeacher: parseFloat(avgObsPerTeacher.toFixed(1)),
                    avgObservationScore: avgObsScore !== null ? parseFloat(avgObsScore.toFixed(2)) : null,
                    observerCompletion,
                    avgTrainingHoursPerTeacher: parseFloat(avgTrainingHours.toFixed(1)),
                    goalCompletionByTeacher,
                }
            });
        }

        // ---------------------------------------------------------------
        // ADMIN / MANAGEMENT view — system-wide + per-campus breakdown
        // ---------------------------------------------------------------
        if (isAdmin || isManagement) {
            const [
                allUsers,
                allObservations,
                allAssessmentAttempts,
                allAssignments,
                allMoocSubs,
                allFestivalApps,
                allCourseEnrollments,
                surveyResponses,
            ] = await Promise.all([
                prisma.user.findMany({
                    where: { role: 'TEACHER' },
                    select: { id: true, campusId: true, role: true, fullName: true }
                }),
                prisma.observation.findMany({
                    include: { teacher: { select: { campusId: true } } }
                }),
                prisma.assessmentAttempt.findMany({
                    where: { status: 'SUBMITTED' },
                    include: {
                        assessment: { select: { type: true } },
                        user: { select: { campusId: true } }
                    }
                }),
                prisma.assessmentAssignment.findMany({
                    select: { assignedToCampusId: true, assignedToId: true, assignedToRole: true, assessmentId: true }
                }),
                prisma.moocSubmission.findMany({
                    where: { status: 'APPROVED' },
                    include: { user: { select: { campusId: true } } }
                }),
                prisma.learningFestivalApplication.findMany({
                    where: { status: 'Shortlisted' },
                    include: { user: { select: { campusId: true } } }
                }),
                prisma.courseEnrollment.findMany({
                    include: { user: { select: { campusId: true } } }
                }),
                prisma.surveyResponse.findMany({
                    where: { isCompleted: true },
                    include: { answers: true, user: { select: { campusId: true } } }
                }),
            ]);

            // Group teachers by campus
            const campuses = Array.from(new Set(allUsers.map(u => u.campusId).filter(Boolean))) as string[];

            const perCampus = campuses.map(campus => {
                const campusTeachers = allUsers.filter(u => u.campusId === campus);
                const teacherIds = campusTeachers.map(u => u.id);
                const campusObs = allObservations.filter(o => o.teacher?.campusId === campus);
                const observedIds = new Set(campusObs.map(o => o.teacherId));

                // Observation score
                const avgObsScore = campusObs.length > 0
                    ? campusObs.reduce((a, b) => a + b.score, 0) / campusObs.length : null;

                // Assessment scores
                const campusAttempts = allAssessmentAttempts.filter(a => a.user?.campusId === campus);
                const postOrScores = campusAttempts
                    .filter(a => a.assessment?.type === 'POST_ORIENTATION' && a.score !== null)
                    .map(a => a.score as number);
                const prepScores = campusAttempts
                    .filter(a => a.assessment?.type === 'PREPAREDNESS' && a.score !== null)
                    .map(a => a.score as number);

                const postOrAvg = postOrScores.length > 0 ? postOrScores.reduce((a, b) => a + b, 0) / postOrScores.length : null;
                const prepAvg = prepScores.length > 0 ? prepScores.reduce((a, b) => a + b, 0) / prepScores.length : null;

                // Avg instructional tools — proxy: count observations with Technology domain rating
                const instrToolsObs = campusObs.filter(o => o.learningArea || o.domain === 'Technology');
                const avgInstructionalTools = campusObs.length > 0
                    ? instrToolsObs.length / campusObs.length : null;

                // PD (MOOC) feedback score
                const campusMoocs = allMoocSubs.filter(m => m.user?.campusId === campus);
                const avgPDFeedback = campusMoocs.length > 0
                    ? campusMoocs.reduce((a, b) => a + b.effectivenessRating, 0) / campusMoocs.length : null;

                // Observation completion %
                const expectedObs = teacherIds.length;
                const actualObs = observedIds.size;
                const obsCompletionRate = expectedObs > 0 ? (actualObs / expectedObs) * 100 : 0;

                // Self-paced engagement
                const campusCourseEnrollments = allCourseEnrollments.filter(e => e.user?.campusId === campus);
                const selfPacedEngagement = campusCourseEnrollments.length > 0
                    ? campusCourseEnrollments.reduce((a, b) => a + b.progress, 0) / campusCourseEnrollments.length : null;

                // Learning Festival shortlisted
                const shortlisted = allFestivalApps.filter(a => a.user?.campusId === campus).length;

                // School leadership support score from surveys (avg numeric answer)
                const campusSurveyAnswers = surveyResponses
                    .filter(r => r.user?.campusId === campus)
                    .flatMap(r => r.answers)
                    .filter(a => a.answerNumeric !== null);
                const surveySupportScore = campusSurveyAnswers.length > 0
                    ? campusSurveyAnswers.reduce((a, b) => a + (b.answerNumeric || 0), 0) / campusSurveyAnswers.length
                    : null;

                return {
                    campus,
                    totalTeachers: teacherIds.length,
                    teachersObserved: observedIds.size,
                    avgObservationScore: avgObsScore !== null ? parseFloat(avgObsScore.toFixed(2)) : null,
                    postOrientationAvg: postOrAvg !== null ? parseFloat(postOrAvg.toFixed(1)) : null,
                    preparednessAvg: prepAvg !== null ? parseFloat(prepAvg.toFixed(1)) : null,
                    avgInstructionalTools: avgInstructionalTools !== null ? parseFloat(avgInstructionalTools.toFixed(2)) : null,
                    avgPDFeedbackScore: avgPDFeedback !== null ? parseFloat(avgPDFeedback.toFixed(2)) : null,
                    observationCompletionRate: parseFloat(obsCompletionRate.toFixed(1)),
                    schoolLeadershipSupportScore: surveySupportScore !== null ? parseFloat(surveySupportScore.toFixed(2)) : null,
                    selfPacedEngagement: selfPacedEngagement !== null ? Math.round(selfPacedEngagement) : null,
                    shortlistedFestivalApps: shortlisted,
                };
            });

            // Overall aggregates
            const overallObsCompletion = allUsers.length > 0
                ? (new Set(allObservations.map(o => o.teacherId)).size / allUsers.length) * 100 : 0;

            const overallAvgObsScore = allObservations.length > 0
                ? allObservations.reduce((a, b) => a + b.score, 0) / allObservations.length : null;

            const totalShortlisted = allFestivalApps.length;

            return res.status(200).json({
                status: 'success',
                role: isAdmin ? 'ADMIN' : 'MANAGEMENT',
                data: {
                    perCampus,
                    overall: {
                        totalTeachers: allUsers.length,
                        totalCampuses: campuses.length,
                        observationCompletionRate: parseFloat(overallObsCompletion.toFixed(1)),
                        avgObservationScore: overallAvgObsScore !== null ? parseFloat(overallAvgObsScore.toFixed(2)) : null,
                        totalShortlistedFestivalApps: totalShortlisted,
                    }
                }
            });
        }

        return res.status(403).json({ status: 'error', message: 'Unauthorized role' });

    } catch (error) {
        console.error('OKR Controller Error:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to fetch OKR data' });
    }
};
