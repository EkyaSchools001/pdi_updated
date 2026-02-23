import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

export interface PermissionSetting {
    moduleId: string;
    moduleName: string;
    roles: {
        SUPERADMIN: boolean;
        ADMIN: boolean;
        LEADER: boolean;
        MANAGEMENT: boolean;
        TEACHER: boolean;
    };
}

export interface FormFlowConfig {
    id: string;
    formName: string;
    senderRole: string;
    targetDashboard: string;
    targetLocation: string;
}

interface PermissionContextType {
    matrix: PermissionSetting[];
    formFlows: FormFlowConfig[];
    isLoading: boolean;
    isModuleEnabled: (modulePath: string, role: string) => boolean;
    refreshConfig: () => Promise<void>;
}

const STORAGE_KEY = 'access_matrix_cache';
const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

const defaultMatrix: PermissionSetting[] = [
    { moduleId: 'users', moduleName: 'User Management', roles: { SUPERADMIN: true, ADMIN: true, LEADER: false, MANAGEMENT: false, TEACHER: false } },
    { moduleId: 'forms', moduleName: 'Form Templates', roles: { SUPERADMIN: true, ADMIN: true, LEADER: false, MANAGEMENT: false, TEACHER: false } },
    { moduleId: 'courses', moduleName: 'Course Catalogue', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: true, TEACHER: true } },
    { moduleId: 'calendar', moduleName: 'Training Calendar', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: true, TEACHER: true } },
    { moduleId: 'documents', moduleName: 'Documents', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: true, TEACHER: true } },
    { moduleId: 'reports', moduleName: 'Reports & Analytics', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: true, TEACHER: false } },
    { moduleId: 'settings', moduleName: 'System Settings', roles: { SUPERADMIN: true, ADMIN: false, LEADER: false, MANAGEMENT: false, TEACHER: false } },
    { moduleId: 'attendance', moduleName: 'Attendance', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: false, TEACHER: false } },
    { moduleId: 'observations', moduleName: 'Observations', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: true, TEACHER: true } },
    { moduleId: 'goals', moduleName: 'Goal Management', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: true, TEACHER: true } },
    { moduleId: 'hours', moduleName: 'PD Hours Tracking', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: true, TEACHER: true } },
    { moduleId: 'insights', moduleName: 'Data Insights', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: true, TEACHER: true } },
    { moduleId: 'meetings', moduleName: 'Meetings', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: true, TEACHER: true } },
    { moduleId: 'announcements', moduleName: 'Announcements', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: true, TEACHER: true } },
    { moduleId: 'survey', moduleName: 'Surveys', roles: { SUPERADMIN: true, ADMIN: true, LEADER: false, MANAGEMENT: true, TEACHER: true } },
];

const loadFromCache = (): { matrix: PermissionSetting[]; formFlows: FormFlowConfig[] } | null => {
    try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
            return JSON.parse(cached);
        }
    } catch (e) {}
    return null;
};

const saveToCache = (matrix: PermissionSetting[], formFlows: FormFlowConfig[]) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ matrix, formFlows }));
    } catch (e) {}
};

export function PermissionProvider({ children }: { children: React.ReactNode }) {
    const [matrix, setMatrix] = useState<PermissionSetting[]>(() => {
        const cached = loadFromCache();
        return cached?.matrix || defaultMatrix;
    });
    const [formFlows, setFormFlows] = useState<FormFlowConfig[]>(() => {
        const cached = loadFromCache();
        return cached?.formFlows || [];
    });
    const [isLoading, setIsLoading] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const fetchConfig = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/settings/access_matrix_config');
            if (response.data.status === 'success' && response.data.data.setting) {
                const value = JSON.parse(response.data.data.setting.value);
                if (value.accessMatrix) {
                    setMatrix(value.accessMatrix);
                    saveToCache(value.accessMatrix, value.formFlows || []);
                    console.log('[PERMISSIONS] ✅ Loaded from API, modules:', value.accessMatrix.length);
                }
                if (value.formFlows) {
                    setFormFlows(value.formFlows);
                }
            }
        } catch (error: any) {
            console.log('[PERMISSIONS] Using cached/default settings');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConfig();
        
        // Poll every 5 seconds for changes
        const interval = setInterval(fetchConfig, 5000);
        
        // Also refresh when window gains focus
        const handleFocus = () => fetchConfig();
        window.addEventListener('focus', handleFocus);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', handleFocus);
        };
    }, [fetchConfig]);

    const isModuleEnabled = (modulePath: string, role: string) => {
        if (!role) return false;

        let roleKey = role.toUpperCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim() as keyof PermissionSetting['roles'];
        if ((roleKey as string).includes('SCHOOL LEADER') || (roleKey as string) === 'LEADER') {
            roleKey = 'LEADER' as any;
        }

        if (roleKey === 'SUPERADMIN') return true;

        const pathMatch: Record<string, string> = {
            '/admin/users': 'users',
            '/admin/forms': 'forms',
            '/admin/courses': 'courses',
            '/admin/calendar': 'calendar',
            '/admin/documents': 'documents',
            '/admin/reports': 'reports',
            '/admin/settings': 'settings',
            '/admin/attendance': 'attendance',
            '/admin/superadmin': 'settings',
            '/admin/meetings': 'meetings',
            '/admin/survey': 'survey',

            '/teacher/observations': 'observations',
            '/teacher/goals': 'goals',
            '/teacher/calendar': 'calendar',
            '/teacher/attendance': 'attendance',
            '/teacher/courses': 'courses',
            '/teacher/hours': 'hours',
            '/teacher/documents': 'documents',
            '/teacher/insights': 'insights',
            '/teacher/meetings': 'meetings',
            '/teacher/survey': 'survey',

            '/leader/observe': 'observations',
            '/leader/observations': 'observations',
            '/leader/team': 'users',
            '/leader/goals': 'goals',
            '/leader/participation': 'courses',
            '/leader/performance': 'reports',
            '/leader/calendar': 'calendar',
            '/leader/attendance': 'attendance',
            '/leader/reports': 'reports',
            '/leader/meetings': 'meetings',

            '/meetings': 'meetings',
            '/announcements': 'announcements',
            
            '/management/meetings': 'meetings',
            '/management/survey': 'survey',
        };

        const sortedKeys = Object.keys(pathMatch).sort((a, b) => b.length - a.length);
        let moduleId: string | undefined = undefined;

        for (const key of sortedKeys) {
            if (modulePath.startsWith(key)) {
                moduleId = pathMatch[key];
                break;
            }
        }

        if (!moduleId) return true;

        const module = matrix.find(m => m.moduleId === moduleId);
        if (!module) {
            if (['meetings', 'survey', 'announcements'].includes(moduleId)) return true;
            return matrix.length === 0 || matrix === defaultMatrix;
        }

        return module.roles[roleKey] === true;
    };

    return (
        <PermissionContext.Provider value={{ matrix, formFlows, isLoading, isModuleEnabled, refreshConfig: fetchConfig }}>
            {children}
        </PermissionContext.Provider>
    );
}

export function useAccessControl() {
    const context = useContext(PermissionContext);
    if (!context) {
        throw new Error('useAccessControl must be used within a PermissionProvider');
    }
    return context;
}
