import api from '../lib/api';

export interface SurveyQuestion {
    id: string;
    pageNumber: number;
    questionText: string;
    questionType: 'short_text' | 'long_text' | 'rating_scale' | 'multiple_choice' | 'multi_select' | 'yes_no';
    options?: string; // JSON string
    isRequired: boolean;
    orderIndex: number;
}

export interface Survey {
    id: string;
    title: string;
    description?: string;
    academicYear: string;
    term: string;
    isActive: boolean;
    isAnonymous: boolean;
    questions: SurveyQuestion[];
}

export interface SurveyResponse {
    id: string;
    surveyId: string;
    isCompleted: boolean;
    submittedAt: string;
    answers: SurveyAnswer[];
}

export interface SurveyAnswer {
    questionId: string;
    answerText?: string;
    answerNumeric?: number;
    answerJson?: string;
}

export interface SurveyAnalytics {
    completionStats: {
        campus: string;
        total: number;
        completed: number;
        rate: number;
    }[];
    questionStats: {
        question: string;
        data: {
            campus: string;
            avg: number;
        }[];
    }[];
}

interface ApiResponse<T> {
    status: string;
    data: T;
}

export const surveyService = {
    // Get active survey
    getActiveSurvey: async () => {
        const response = await api.get<ApiResponse<{ survey: Survey; myResponse?: SurveyResponse; }>>('/surveys/active');
        return response.data.data;
    },

    // Submit survey (partial or full)
    submitSurvey: async (surveyId: string, answers: SurveyAnswer[], isCompleted: boolean) => {
        const response = await api.post<ApiResponse<{ response: SurveyResponse }>>('/surveys/submit', { surveyId, answers, isCompleted });
        return response.data;
    },

    // Get survey by ID
    getSurveyById: async (id: string) => {
        const response = await api.get<ApiResponse<{ survey: Survey }>>(`/surveys/${id}`);
        return response.data.data;
    },

    // Get analytics
    getAnalytics: async (surveyId: string) => {
        const response = await api.get<ApiResponse<SurveyAnalytics>>(`/surveys/${surveyId}/analytics`);
        return response.data.data;
    },

    exportResults: async (surveyId: string) => {
        const response = await api.get(`/surveys/${surveyId}/export`, {
            responseType: 'blob' // Important for binary/text file download
        });
        return response.data;
    },

    // --- Management ---
    updateSurvey: async (id: string, data: Partial<Survey>) => {
        const response = await api.patch<ApiResponse<{ survey: Survey }>>(`/surveys/${id}`, data);
        return response.data.data.survey;
    },

    createQuestion: async (surveyId: string, data: Omit<SurveyQuestion, 'id' | 'orderIndex'>) => {
        const response = await api.post<ApiResponse<{ question: SurveyQuestion }>>(`/surveys/${surveyId}/questions`, data);
        return response.data.data.question;
    },

    updateQuestion: async (id: string, data: Partial<SurveyQuestion>) => {
        const response = await api.patch<ApiResponse<{ question: SurveyQuestion }>>(`/surveys/questions/${id}`, data);
        return response.data.data.question;
    },

    deleteQuestion: async (id: string) => {
        await api.delete<ApiResponse<null>>(`/surveys/questions/${id}`);
    }
};
