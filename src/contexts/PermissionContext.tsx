import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { connectSocket, getSocket } from '@/lib/socket';

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
    { moduleId: 'users', moduleName: 'User Management', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: true, TEACHER: true } },
    { moduleId: 'team', moduleName: 'Team Overview', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: true, TEACHER: true } },
    { moduleId: 'forms', moduleName: 'Form Templates', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: true, TEACHER: true } },
    { moduleId: 'courses', moduleName: 'Course Catalogue', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: true, TEACHER: true } },
    { moduleId: 'calendar', moduleName: 'Training Calendar', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: true, TEACHER: true } },
    { moduleId: 'documents', moduleName: 'Documents', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: true, TEACHER: true } },
    { moduleId: 'reports', moduleName: 'Reports & Analytics', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: true, TEACHER: true } },
    { moduleId: 'settings', moduleName: 'System Settings', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: true, TEACHER: true } },
    { moduleId: 'attendance', moduleName: 'Attendance', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: true, TEACHER: true } },
    { moduleId: 'observations', moduleName: 'Observations', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: true, TEACHER: true } },
    { moduleId: 'goals', moduleName: 'Goal Management', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: true, TEACHER: true } },
    { moduleId: 'hours', moduleName: 'PD Hours Tracking', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: true, TEACHER: true } },
    { moduleId: 'insights', moduleName: 'Data Insights', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: true, TEACHER: true } },
    { moduleId: 'meetings', moduleName: 'Meetings', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: true, TEACHER: true } },
    { moduleId: 'announcements', moduleName: 'Announcements', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: true, TEACHER: true } },
    { moduleId: 'survey', moduleName: 'Surveys', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: true, TEACHER: true } },
    { moduleId: 'profile', moduleName: 'My Profile', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: true, TEACHER: true } },
    { moduleId: 'dashboard', moduleName: 'Dashboard', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: true, TEACHER: true } },
];

export function PermissionProvider({ children }: { children: React.ReactNode }) {
    const [matrix, setMatrix] = useState<PermissionSetting[]>(defaultMatrix);
    const [formFlows, setFormFlows] = useState<FormFlowConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchConfig = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/settings/access_matrix_config');
            if (response.data.status === 'success' && response.data.data.setting) {
                const value = JSON.parse(response.data.data.setting.value);
                if (value.accessMatrix && value.accessMatrix.length > 0) {
                    setMatrix(value.accessMatrix);
                    console.log('[PERMISSIONS] ✅ Loaded from API, modules:', value.accessMatrix.length);
                }
                if (value.formFlows) {
                    setFormFlows(value.formFlows);
                }
            }
        } catch (error: any) {
            console.log('[PERMISSIONS] Using default settings');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    const isModuleEnabled = (modulePath: string, role: string) => {
        console.log(`[PERMISSIONS] isModuleEnabled: path="${modulePath}", role="${role}", matrixLength=${matrix.length}`);
        
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
            '/teacher/profile': 'profile',
            '/teacher': 'teacher',

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
            '/leader': 'leader',

            '/management/overview': 'management',
            '/management/pdi-health': 'pdi-health',
            '/management/campus-performance': 'campus-performance',
            '/management/pillars': 'pillars',
            '/management/meetings': 'meetings',
            '/management/pd-impact': 'pd-impact',
            '/management/leadership': 'leadership',
            '/management/risk': 'risk',
            '/management/reports': 'reports',
            '/management/survey': 'survey',
            '/management': 'management',

            '/meetings': 'meetings',
            '/announcements': 'announcements',
            
            '/': 'dashboard',
        };

        const sortedKeys = Object.keys(pathMatch).sort((a, b) => b.length - a.length);
        let moduleId: string | undefined = undefined;

        for (const key of sortedKeys) {
            if (modulePath.startsWith(key)) {
                moduleId = pathMatch[key];
                console.log(`[PERMISSIONS] Matched path "${key}" to moduleId: "${moduleId}"`);
                break;
            }
        }

        if (!moduleId) {
            console.log(`[PERMISSIONS] No path match, trying role fallback`);
            if (roleKey === 'MANAGEMENT' || roleKey === 'TEACHER' || roleKey === 'LEADER') {
                moduleId = roleKey.toLowerCase();
                console.log(`[PERMISSIONS] Role fallback moduleId: "${moduleId}"`);
            }
        }

        if (!moduleId) {
            console.log(`[PERMISSIONS] No moduleId found, defaulting to true`);
            return true;
        }

        const module = matrix.find(m => m.moduleId === moduleId);
        console.log(`[PERMISSIONS] Looking for moduleId="${moduleId}", found:`, module);
        
        if (!module) {
            const allowedDefaults = ['meetings', 'survey', 'announcements', 'management', 'teacher', 'leader', 'dashboard', 'pdi-health', 'campus-performance', 'pillars', 'pd-impact', 'leadership', 'risk', 'profile'];
            if (allowedDefaults.includes(moduleId)) {
                console.log(`[PERMISSIONS] Allowing default module: ${moduleId}`);
                return true;
            }
            console.log(`[PERMISSIONS] Module not found, matrix.length=${matrix.length}`);
            return matrix.length === 0;
        }

        const result = module.roles[roleKey] === true;
        console.log(`[PERMISSIONS] Final result for ${moduleId}.${roleKey}: ${result}`);
        return result;
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
