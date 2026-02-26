import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { connectSocket } from '@/lib/socket';
import { useAuth } from '@/hooks/useAuth';

// ─── Types ───────────────────────────────────────────────────────────────────
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

// ─── Default Access Matrix ───────────────────────────────────────────────────
// Used as fallback if the DB config hasn't been saved yet.
// Module IDs must match both the backend API_MODULE_MAP and the SuperAdmin UI.
export const defaultAccessMatrix: PermissionSetting[] = [
    { moduleId: 'users', moduleName: 'User Management', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: false, TEACHER: false } },
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

// ─── Frontend Path → Module ID Mapping ───────────────────────────────────────
// Maps sidebar/route path segments to the moduleId in the matrix.
// Must cover ALL path segments used by DashboardSidebar + ModuleGuard.
const FRONTEND_MODULE_MAP: Record<string, string> = {
    // Core sidebar paths (1:1 with matrix)
    'users': 'users',
    'team': 'team',
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
    'insights': 'insights',
    'meetings': 'meetings',
    'announcements': 'announcements',
    'survey': 'survey',

    // Leader dashboard aliases
    'participation': 'courses',
    'performance': 'reports',

    // Management dashboard aliases
    'pdi-health': 'insights',
    'campus-performance': 'reports',
    'pillars': 'goals',
    'pd-impact': 'hours',
    'leadership': 'team',
    'risk': 'observations',

    // Shared aliases
    'festival': 'calendar',
    'profile': 'users',
    'okr': 'goals',
};

// ─── Role Normalization ──────────────────────────────────────────────────────
// Must stay in sync with backend accessControl.ts normalizeRole()
function normalizeRole(raw: string): keyof PermissionSetting['roles'] | '' {
    if (!raw) return '';

    let role = raw.toUpperCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();

    if (role.includes('SCHOOL LEADER') || role === 'LEADER') return 'LEADER';
    if (role.includes('MANAGEMENT') || role === 'MANAGEMENT') return 'MANAGEMENT';
    if (role.includes('TEACHER') || role === 'TEACHER') return 'TEACHER';
    if (role.includes('ADMIN') && role !== 'SUPERADMIN') return 'ADMIN';
    if (role === 'SUPERADMIN') return 'SUPERADMIN';

    return '';
}

// ─── Provider ────────────────────────────────────────────────────────────────
export function PermissionProvider({ children }: { children: React.ReactNode }) {
    const { token, isLoading: authLoading, isAuthenticated } = useAuth();
    const [matrix, setMatrix] = useState<PermissionSetting[]>(defaultAccessMatrix);
    const [formFlows, setFormFlows] = useState<FormFlowConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchConfig = useCallback(async () => {
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
                    // Merge loaded matrix with defaults (so new modules get defaults)
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
                    console.log('[PERMISSIONS] Matrix synced successfully');
                    setMatrix(mergedMatrix);
                }
                if (value.formFlows) {
                    setFormFlows(value.formFlows);
                }
            }
        } catch (error: any) {
            if (error?.response?.status !== 401 && error?.response?.status !== 404) {
                console.error('[PERMISSIONS] Sync failed:', error);
            }
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        // Fetch once auth resolves and we have a token
        if (!authLoading && token) {
            fetchConfig();
        } else if (!authLoading && !token) {
            setIsLoading(false);
        }

        // ── Real-time sync via Socket.io ──
        const socket = connectSocket(token || undefined);
        const handleSettingsUpdate = (data: { key: string }) => {
            if (data.key === 'access_matrix_config') {
                console.log('[PERMISSIONS] Socket update → reloading matrix...');
                fetchConfig();
            }
        };
        socket.on('SETTINGS_UPDATED', handleSettingsUpdate);

        // ── Tab visibility fallback ──
        const handleVisibility = () => {
            if (document.visibilityState === 'visible' && token) {
                fetchConfig();
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);

        // ── Polling fallback (30s) ──
        const pollInterval = setInterval(() => {
            if (token) fetchConfig();
        }, 30_000);

        return () => {
            socket.off('SETTINGS_UPDATED', handleSettingsUpdate);
            document.removeEventListener('visibilitychange', handleVisibility);
            clearInterval(pollInterval);
        };
    }, [fetchConfig, authLoading, token]);

    // ─── Core Permission Check ───────────────────────────────────────────
    const isModuleEnabled = (modulePath: string, role: string): boolean => {
        if (!role) return false;

        const normalizedRole = normalizeRole(role);
        if (!normalizedRole) return false;

        // SuperAdmin always has access to everything
        if (normalizedRole === 'SUPERADMIN') return true;

        // Extract module ID from path segments (deepest-first for specificity)
        const segments = modulePath.split('/').filter(Boolean).reverse();
        let moduleId: string | undefined;

        for (const segment of segments) {
            if (FRONTEND_MODULE_MAP[segment]) {
                moduleId = FRONTEND_MODULE_MAP[segment];
                break;
            }
        }

        // Path doesn't map to any controlled module → allow (e.g. /teacher, /dashboard)
        if (!moduleId) return true;

        // Look up in active matrix
        const moduleEntry = matrix.find(m => m.moduleId === moduleId);

        if (!moduleEntry) {
            // Module exists in code but not yet in the matrix → allow
            return true;
        }

        return moduleEntry.roles[normalizedRole] === true;
    };

    return (
        <PermissionContext.Provider value={{ matrix, formFlows, isLoading, isModuleEnabled, refreshConfig: fetchConfig }}>
            {children}
        </PermissionContext.Provider>
    );
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useAccessControl() {
    const context = useContext(PermissionContext);
    if (!context) {
        throw new Error('useAccessControl must be used within a PermissionProvider');
    }
    return context;
}
