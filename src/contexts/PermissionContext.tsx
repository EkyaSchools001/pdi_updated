import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { getSocket } from '@/lib/socket';
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

export function PermissionProvider({ children }: { children: React.ReactNode }) {
    const { token, isLoading: authLoading } = useAuth();
    const [matrix, setMatrix] = useState<PermissionSetting[]>([]);
    const [formFlows, setFormFlows] = useState<FormFlowConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { isAuthenticated } = useAuth();

    const fetchConfig = useCallback(async () => {
<<<<<<< HEAD
        if (!isAuthenticated) {
            setIsLoading(false);
            return;
        }

=======
        // Only fetch if we have a token (user is authenticated)
        const storedToken = sessionStorage.getItem('auth_token');
        if (!storedToken) {
            setIsLoading(false);
            return;
        }
>>>>>>> 671618a132606d35e0ed995e1340f06599d53759
        try {
            console.log('[PERMISSIONS] Fetching latest access matrix...');
            const response = await api.get('/settings/access_matrix_config');
            if (response.data.status === 'success' && response.data.data.setting) {
                const value = JSON.parse(response.data.data.setting.value);
                if (value.accessMatrix) {
                    console.log('[PERMISSIONS] Matrix synced successfully:', value.accessMatrix);
                    setMatrix(value.accessMatrix);
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

        const socket = getSocket();

        const handleSettingsUpdate = (data: { key: string }) => {
            console.log('[PERMISSIONS] Socket update received, reloading matrix...', data);
            if (data.key === 'access_matrix_config') {
                fetchConfig();
            }
        };

        socket.on('SETTINGS_UPDATED', handleSettingsUpdate);
        console.log('[PERMISSIONS] Registered real-time socket listener');

        return () => {
            socket.off('SETTINGS_UPDATED', handleSettingsUpdate);
        };
    }, [fetchConfig, authLoading, token]);

    const isModuleEnabled = (modulePath: string, role: string) => {
        if (!role) return false;

        // 1. Precise Role Normalization
        let roleKey = role.toUpperCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim() as keyof PermissionSetting['roles'];
        if ((roleKey as string).includes('SCHOOL LEADER') || (roleKey as string) === 'LEADER') {
            roleKey = 'LEADER' as any;
        }

        // 2. SuperAdmin Master Bypass
        if (roleKey === 'SUPERADMIN') return true;

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
