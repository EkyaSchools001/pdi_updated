import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { getSocket, connectSocket } from '@/lib/socket';
import { useAuth } from '@/hooks/useAuth';

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

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const defaultAccessMatrix: PermissionSetting[] = [
    { moduleId: 'users', moduleName: 'User Management', roles: { SUPERADMIN: true, ADMIN: true, LEADER: false, MANAGEMENT: false, TEACHER: false } },
    { moduleId: 'team', moduleName: 'Team Overview', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: false, TEACHER: false } },
    { moduleId: 'forms', moduleName: 'Form Templates', roles: { SUPERADMIN: true, ADMIN: true, LEADER: false, MANAGEMENT: false, TEACHER: false } },
    { moduleId: 'courses', moduleName: 'Course Catalogue', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: true, TEACHER: true } },
    { moduleId: 'calendar', moduleName: 'Training Calendar', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: true, TEACHER: true } },
    { moduleId: 'documents', moduleName: 'Documents', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: true, TEACHER: true } },
    { moduleId: 'reports', moduleName: 'Reports & Analytics', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: true, TEACHER: false } },
    { moduleId: 'settings', moduleName: 'System Settings', roles: { SUPERADMIN: true, ADMIN: false, LEADER: false, MANAGEMENT: false, TEACHER: false } },
    { moduleId: 'attendance', moduleName: 'Attendance', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: false, TEACHER: true } },
    { moduleId: 'observations', moduleName: 'Observations', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: true, TEACHER: true } },
    { moduleId: 'goals', moduleName: 'Goal Management', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: true, TEACHER: true } },
    { moduleId: 'hours', moduleName: 'PD Hours Tracking', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: true, TEACHER: true } },
    { moduleId: 'insights', moduleName: 'Data Insights', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: true, TEACHER: true } },
    { moduleId: 'meetings', moduleName: 'Meetings', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: true, TEACHER: true } },
    { moduleId: 'announcements', moduleName: 'Announcements', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: true, TEACHER: true } },
    { moduleId: 'survey', moduleName: 'Surveys', roles: { SUPERADMIN: true, ADMIN: true, LEADER: false, MANAGEMENT: true, TEACHER: true } },
];

export function PermissionProvider({ children }: { children: React.ReactNode }) {
    const { token, isLoading: authLoading } = useAuth();
    const [matrix, setMatrix] = useState<PermissionSetting[]>(defaultAccessMatrix);
    const [formFlows, setFormFlows] = useState<FormFlowConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { isAuthenticated } = useAuth();

    const fetchConfig = useCallback(async () => {
        // Only fetch if we have a token (user is authenticated)
        const storedToken = sessionStorage.getItem('auth_token');
        if (!isAuthenticated && !storedToken) {
            setIsLoading(false);
            return;
        }
        try {
            console.log('[PERMISSIONS] Fetching latest access matrix...');
            const response = await api.get('/settings/access_matrix_config');
            if (response.data.status === 'success' && response.data.data.setting) {
                const value = JSON.parse(response.data.data.setting.value);
                if (value.accessMatrix) {
                    console.log('[PERMISSIONS] Matrix synced successfully:', value.accessMatrix);
                    const mergedMatrix = defaultAccessMatrix.map(defaultItem => {
                        const loadedItem = value.accessMatrix.find((item: any) => item.moduleId === defaultItem.moduleId);
                        if (loadedItem) {
                            return {
                                ...defaultItem,
                                ...loadedItem,
                                roles: {
                                    SUPERADMIN: loadedItem.roles?.SUPERADMIN ?? defaultItem.roles.SUPERADMIN,
                                    ADMIN: loadedItem.roles?.ADMIN ?? defaultItem.roles.ADMIN,
                                    LEADER: loadedItem.roles?.LEADER ?? defaultItem.roles.LEADER,
                                    MANAGEMENT: loadedItem.roles?.MANAGEMENT ?? defaultItem.roles.MANAGEMENT,
                                    TEACHER: loadedItem.roles?.TEACHER ?? defaultItem.roles.TEACHER,
                                }
                            };
                        }
                        return defaultItem;
                    });
                    setMatrix(mergedMatrix);
                }
                if (value.formFlows) {
                    console.log('[PERMISSIONS] Form Flows synced:', value.formFlows);
                    setFormFlows(value.formFlows);
                }
            }
        } catch (error: any) {
            // Silently ignore 401/404 — matrix will be empty and defaults apply
            if (error?.response?.status !== 401 && error?.response?.status !== 404) {
                console.error("[PERMISSIONS] Sync failed:", error);
            }
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        // Only fetch once auth is resolved and we have a token
        if (!authLoading && token) {
            fetchConfig();
        } else if (!authLoading && !token) {
            setIsLoading(false);
        }

        // Ensure the socket is connected with the current tab's token
        const socket = connectSocket(token || undefined);

        const handleSettingsUpdate = (data: { key: string }) => {
            console.log('[PERMISSIONS] Socket update received, reloading matrix...', data);
            if (data.key === 'access_matrix_config') {
                fetchConfig();
            }
        };

        socket.on('SETTINGS_UPDATED', handleSettingsUpdate);
        console.log('[PERMISSIONS] Registered real-time socket listener');

        // Fallback 1: Re-fetch when tab becomes visible again (user switches back to this tab)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && token) {
                console.log('[PERMISSIONS] Tab became visible – refreshing matrix...');
                fetchConfig();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Fallback 2: Poll every 30 seconds so out-of-sync tabs always catch up
        const pollInterval = setInterval(() => {
            if (token) {
                console.log('[PERMISSIONS] Polling matrix for consistency...');
                fetchConfig();
            }
        }, 30000);

        return () => {
            socket.off('SETTINGS_UPDATED', handleSettingsUpdate);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            clearInterval(pollInterval);
        };
    }, [fetchConfig, authLoading, token]);

    const isModuleEnabled = (modulePath: string, role: string) => {
        if (!role) return false;

        // 1. Precise Role Normalization and Clean-out Logic
        let roleKey = role.toUpperCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
        if (roleKey.includes('SCHOOL LEADER') || roleKey === 'LEADER') {
            roleKey = 'LEADER';
        } else if (roleKey.includes('MANAGEMENT') || roleKey === 'MANAGEMENT') {
            roleKey = 'MANAGEMENT';
        } else if (roleKey.includes('TEACHER') || roleKey === 'TEACHER') {
            roleKey = 'TEACHER';
        } else if (roleKey.includes('ADMIN') && roleKey !== 'SUPERADMIN') {
            roleKey = 'ADMIN';
        }

        const normalizedRoleKey = roleKey as keyof PermissionSetting['roles'];

        // 2. SuperAdmin Master Bypass
        if (normalizedRoleKey === 'SUPERADMIN') return true;

        // 3. Path to Module ID Registry (Dynamic across roles)
        const moduleMap: Record<string, string> = {
            'users': 'users',
            'forms': 'forms',
            'courses': 'courses',
            'calendar': 'calendar',
            'documents': 'documents',
            'reports': 'reports',
            'settings': 'settings',
            'superadmin': 'settings',
            'attendance': 'attendance',
            'observations': 'observations',
            'observe': 'observations',
            'goals': 'goals',
            'hours': 'hours',
            'participation': 'courses', // Legacy mappings
            'performance': 'reports',
            'insights': 'insights',
            'team': 'team',
            'meetings': 'meetings',
            'survey': 'survey',
            'announcements': 'announcements'
        };

        // 4. Pattern Matching
        let moduleId: string | undefined = undefined;

        // Search through path segments to find the module
        const segments = modulePath.split('/').filter(Boolean).reverse(); // Check deepest segment first
        for (const segment of segments) {
            if (moduleMap[segment]) {
                moduleId = moduleMap[segment];
                break;
            }
        }

        if (!moduleId) return true; // Default visible for paths outside management

        // 5. Look up in active matrix
        const module = matrix.find(m => m.moduleId === moduleId);

        // Block modules if matrix loaded but entry missing
        if (!module) {
            if (['meetings', 'team', 'announcements'].includes(moduleId)) return true; // Newly added module fallback
            return matrix.length === 0;
        }

        return module.roles[normalizedRoleKey] === true;
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
