import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../../infrastructure/utils/AppError';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        role: string;
    };
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction) => {
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { id: string, role: string };
        req.user = decoded;
        next();
    } catch (err: any) {
        console.error('JWT Verification Failed:', err.message);
        return next(new AppError('Invalid token. Please log in again.', 401));
    }
};

export const restrictTo = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        const userRole = req.user?.role?.toUpperCase().trim() || '';
        const allowedRoles = roles.map(r => r.toUpperCase().trim());

        console.log(`[AUTH-DEBUG] User Role: '${userRole}' (chars: ${[...userRole].map(c => c.charCodeAt(0)).join(',')})`);
        console.log(`[AUTH-DEBUG] Required Roles: ${allowedRoles.join(', ')}`);

        if (!req.user || !allowedRoles.includes(userRole)) {
            console.warn(`[AUTH] Access denied. User Role: '${userRole}', Required: ${allowedRoles.join(', ')}`);
            return next(
                new AppError(`Permission denied. Role '${userRole}' is not authorized. Required: [${allowedRoles.join(', ')}]`, 403)
            );
        }
        next();
    };
};
