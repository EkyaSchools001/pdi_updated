import api from '../lib/api';

export const analyticsService = {
    getCampusEngagement: async (): Promise<any> => {
        const response = await api.get('/analytics/engagement');
        return response.data;
    },
    getCampusAttendance: async (): Promise<any> => {
        const response = await api.get('/analytics/attendance/campuses');
        return response.data;
    },
    getCutoffStats: async (cutoff: number = 20): Promise<any> => {
        const response = await api.get(`/analytics/cutoff-stats?cutoff=${cutoff}`);
        return response.data;
    },
    getFeedbackAnalytics: async (): Promise<any> => {
        const response = await api.get('/analytics/feedback');
        return response.data;
    }
};
