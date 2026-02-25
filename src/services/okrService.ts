import api from '@/lib/api';

export interface TeacherOKRData {
    selfReflectionRate: number;
    totalObservations: number;
    avgObservationScore: number | null;
    pdHoursCompleted: number;
    pdHoursPending: number;
    pdTargetHours: number;
    goalsCompleted: number;
    goalsTotal: number;
    selfPacedEngagement: number | null;
}

export interface HOSOKRData {
    campusId: string | null;
    totalTeachers: number;
    teachersObserved: number;
    teachersNotObserved: number;
    avgObservationsPerTeacher: number;
    avgObservationScore: number | null;
    observerCompletion: Array<{ observerId: string; count: number; targetCompletion: number }>;
    avgTrainingHoursPerTeacher: number;
    goalCompletionByTeacher: Array<{ teacherId: string; teacherName: string; total: number; completed: number; rate: number }>;
}

export interface CampusOKRMetric {
    campus: string;
    totalTeachers: number;
    teachersObserved: number;
    avgObservationScore: number | null;
    postOrientationAvg: number | null;
    preparednessAvg: number | null;
    avgInstructionalTools: number | null;
    avgPDFeedbackScore: number | null;
    observationCompletionRate: number;
    schoolLeadershipSupportScore: number | null;
    selfPacedEngagement: number | null;
    shortlistedFestivalApps: number;
}

export interface AdminOKRData {
    perCampus: CampusOKRMetric[];
    overall: {
        totalTeachers: number;
        totalCampuses: number;
        observationCompletionRate: number;
        avgObservationScore: number | null;
        totalShortlistedFestivalApps: number;
    };
}

export type OKRResponse =
    | { role: 'TEACHER'; data: TeacherOKRData }
    | { role: 'HOS'; data: HOSOKRData }
    | { role: 'ADMIN' | 'MANAGEMENT'; data: AdminOKRData };

export const okrService = {
    async getOKRData(): Promise<OKRResponse> {
        const { data } = await api.get('/okr');
        return { role: data.role, data: data.data };
    }
};
