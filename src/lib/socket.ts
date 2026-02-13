import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:4000';

let socket: Socket;

export const connectSocket = (token?: string) => {
    if (!socket || !socket.connected) {
        socket = io(API_URL, {
            auth: {
                token: token || localStorage.getItem('auth_token')
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
