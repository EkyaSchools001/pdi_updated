import { Request, Response, NextFunction } from 'express';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../../infrastructure/database/prisma';
import { AppError } from '../../infrastructure/utils/AppError';
import { loginSchema } from '../../core/models/schemas';

const signToken = (id: string, role: string, fullName: string, campusId?: string | null, department?: string | null, academics?: string | null) => {
    return jwt.sign({ id, role, fullName, campusId, department, academics }, (process.env.JWT_SECRET || 'secret') as Secret, {
        expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as any,
    });
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = loginSchema.safeParse(req.body);
        if (!result.success) {
            return next(new AppError('Invalid input data', 400));
        }

        const { email, password } = result.data;

        // 1) Find user
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !(await bcrypt.compare(password, user.passwordHash || ''))) {
            return next(new AppError('Incorrect email or password', 401));
        }

        // 2) Sign token
        const token = signToken(user.id, user.role, user.fullName, user.campusId, user.department, user.academics);

        res.status(200).json({
            status: 'success',
            token,
            data: {
                user: {
                    id: user.id,
                    fullName: user.fullName,
                    email: user.email,
                    role: user.role,
                    academics: user.academics,
                },
            },
        });
    } catch (err) {
        next(err);
    }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
    // Logic for token refresh would go here
    res.status(200).json({ status: 'success', message: 'TBD' });
};
