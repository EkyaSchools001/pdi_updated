import api from '@/lib/api';

export interface User {
    id: string;
    fullName: string;
    email: string;
    role: string;
    department?: string;
    campusId?: string;
    status: string;
    academics?: 'CORE' | 'NON_CORE';
}

export const userService = {
    async getAllUsers(role?: string) {
        try {
            const params = role ? { role } : {};
            const response = await api.get('/users', { params });
            console.log('UserService: API response', { status: response.data?.status, usersCount: response.data?.data?.users?.length });

            if (response.data?.status === 'success') {
                return response.data.data?.users || [];
            } else {
                console.warn('UserService: Non-success status:', response.data?.status);
                return [];
            }
        } catch (error: any) {
            console.error('Error fetching users:', error);
            console.error('Error details:', error.response?.data || error.message);
            return []; // Return empty array instead of throwing
        }
    },

    async getTeachers() {
        const teachers = await this.getAllUsers('TEACHER');
        console.log('UserService: getTeachers returned', teachers?.length || 0, 'teachers');
        return teachers || [];
    }
};
