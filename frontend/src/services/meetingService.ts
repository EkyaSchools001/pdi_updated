import api from '../lib/api';

export interface Meeting {
    id: string;
    title: string;
    description?: string;
    meetingType: string;
    campusId?: string;
    departmentId?: string;
    meetingDate: string;
    startTime: string;
    endTime: string;
    mode: string;
    locationLink?: string;
    createdById: string;
    status: 'Draft' | 'Scheduled' | 'Ongoing' | 'Completed' | 'Archived';
    momStatus: 'Not Created' | 'Draft' | 'Published';
    createdBy?: { id: string; fullName: string; role: string };
    attendees?: { userId: string; attendanceStatus: string; user: { id: string; fullName: string; email: string; role: string; department?: string } }[];
    minutes?: MeetingMinutes;
    actionItems?: MeetingActionItem[];
    replies?: any[]; // Added for MoM view
    _count?: { replies: number };
}

export interface MeetingMinutes {
    id: string;
    meetingId: string;
    objective: string;
    agendaPoints: any; // Parsed JSON
    discussionSummary: string;
    decisions: any; // Parsed JSON
    attendanceCount: number;
    attendanceSummary?: string;
    departments?: any; // Parsed JSON
    attachments?: any; // Parsed JSON
    status: 'Draft' | 'Published' | 'Archived';
    createdById: string;
    createdBy?: { id: string; fullName: string };
    createdAt: string;
    updatedAt: string;
}

export interface MeetingActionItem {
    id: string;
    meetingId: string;
    taskDescription: string;
    assignedTo: string;
    deadline: string;
    priority: 'High' | 'Medium' | 'Low';
    status: 'Pending' | 'In Progress' | 'Completed';
}

export const meetingService = {
    getAllMeetings: async () => {
        const response = await api.get('/meetings');
        return response.data.data.meetings as Meeting[];
    },

    getMeetingById: async (id: string) => {
        const response = await api.get(`/meetings/${id}`);
        return response.data.data.meeting as Meeting;
    },

    getMoM: async (meetingId: string) => {
        const response = await api.get(`/meetings/${meetingId}/mom`);
        return response.data.data as { mom: MeetingMinutes, actionItems: MeetingActionItem[] };
    },

    createMeeting: async (data: Partial<Meeting> & { attendees?: string[] }) => {
        const response = await api.post('/meetings', data);
        return response.data.data.meeting as Meeting;
    },

    updateMeeting: async (id: string, data: Partial<Meeting>) => {
        const response = await api.patch(`/meetings/${id}`, data);
        return response.data.data.meeting as Meeting;
    },

    deleteMeeting: async (id: string) => {
        await api.delete(`/meetings/${id}`);
    },

    completeMeeting: async (id: string) => {
        const response = await api.patch(`/meetings/${id}/complete`);
        return response.data.data.meeting as Meeting;
    },

    // MoM operations
    createMoM: async (meetingId: string, data: Partial<MeetingMinutes> & { actionItems?: any[] }) => {
        const response = await api.post(`/meetings/${meetingId}/mom`, data);
        return response.data.data.mom as MeetingMinutes;
    },

    updateMoM: async (meetingId: string, data: Partial<MeetingMinutes> & { actionItems?: any[] }) => {
        const response = await api.patch(`/meetings/${meetingId}/mom`, data);
        return response.data.data.mom as MeetingMinutes;
    },

    publishMoM: async (meetingId: string) => {
        const response = await api.post(`/meetings/${meetingId}/mom/publish`);
        return response.data.data.mom as MeetingMinutes;
    },

    addMoMReply: async (meetingId: string, replyText: string) => {
        const response = await api.post(`/meetings/${meetingId}/mom/reply`, { replyText });
        return response.data.data.reply;
    },

    shareMoM: async (meetingId: string, data: { targetRole: string, targetCampusId?: string | null, sendNotification?: boolean }) => {
        const response = await api.post(`/meetings/${meetingId}/mom/share`, data);
        return response.data.data.share;
    }
};
