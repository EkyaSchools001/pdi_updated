import { Request, Response } from 'express';
import prisma from '../../infrastructure/database/prisma';

// Helper: safely parse JSON string or return default
const safeJSON = (val: any, def: any = []) => {
    if (!val) return def;
    if (typeof val !== 'string') return val;
    try { return JSON.parse(val); } catch { return def; }
};

// POST /life-skills-obs
export const createLifeSkillsObs = async (req: Request, res: Response) => {
    try {
        const {
            teacherEmail, observerEmail, observationDate,
            block, grade, section, overallRating,
            ...rest
        } = req.body;

        // Find teacher by email
        const teacher = await prisma.user.findUnique({ where: { email: teacherEmail } });
        if (!teacher) {
            return res.status(404).json({ success: false, message: 'Teacher not found' });
        }

        // Find observer by email
        const observer = await prisma.user.findUnique({ where: { email: observerEmail } });
        if (!observer) {
            return res.status(404).json({ success: false, message: 'Observer not found' });
        }

        const obs = await prisma.growthObservation.create({
            data: {
                teacherId: teacher.id,
                observerId: observer.id,
                campusId: teacher.campusId,
                academicYear: 'AY 25-26', // Default or from body
                moduleType: 'LIFE_SKILLS',
                block,
                grade,
                section,
                observationDate: observationDate ? new Date(observationDate) : new Date(),
                overallRating: Number(overallRating) || 0,
                status: 'SUBMITTED',
                formPayload: JSON.stringify(rest),
            },
        });

        return res.status(201).json({ success: true, data: obs });
    } catch (error) {
        console.error('Error creating life skills observation:', error);
        return res.status(500).json({ success: false, message: 'Failed to create observation' });
    }
};

// GET /life-skills-obs
export const getAllLifeSkillsObs = async (req: Request, res: Response) => {
    try {
        const { block, grade, rating, observer } = req.query;

        const all = await prisma.growthObservation.findMany({
            where: { moduleType: 'LIFE_SKILLS' },
            include: {
                teacher: { select: { fullName: true, email: true } },
                observer: { select: { fullName: true, email: true } }
            },
            orderBy: { createdAt: 'desc' },
        });

        // Parse JSON fields and apply filters
        let results = all.map((o) => {
            const payload = safeJSON(o.formPayload, {});
            return {
                ...o,
                ...payload,
                teacherName: o.teacher.fullName,
                teacherEmail: o.teacher.email,
                observerName: o.observer.fullName,
                observerEmail: o.observer.email,
            };
        });

        if (block) results = results.filter((r) => r.block === block);
        if (grade) results = results.filter((r) => r.grade === grade);
        if (rating) results = results.filter((r) => r.overallRating === Number(rating));
        if (observer) results = results.filter((r) =>
            r.observerName.toLowerCase().includes((observer as string).toLowerCase())
        );

        return res.status(200).json({ success: true, data: { observations: results, total: results.length } });
    } catch (error) {
        console.error('Error fetching life skills observations:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch observations' });
    }
};

// GET /life-skills-obs/:id
export const getLifeSkillsObsById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const obs: any = await prisma.growthObservation.findUnique({
            where: { id: String(id) },
            include: {
                teacher: { select: { fullName: true, email: true } },
                observer: { select: { fullName: true, email: true } }
            }
        });
        if (!obs || obs.moduleType !== 'LIFE_SKILLS') {
            return res.status(404).json({ success: false, message: 'Not found' });
        }

        const payload = safeJSON(obs.formPayload, {});

        return res.status(200).json({
            success: true,
            data: {
                ...obs,
                ...payload,
                teacherName: obs.teacher.fullName,
                teacherEmail: obs.teacher.email,
                observerName: obs.observer.fullName,
                observerEmail: obs.observer.email,
            },
        });
    } catch (error) {
        console.error('Error fetching life skills observation:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch observation' });
    }
};

