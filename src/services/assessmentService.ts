import api from '@/lib/api';

export interface Assessment {
    id: string;
    title: string;
    description?: string;
    type: 'POST_ORIENTATION' | 'PREPAREDNESS' | 'CUSTOM';
    isTimed: boolean;
    timeLimitMinutes?: number;
    maxAttempts: number;
    questions?: AssessmentQuestion[];
}

export interface AssessmentQuestion {
    id: string;
    assessmentId: string;
    prompt: string;
    type: 'MCQ' | 'TEXT';
    options?: any[]; // For MCQ choices
    points: number;
}

export interface AssessmentAttempt {
    id: string;
    assessmentId: string;
    userId: string;
    status: 'IN_PROGRESS' | 'SUBMITTED' | 'TIMED_OUT';
    attemptNumber: number;
    score?: number;
    answers?: any;
    startTime: string;
    endTime?: string;
}

export const assessmentService = {
    // Admin/Leader: Fetch all templates
    async getAllAssessments() {
        const response = await api.get('/assessments');
        return response.data.data.assessments;
    },

    // Admin/Leader: Create new assessment
    async createAssessment(data: any) {
        const response = await api.post('/assessments', data);
        return response.data.data.assessment;
    },

    // Admin/Leader: Update assessment
    async updateAssessment(id: string, data: any) {
        const response = await api.put(`/assessments/${id}`, data);
        return response.data.data.assessment;
    },

    // Admin/Leader: Assign to group
    async assignAssessment(assessmentId: string, targetIds: string[], assignToType: 'USER' | 'CAMPUS' | 'ROLE') {
        const response = await api.post(`/assessments/${assessmentId}/assign`, { targetIds, assignToType });
        return response.data.data.assignments;
    },

    // Teacher: Get assigned assessments & attempts
    async getMyAssignments() {
        const response = await api.get('/assessments/my-assignments');
        return response.data.data;
    },

    // Teacher: Start attempt
    async startAttempt(assessmentId: string) {
        const response = await api.post(`/assessments/${assessmentId}/attempt/start`);
        return response.data.data.attempt;
    },

    // Teacher: Save progress
    async saveProgress(attemptId: string, answers: any) {
        const response = await api.put(`/assessments/attempt/${attemptId}/save`, { answers });
        return response.data.data.attempt;
    },

    // Teacher: Submit attempt
    async submitAttempt(attemptId: string, answers?: any) {
        const response = await api.post(`/assessments/attempt/${attemptId}/submit`, { answers });
        return response.data.data.attempt;
    },

    // Admin/Leader: Get analytics
    async getAnalytics() {
        const response = await api.get('/assessments/analytics');
        return response.data.data.analytics;
    },

    // Admin/Leader: Delete assessment
    async deleteAssessment(id: string) {
        const response = await api.delete(`/assessments/${id}`);
        return response.data;
    }
};
