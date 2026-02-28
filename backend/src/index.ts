import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { initializeSocket } from './core/socket';

const PORT = process.env.PORT || 4000;

console.log('--- Environment Check ---');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`JWT_SECRET Loaded: ${!!process.env.JWT_SECRET}`);
console.log(`DATABASE_URL Loaded: ${!!process.env.DATABASE_URL}`);
console.log('-------------------------');

const server = app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`\n🚀 Server is running on port ${PORT}`);
    console.log(`🔗 Local: http://0.0.0.0:${PORT}`);
    console.log(`💉 Health: http://0.0.0.0:${PORT}/api/health\n`);
});

console.log("DEBUG: Initializing socket...");
initializeSocket(server);
console.log("DEBUG: Socket initialized.");

// Keep process alive for debugging
setInterval(() => {
    // console.log("DEBUG: Keep-alive tick");
}, 10000);