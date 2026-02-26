import axios, { AxiosInstance, AxiosError } from 'axios';
import { toast } from 'sonner';

// Smart API URL detection
// If accessed via tunnel (loca.lt), use tunnel backend
// If accessed via localhost, use localhost backend
const getApiUrl = () => {
    const hostname = window.location.hostname;

    // 1. If VITE_API_URL is set (Render/External Backend), use it
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }

    // 2. If accessed via localtunnel
    if (hostname.includes('loca.lt')) {
        return 'https://tough-hands-refuse.loca.lt/api/v1';
    }

    // 3. Cloudflare Pages default (same domain functions)
    if (import.meta.env.PROD) {
        return '/api/v1';
    }

    // 4. Localhost fallback
    const url = 'http://localhost:4000/api/v1';
    return url.endsWith('/') ? url : `${url}/`;
};

const API_URL = getApiUrl();
console.log('--- DEBUG API URL ---', API_URL);
console.log('--- VITE_API_URL ---', import.meta.env.VITE_API_URL);

const api: AxiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Bypass-Tunnel-Reminder': 'true',
    },
});

// Request Interceptor
api.interceptors.request.use(
    (config) => {
        // Strip leading slash if present to avoid Axios replacing the path part of baseURL
        if (config.url && config.url.startsWith('/')) {
            config.url = config.url.substring(1);
        }

        const token = sessionStorage.getItem('auth_token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        const status = error.response ? error.response.status : null;

        if (status === 401) {
            // Unauthorized - clear this tab's session and redirect to login
            sessionStorage.removeItem('auth_token');
            sessionStorage.removeItem('user_data');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
                toast.error('Session expired. Please log in again.');
            }
        } else if (status === 403) {
            const message = (error.response?.data as any)?.message || 'You do not have permission to perform this action.';
            toast.error(message);
        } else if (status === 404) {
            toast.error('Resource not found.');
        } else if (status === 500) {
            toast.error('Internal server error. Please try again later.');
        } else if (!status) {
            toast.error('Network error. Please check your connection.');
        }

        return Promise.reject(error);
    }
);

export default api;
