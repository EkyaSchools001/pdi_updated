import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import routes from './api/routes';
import { globalAppErrorHandler } from './api/middlewares/errorHandler';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

dotenv.config();

const app: Application = express();

// Middlewares
app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP to avoid potential issues with frontend assets
    crossOriginEmbedderPolicy: false, // Allow iframes
    xFrameOptions: false, // Disable to allow cross-port iframes in dev
}));
app.use(cors({
    origin: [
        /^http:\/\/localhost:\d+$/,
        /^http:\/\/127\.0\.0\.1:\d+$/,
        'http://localhost:8081',
        'http://localhost:8080',
        'http://127.0.0.1:8080',
        'http://localhost:5173',
        'http://localhost:5174', // Explicitly added
        'http://localhost:3000',
        process.env.FRONTEND_URL || '',
        'https://brave-aliens-sleep.loca.lt',
        'https://sad-days-knock.loca.lt',
        'https://tough-hands-refuse.loca.lt',
        /\.loca\.lt$/,  // Allow all localtunnel subdomains
        /\.onrender\.com$/ // Allow all Render subdomains
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Bypass-Tunnel-Reminder']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the frontend dist directory
const distPath = path.join(__dirname, '../../dist');
app.use(express.static(distPath));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
// Swagger Documentation
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'School Growth Hub API',
            version: '1.0.0',
            description: 'API for managing educator observations and professional development',
        },
        servers: [{ url: '/api/v1' }],
    },
    apis: ['./src/api/routes/*.ts'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Routes
app.use('/api/v1', routes);

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Catch-all middleware for SPA (replaces the broken wildcard route)
app.use((req: Request, res: Response) => {
    // If it's an API route that wasn't caught, send 404
    if (req.originalUrl.startsWith('/api')) {
        res.status(404).json({ status: 'fail', message: 'API route not found' });
        return;
    }
    // Otherwise, serve the frontend index.html
    res.sendFile(path.join(distPath, 'index.html'));
});

// Global Error Handler
app.use(globalAppErrorHandler);

export default app;
