
import { useState, useEffect } from 'react';
import api from '@/lib/api';

export interface FormFlowConfig {
    id: string;
    formName: string;
    senderRole: string;
    targetDashboard: string;
    targetLocation: string;
}

export function useFormFlow() {
    const [flows, setFlows] = useState<FormFlowConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchFlows = async () => {
            try {
                const response = await api.get('/settings/access_matrix_config');
                if (response.data.status === 'success' && response.data.data.setting) {
                    const value = JSON.parse(response.data.data.setting.value);
                    if (value.formFlows) {
                        setFlows(value.formFlows);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch form flows", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchFlows();
    }, []);

    const getRedirectionPath = (formName: string, role: string) => {
        const flow = flows.find(f =>
            f.formName.toLowerCase() === formName.toLowerCase() &&
            f.senderRole.toUpperCase() === role.toUpperCase()
        );

        if (!flow) return null;

        // Map dashboard name to path
        const dashboardPaths: Record<string, string> = {
            'Admin Dashboard': '/admin',
            'Leader Dashboard': '/leader',
            'Teacher Dashboard': '/teacher',
            'Management Dashboard': '/management'
        };

        return dashboardPaths[flow.targetDashboard] || null;
    };

    return { flows, isLoading, getRedirectionPath };
}
