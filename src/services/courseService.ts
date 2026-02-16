import api from '@/lib/api';

export interface Course {
    id: string;
    title: string;
    category: string;
    hours: number;
    instructor: string;
    status: 'Draft' | 'Active' | 'Archived' | 'PENDING_APPROVAL';
    description?: string;
    thumbnail?: string;
    url?: string;
    isDownloadable: boolean;
    enrollments?: any[];
    _count?: {
        enrollments: number;
    };
}

export const courseService = {
    // Get all courses
    getAllCourses: async (status?: string, category?: string) => {
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        if (category && category !== 'all') params.append('category', category);

        const response = await api.get(`/courses?${params.toString()}`);
        return response.data.data.courses;
    },

    // Get single course
    getCourse: async (id: string) => {
        const response = await api.get(`/courses/${id}`);
        return response.data.data.course;
    },

    // Create course
    createCourse: async (courseData: Partial<Course>) => {
        const response = await api.post('/courses', courseData);
        return response.data.data.course;
    },

    // Update course
    updateCourse: async (id: string, courseData: Partial<Course>) => {
        const response = await api.patch(`/courses/${id}`, courseData);
        return response.data.data.course;
    },

    // Delete course
    deleteCourse: async (id: string) => {
        await api.delete(`/courses/${id}`);
    },

    // Enroll in course
    enroll: async (id: string) => {
        const response = await api.post(`/courses/${id}/enroll`);
        return response.data.data.enrollment;
    },

    // Update progress
    updateProgress: async (id: string, progress: number, status: 'IN_PROGRESS' | 'COMPLETED') => {
        const response = await api.patch(`/courses/${id}/progress`, { progress, status });
        return response.data.data.enrollment;
    },

    // Get my enrollments
    getMyEnrollments: async () => {
        const response = await api.get('/courses/my-enrollments');
        return response.data.data.enrollments;
    }
};
