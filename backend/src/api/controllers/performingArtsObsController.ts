import { Request, Response, NextFunction } from 'express';
import prisma from '../../infrastructure/database/prisma';
import { AppError } from '../../infrastructure/utils/AppError';

// Helper: safely parse JSON string or return default
const safeJSON = (val: any, def: any = []) => {
    if (!val) return def;
    if (typeof val !== 'string') return val;
    try { return JSON.parse(val); } catch { return def; }
};

// POST /performing-arts-obs
export const createObservation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {
            teacherEmail, observerEmail, observationDate,
            block, grade, section, overallRating,
            ...rest
        } = req.body;

        const teacher = await prisma.user.findUnique({ where: { email: teacherEmail } });
        if (!teacher) return next(new AppError('Teacher not found', 404));

        const observer = await prisma.user.findUnique({ where: { email: observerEmail } });
        if (!observer) return next(new AppError('Observer not found', 404));

        const record = await prisma.growthObservation.create({
            data: {
                teacherId: teacher.id,
                observerId: observer.id,
                campusId: teacher.campusId,
                academicYear: 'AY 25-26',
                moduleType: 'PERFORMING_ARTS',
                block,
                grade,
                section,
                observationDate: observationDate ? new Date(observationDate) : new Date(),
                overallRating: Number(overallRating) || 0,
                status: 'SUBMITTED',
                formPayload: JSON.stringify(rest),
            }
        });

        res.status(201).json({ status: 'success', data: { observation: record } });
    } catch (err) {
        next(err);
    }
};

// GET /performing-arts-obs
export const getAllObservations = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { block, grade, observer, rating, dateFrom, dateTo } = req.query;

        const all = await prisma.growthObservation.findMany({
            where: { moduleType: 'PERFORMING_ARTS' },
            include: {
                teacher: { select: { fullName: true, email: true } },
                observer: { select: { fullName: true, email: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        let results = all.map(o => {
            const payload = safeJSON(o.formPayload, {});
            return {
                ...o,
                ...payload,
                teacherName: o.teacher.fullName,
                teacherEmail: o.teacher.email,
                observerName: o.observer.fullName,
                observerEmail: o.observer.email,
            }
        });

        if (block) results = results.filter(r => r.block === block);
        if (grade) results = results.filter(r => r.grade === grade);
        if (rating) results = results.filter(r => r.overallRating === Number(rating));

        if (dateFrom || dateTo) {
            results = results.filter(r => {
                const d = r.observationDate ? new Date(r.observationDate).getTime() : 0;
                if (dateFrom && d < new Date(dateFrom as string).getTime()) return false;
                if (dateTo && d > new Date(dateTo as string).getTime()) return false;
                return true;
            });
        }

        res.status(200).json({ status: 'success', results: results.length, data: { observations: results } });
    } catch (err) {
        next(err);
    }
};

// GET /performing-arts-obs/:id
export const getObservationById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const record = await prisma.growthObservation.findUnique({
            where: { id: String(id) },
            include: {
                teacher: { select: { fullName: true, email: true } },
                observer: { select: { fullName: true, email: true } }
            }
        });
        if (!record || record.moduleType !== 'PERFORMING_ARTS') return next(new AppError('Observation not found', 404));

        const payload = safeJSON(record.formPayload, {});

        const result = {
            ...record,
            ...payload,
            teacherName: record.teacher.fullName,
            teacherEmail: record.teacher.email,
            observerName: record.observer.fullName,
            observerEmail: record.observer.email,
        };

        res.status(200).json({ status: 'success', data: { observation: result } });
    } catch (err) {
        next(err);
    }
};

