import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { getSocket } from '@/lib/socket';

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
    const [matrix, setMatrix] = useState<PermissionSetting[]>([]);
    const [formFlows, setFormFlows] = useState<FormFlowConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchConfig = useCallback(async () => {
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
        } catch (error) {
            console.error("[PERMISSIONS] Sync failed:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConfig();

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
    }, [fetchConfig]);

    const isModuleEnabled = (modulePath: string, role: string) => {
        if (!role) return false;

        // 1. Precise Role Normalization
        let roleKey = role.toUpperCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim() as keyof PermissionSetting['roles'];
        if ((roleKey as string).includes('SCHOOL LEADER') || (roleKey as string) === 'LEADER') {
            roleKey = 'LEADER' as any;
        }

        // 2. SuperAdmin Master Bypass
        if (roleKey === 'SUPERADMIN') return true;

        // 3. Path to Module ID Registry
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

            '/teacher/observations': 'observations',
            '/teacher/goals': 'goals',
            '/teacher/calendar': 'calendar',
            '/teacher/attendance': 'attendance',
            '/teacher/courses': 'courses',
            '/teacher/hours': 'hours',
            '/teacher/documents': 'documents',
            '/teacher/insights': 'insights',

            '/leader/observe': 'observations',
            '/leader/observations': 'observations',
            '/leader/team': 'users',
            '/leader/goals': 'goals',
            '/leader/participation': 'courses',
            '/leader/performance': 'reports',
            '/leader/calendar': 'calendar',
            '/leader/attendance': 'attendance',
            '/leader/reports': 'reports'
        };

        // 4. Pattern Matching
        const sortedKeys = Object.keys(pathMatch).sort((a, b) => b.length - a.length);
        let moduleId: string | undefined = undefined;

        for (const key of sortedKeys) {
            if (modulePath.startsWith(key)) {
                moduleId = pathMatch[key];
                break;
            }
        }

        if (!moduleId) return true; // Default visible for paths outside management

        // 5. Look up in active matrix
        const module = matrix.find(m => m.moduleId === moduleId);

        // Block modules if matrix loaded but entry missing
        if (!module) return matrix.length === 0;

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
