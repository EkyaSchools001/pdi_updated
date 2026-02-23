import api from "@/lib/api";

export interface Announcement {
    id: string;
    title: string;
    description: string;
    createdById: string;
    role: string;
    priority: 'Normal' | 'High';
    status: 'Draft' | 'Published' | 'Archived';
    targetRoles: string; // JSON string
    targetDepartments?: string; // JSON string
    targetCampuses?: string; // JSON string
    expiryDate?: string;
    attachments?: string; // JSON string
    isPinned: boolean;
    createdAt: string;
    updatedAt: string;
    createdBy: {
        fullName: string;
        role: string;
    };
    isAcknowledged: boolean;
}

export const announcementService = {
    getAnnouncements: async (): Promise<Announcement[]> => {
        const response = await api.get('/announcements');
        return response.data.data;
    },

    createAnnouncement: async (data: Partial<Announcement>): Promise<Announcement> => {
        const response = await api.post('/announcements', data);
        return response.data.data;
    },

    updateAnnouncement: async (id: string, data: Partial<Announcement>): Promise<Announcement> => {
        const response = await api.patch(`/announcements/${id}`, data);
        return response.data.data;
    },

    deleteAnnouncement: async (id: string): Promise<void> => {
        await api.delete(`/announcements/${id}`);
    },

    acknowledgeAnnouncement: async (id: string): Promise<void> => {
        await api.post(`/announcements/acknowledge/${id}`);
    },

    getAnnouncementStats: async (id: string): Promise<{ count: number, users: any[] }> => {
        const response = await api.get(`/announcements/${id}/stats`);
        return response.data.data;
    }
};
