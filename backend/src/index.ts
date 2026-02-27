import app from './app';
import { initializeSocket } from './core/socket';

const PORT = process.env.PORT || 4000;

console.log('--- Environment Check ---');
console.log(`JWT_SECRET Loaded: ${!!process.env.JWT_SECRET}`);

if (!process.env.JWT_SECRET) {
    console.warn('WARNING: JWT_SECRET is missing! Using default "secret". This will cause 401s if tokens were signed with a different key.');
}
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