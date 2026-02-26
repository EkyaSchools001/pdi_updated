import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.PROD
    ? (import.meta.env.VITE_API_URL?.replace('/api/v1', '') || window.location.origin)
    : 'http://localhost:4000';

let socket: Socket | null = null;

console.log('[SOCKET] Initializing socket client, URL:', API_URL);

export const connectSocket = (token?: string) => {
    const authToken = token || sessionStorage.getItem('auth_token');
    
    if (!socket) {
        console.log('[SOCKET] Creating new socket connection');
        
        socket = io(API_URL, {
            auth: { token: authToken },
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            transports: ['websocket', 'polling'],
        });

        socket.on('connect', () => {
            console.log('[SOCKET] ✅ Connected with ID:', socket?.id);
        });

        socket.on('disconnect', (reason) => {
            console.log('[SOCKET] ❌ Disconnected:', reason);
        });

        socket.on('connect_error', (error) => {
            console.error('[SOCKET] ⚠️ Connection error:', error.message);
        });
        
        socket.on('SETTINGS_UPDATED', (data: any) => {
            console.log('[SOCKET] 📡 Event received:', data);
        });
    }
    
    return socket;
};

export const getSocket = () => {
    if (!socket) {
        socket = connectSocket();
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
