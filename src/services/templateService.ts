import api from '@/lib/api';

export interface FormTemplate {
    id: string;
    type: string;
    name: string;
    structure: string;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
}

export const templateService = {
    // Get all templates
    getAllTemplates: async (type?: string) => {
        const params = new URLSearchParams();
        if (type) params.append('type', type);

        const response = await api.get(`/templates?${params.toString()}`);
        return response.data.data.templates.map((t: any) => ({
            ...t,
            structure: JSON.parse(t.structure)
        }));
    },

    // Get a single template
    getTemplate: async (id: string) => {
        const response = await api.get(`/templates/${id}`);
        return {
            ...response.data.data.template,
            structure: JSON.parse(response.data.data.template.structure)
        };
    },

    // Create a template
    createTemplate: async (data: any) => {
        const payload = {
            ...data,
            structure: typeof data.structure === 'string' ? data.structure : JSON.stringify(data.structure)
        };
        const response = await api.post('/templates', payload);
        return response.data.data.template;
    },

    // Update a template
    updateTemplate: async (id: string, data: any) => {
        const payload = {
            ...data,
            structure: typeof data.structure === 'string' ? data.structure : JSON.stringify(data.structure)
        };
        const response = await api.put(`/templates/${id}`, payload);
        return response.data.data.template;
    },

    // Delete a template
    deleteTemplate: async (id: string) => {
        await api.delete(`/templates/${id}`);
    }
};
