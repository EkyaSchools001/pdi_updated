import { Request, Response, NextFunction } from 'express';
import prisma from '../../infrastructure/database/prisma';
import jwt from 'jsonwebtoken';



// ─── Cache Management ────────────────────────────────────────────────────────
// Short-lived cache to avoid DB lookup on every request
let cachedMatrix: any[] | null = null;
let lastFetchTime: number = 0;
const CACHE_TTL = 10_000; // 10 seconds

/**
 * Immediately bust the cached matrix so the next request re-fetches from DB.
 * Called from settingsController when access_matrix_config is saved.
 */
export function invalidateAccessMatrixCache() {
    cachedMatrix = null;
    lastFetchTime = 0;
    console.log('[ACCESS-MATRIX] Cache invalidated — next request will re-fetch from DB');
}

// ─── Role Normalization ──────────────────────────────────────────────────────
// Must stay in sync with PermissionContext.tsx on the frontend
function normalizeRole(raw: string): string {
    let role = raw.toUpperCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();

    if (role.includes('SCHOOL LEADER') || role === 'LEADER') return 'LEADER';
    if (role.includes('MANAGEMENT') || role === 'MANAGEMENT') return 'MANAGEMENT';
    if (role.includes('TEACHER') || role === 'TEACHER') return 'TEACHER';
    if (role.includes('ADMIN') && role !== 'SUPERADMIN') return 'ADMIN';

    return role; // SUPERADMIN or any unknown
}

// ─── API Path → Module ID Mapping ────────────────────────────────────────────
// Maps the first recognizable path segment to its parent module ID.
// Module IDs match the moduleId column in the access matrix exactly.
const API_MODULE_MAP: Record<string, string> = {
    // Core modules (1:1 with matrix moduleIds)
    'users': 'users',
    'team': 'team',
    'forms': 'forms',
    'courses': 'courses',
    'calendar': 'calendar',
    'documents': 'documents',
    'reports': 'reports',
    'settings': 'settings',
    'attendance': 'attendance',
    'observations': 'observations',
    'goals': 'goals',
    'hours': 'hours',
    'insights': 'insights',
    'meetings': 'meetings',
    'announcements': 'announcements',
    'survey': 'survey',
    'surveys': 'survey',

    // Alias routes → parent module
    'mooc': 'courses',     // MOOC submissions are part of courses
    'training': 'calendar',    // Training events = calendar
    'festivals': 'calendar',    // Learning festivals = calendar
    'analytics': 'reports',     // Analytics = reports
    'stats': 'reports',     // Stats = reports
    'assessments': 'courses',     // Assessments = courses
    'okr': 'goals',       // OKR = goals
    'pd': 'hours',       // PD hours tracking
    'templates': 'forms',       // Form templates = forms
};

// ─── Paths that bypass access control entirely ───────────────────────────────
// These endpoints must be accessible to ALL authenticated (or unauthenticated) users
const BYPASS_PATHS = [
    '/auth',                             // Login, register, token refresh
    '/upload/public',                    // Public file uploads
    '/settings/access_matrix_config',    // Every role needs to read the permission matrix
    '/notifications',                    // Every role needs notifications
    '/templates',                        // All roles read templates (for observations/reflections)
];

/**
 * Check if a request path should bypass access control.
 */
function shouldBypass(req: Request): boolean {
    if (BYPASS_PATHS.some(bp => req.path.startsWith(bp))) {
        return true;
    }
    // Allow everyone (Authenticated) to view users for directory/search
    if (req.method === 'GET' && req.path === '/users') {
        return true;
    }
    return false;
}

// ─── Main Middleware ─────────────────────────────────────────────────────────
export const roleModuleAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 1. Bypass paths that every role needs
        if (shouldBypass(req)) {
            return next();
        }

        // 2. Extract JWT token
        let token: string | undefined;
        if (req.headers.authorization?.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        // No token → let the route-level `protect` middleware handle it
        if (!token) {
            return next();
        }

        // 3. Decode token to get role (don't crash on invalid tokens)
        let decoded: any;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        } catch {
            return next(); // Invalid token → let `protect` middleware handle 401
        }

        const roleKey = normalizeRole(decoded.role || '');

        // 4. SuperAdmin bypasses ALL access control
        if (roleKey === 'SUPERADMIN') {
            return next();
        }

        // 5. Determine which module this API path belongs to
        const segments = req.path.split('/').filter(Boolean);
        let moduleId: string | undefined;

        for (const segment of segments) {
            if (API_MODULE_MAP[segment]) {
                moduleId = API_MODULE_MAP[segment];
                break;
            }
        }

        // Path doesn't map to any controlled module → allow through
        if (!moduleId) {
            return next();
        }

        // 6. Load access matrix (with cache)
        if (!cachedMatrix || (Date.now() - lastFetchTime > CACHE_TTL)) {
            try {
                const config = await prisma.systemSettings.findUnique({
                    where: { key: 'access_matrix_config' }
                });
                if (config) {
                    const parsed = JSON.parse(config.value);
                    cachedMatrix = parsed.accessMatrix || [];
                } else {
                    cachedMatrix = [];
                }
                lastFetchTime = Date.now();
            } catch (dbErr) {
                console.error('[ACCESS-MATRIX] DB fetch failed, allowing request:', dbErr);
                return next(); // Don't block users if DB is unreachable
            }
        }

        const matrix = cachedMatrix || [];

        // 7. Look up the module in the matrix
        const moduleEntry = matrix.find((m: any) => m.moduleId === moduleId);

        if (!moduleEntry) {
            // Module exists in code but not in the matrix → allow (new module, not yet configured)
            return next();
        }

        // 8. Check if this role has access
        if (moduleEntry.roles[roleKey] === true) {
            return next();
        }

        // 9. BLOCKED — role does not have access to this module
        console.warn(
            `[ACCESS-MATRIX] BLOCKED ${roleKey} → module "${moduleId}" (${moduleEntry.moduleName}) | path: ${req.method} ${req.path}`
        );

        return res.status(403).json({
            status: 'error',
            message: `Permission denied. Your role '${roleKey}' does not have access to '${moduleEntry.moduleName}'.`
        });

    } catch (err) {
        console.error('[ACCESS-MATRIX] Middleware error:', err);
        next(); // Don't block users on middleware errors
    }
};
