
import { useAccessControl } from '@/contexts/PermissionContext';

export interface FormFlowConfig {
    id: string;
    formName: string;
    senderRole: string;
    targetDashboard: string;
    targetLocation: string;
}

export function useFormFlow() {
    const { formFlows: flows, isLoading } = useAccessControl();

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
