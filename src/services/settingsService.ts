import api from '@/lib/api';

export interface SystemSetting {
    id: string;
    key: string;
    value: string;
    createdAt: string;
    updatedAt: string;
}

export const settingsService = {
    // Get all settings
    getAllSettings: async () => {
        const response = await api.get('/settings');
        return response.data.data.settings.map((s: any) => ({
            ...s,
            value: JSON.parse(s.value)
        }));
    },

    // Get a single setting by key
    getSetting: async (key: string) => {
        const response = await api.get(`/settings/${key}`);
        return {
            ...response.data.data.setting,
            value: JSON.parse(response.data.data.setting.value)
        };
    },

    // Upsert a setting
    upsertSetting: async (key: string, value: any) => {
        const response = await api.post('/settings/upsert', { key, value });
        return response.data.data.setting;
    },

    // Delete a setting
    deleteSetting: async (key: string) => {
        await api.delete(`/settings/${key}`);
    }
};
