import { useAccessControl as usePermissionContext } from '@/contexts/PermissionContext';

/**
 * Hook to share access control logic across components.
 * This is now a lightweight wrapper around PermissionContext to ensure
 * all components share exactly the same state and socket listener.
 */
export function useAccessControl() {
    return usePermissionContext();
}
