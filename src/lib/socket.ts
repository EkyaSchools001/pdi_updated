import { io, Socket } from 'socket.io-client';

// In production, use the same origin (relative) or valid VITE_API_URL
// In development, default to localhost:4000
const API_URL = import.meta.env.PROD
    ? (import.meta.env.VITE_API_URL?.replace('/api/v1', '') || window.location.origin)
    : 'http://localhost:4000';


let socket: Socket;

export const connectSocket = (token?: string) => {
    if (!socket || !socket.connected) {
        socket = io(API_URL, {
            auth: {
                token: token || sessionStorage.getItem('auth_token')
            },
            reconnection: true,
            reconnectionAttempts: 5,
        });

        socket.on('connect', () => {
            console.log('Connected to socket server:', socket.id);
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from socket server');
        });
    }
    return socket;
};

export const getSocket = () => {
    if (!socket) {
        return connectSocket();
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
    }
};
