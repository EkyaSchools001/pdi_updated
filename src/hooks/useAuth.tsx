import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';

interface User {
    id: string;
    fullName: string;
    email: string;
    role: 'ADMIN' | 'LEADER' | 'SCHOOL_LEADER' | 'TEACHER' | 'MANAGEMENT' | 'SUPERADMIN';
    avatarUrl?: string;
    department?: string;
    campusId?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, userData: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Use sessionStorage so each tab has its own independent session.
        // This allows different users to be logged in simultaneously in different tabs.
        const storedToken = sessionStorage.getItem('auth_token');
        const storedUser = sessionStorage.getItem('user_data');

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        } else {
            setToken(null);
            setUser(null);
        }

        setIsLoading(false);
    }, []);

    const login = (newToken: string, userData: User) => {
        setToken(newToken);
        setUser(userData);
        // Store in sessionStorage — tab-scoped, not shared across tabs
        sessionStorage.setItem('auth_token', newToken);
        sessionStorage.setItem('user_data', JSON.stringify(userData));

        // Auto-redirect based on role
        switch (userData.role) {
            case 'ADMIN':
            case 'SUPERADMIN':
                navigate('/admin');
                break;
            case 'LEADER':
            case 'SCHOOL_LEADER':
                navigate('/leader');
                break;
            case 'TEACHER':
                navigate('/teacher');
                break;
            case 'MANAGEMENT':
                navigate('/management');
                break;
            default:
                navigate('/');
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('user_data');
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
