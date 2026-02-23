import api from '../lib/api';

export interface LearningFestival {
    id: string;
    name: string;
    theme: string;
    description?: string;
    startDate: string;
    endDate: string;
    applyDeadline: string;
    status: string;
    eligibilityRules?: string;
    campusLimits?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface LearningFestivalApplication {
    id: string;
    festivalId: string;
    userId: string;
    statementOfPurpose: string;
    relevantExperience?: string;
    preferredStrand?: string;
    status: string;
    documents?: string;
    feedback?: string;
    appliedAt?: string;
    reviewedAt?: string;
    reviewedById?: string;
    user?: {
        fullName: string;
        email: string;
        role: string;
        campusId: string;
        department: string;
    };
    festival?: {
        name: string;
        theme: string;
    };
}

export const learningFestivalService = {
    // Festivals
    getFestivals: async (): Promise<LearningFestival[]> => {
        const response = await api.get('/festivals');
        return response.data;
    },

    createFestival: async (data: Partial<LearningFestival>): Promise<LearningFestival> => {
        const response = await api.post('/festivals', data);
        return response.data;
    },

    updateFestival: async (id: string, data: Partial<LearningFestival>): Promise<LearningFestival> => {
        const response = await api.put(`/festivals/${id}`, data);
        return response.data;
    },

    // Applications
    getApplications: async (params?: { festivalId?: string }): Promise<LearningFestivalApplication[]> => {
        const response = await api.get('/festivals/applications', { params });
        return response.data;
    },

    applyToFestival: async (festivalId: string, data: Partial<LearningFestivalApplication>): Promise<LearningFestivalApplication> => {
        const response = await api.post(`/festivals/${festivalId}/apply`, data);
        return response.data;
    },

    updateApplicationStatus: async (id: string, data: { status: string; feedback?: string }): Promise<LearningFestivalApplication> => {
        const response = await api.put(`/festivals/applications/${id}/status`, data);
        return response.data;
    },

    // Analytics
    getAnalytics: async (): Promise<any> => {
        const response = await api.get('/festivals/analytics');
        return response.data;
    }
};
