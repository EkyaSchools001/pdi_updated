import api from '@/lib/api';

export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
    isRead: boolean;
    link?: string;
    createdAt: string;
}

export const notificationService = {
    async getNotifications(): Promise<Notification[]> {
        const response = await api.get('/notifications');
        return response.data.data.notifications;
    },

    async markAsRead(id: string): Promise<Notification> {
        const response = await api.patch(`/notifications/${id}/read`);
        return response.data.data.notification;
    },

    async markAllAsRead(): Promise<void> {
        await api.patch('/notifications/mark-all-read');
    },

    async deleteNotification(id: string): Promise<void> {
        await api.delete(`/notifications/${id}`);
    }
};
