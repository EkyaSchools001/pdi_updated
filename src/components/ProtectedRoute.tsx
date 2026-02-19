import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAccessControl } from '@/hooks/useAccessControl';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const { isModuleEnabled, isLoading: isMatrixLoading } = useAccessControl();
    const location = useLocation();

    if (isAuthLoading || isMatrixLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        // Redirect to their respective dashboard if they try to access an unauthorized route
        const defaultPath =
            (user.role === 'ADMIN' || user.role === 'SUPERADMIN') ? '/admin' :
                (user.role === 'LEADER' || user.role === 'SCHOOL_LEADER') ? '/leader' :
                    (user.role === 'MANAGEMENT') ? '/management' : '/teacher';

        return <Navigate to={defaultPath} replace />;
    }

    // Dynamic Access Matrix Check
    if (user && !isModuleEnabled(location.pathname, user.role)) {
        console.warn(`Access denied by SuperAdmin Matrix: ${location.pathname} for role ${user.role}`);
        const defaultPath =
            (user.role === 'ADMIN' || user.role === 'SUPERADMIN') ? '/admin' :
                (user.role === 'LEADER' || user.role === 'SCHOOL_LEADER') ? '/leader' :
                    (user.role === 'MANAGEMENT') ? '/management' : '/teacher';

        return <Navigate to={defaultPath} replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
