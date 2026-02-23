import { useAccessControl } from '@/contexts/PermissionContext';

export interface FormFlowConfig {
    id: string;
    formName: string;
    senderRole: string;
    targetDashboard: string;
    targetLocation: string;
}

// Maps targetLocation (from SuperAdmin form flows) to specific paths for accurate redirects
const LOCATION_TO_PATH: Record<string, Record<string, string>> = {
    'Admin Dashboard': {
        'Attendance Register': '/admin/attendance',
        'Course Reviews': '/admin/courses',
        'User Management': '/admin/users',
        'Reports': '/admin/reports',
    },
    'Leader Dashboard': {
        'Pending Approvals': '/leader/goals',
        'Growth Reports': '/leader/observations',
        'Reports': '/leader/reports',
    },
    'Teacher Dashboard': {
        'Growth Reports': '/teacher/observations',
        'My Portfolio': '/teacher',
        'Observations': '/teacher/observations',
    },
    'Management Dashboard': {
        'Reports': '/management/reports',
        'Overview': '/management/overview',
    },
};

export function useFormFlow() {
    const { formFlows: flows, isLoading } = useAccessControl();

    const getRedirectionPath = (formName: string, role: string) => {
        const flow = flows.find(f =>
            f.formName.toLowerCase() === formName.toLowerCase() &&
            f.senderRole.toUpperCase() === role.toUpperCase()
        );

        if (!flow) return null;

        const dashboardPaths: Record<string, string> = {
            'Admin Dashboard': '/admin',
            'Leader Dashboard': '/leader',
            'Teacher Dashboard': '/teacher',
            'Management Dashboard': '/management'
        };

        // Try to resolve specific location path first
        const locationMap = LOCATION_TO_PATH[flow.targetDashboard];
        if (locationMap && flow.targetLocation) {
            const specificPath = locationMap[flow.targetLocation];
            if (specificPath) return specificPath;
        }

        return dashboardPaths[flow.targetDashboard] || null;
    };

    return { flows, isLoading, getRedirectionPath };
}
