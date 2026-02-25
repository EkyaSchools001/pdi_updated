import api from '../lib/api';

export const analyticsService = {
    getCampusEngagement: async (): Promise<any> => {
        const response = await api.get('/analytics/campus-engagement');
        return response.data;
    }
};
