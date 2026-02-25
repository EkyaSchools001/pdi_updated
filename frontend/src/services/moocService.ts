import api from '@/lib/api';

export interface MoocSubmission {
    id: string;
    courseName: string;
    platform: string;
    otherPlatform?: string;
    hours: number;
    startDate: string;
    endDate: string;
    hasCertificate: string;
    proofLink?: string;
    certificateFile?: string;
    keyTakeaways?: string;
    unansweredQuestions?: string;
    enjoyedMost?: string;
    effectivenessRating: number;
    additionalFeedback?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    submittedAt: string;
    user?: {
        fullName: string;
        email: string;
    };
}

export const moocService = {
    async submitEvidence(data: any) {
        const response = await api.post('/mooc/submit', data);
        return response.data.data.submission;
    },

    async getAllSubmissions() {
        const response = await api.get('/mooc');
        return response.data.data.submissions;
    },

    async updateStatus(id: string, status: string) {
        const response = await api.patch(`/mooc/${id}/status`, { status });
        return response.data.data.submission;
    }
};
