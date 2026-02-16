import api from '@/lib/api';

export interface TrainingEvent {
    id: string;
    title: string;
    topic: string;
    type: string;
    date: string;
    location: string;
    capacity: number;
    status: string;
    registrations?: any[];
}

export const trainingService = {
    async getAllEvents() {
        const response = await api.get('/training');
        return response.data.data.events;
    },

    async createEvent(data: any) {
        const response = await api.post('/training', data);
        return response.data.data.event;
    },

    async registerForEvent(eventId: string) {
        const response = await api.post(`/training/${eventId}/register`);
        return response.data.data.registration;
    },

    async updateStatus(id: string, status: string) {
        const response = await api.patch(`/training/${id}/status`, { status });
        return response.data.data.event;
    },

    async deleteEvent(id: string) {
        const response = await api.delete(`/training/${id}`);
        return response.data;
    },

    async updateEvent(id: string, data: any) {
        const response = await api.put(`/training/${id}`, data);
        return response.data.data.event;
    }
};
