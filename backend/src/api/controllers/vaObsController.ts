import { Request, Response } from 'express';
import prisma from '../../infrastructure/database/prisma';

const safeJSON = (val: any, def: any = []) => {
    if (!val) return def;
    if (typeof val !== 'string') return val;
    try { return JSON.parse(val); } catch { return def; }
};

export const createVAObs = async (req: Request, res: Response) => {
    try {
        const b = req.body;
        const obs = await (prisma as any).visualArtsObservation.create({
            data: {
                academicYear: 'AY 25-26',
                observerEmail: b.observerEmail,
                teacherName: b.teacherName,
                teacherEmail: b.teacherEmail,
                observerName: b.observerName,
                observerRole: b.observerRole,
                observerRoleOther: b.observerRoleOther || '',
                observationDate: b.observationDate,
                block: b.block,
                grade: b.grade,
                section: b.section,
                sectionA: JSON.stringify(b.sectionA || {}),
                sectionAEvidence: b.sectionAEvidence || '',
                sectionB1: JSON.stringify(b.sectionB1 || {}),
                sectionB1Evidence: b.sectionB1Evidence || '',
                sectionB2: JSON.stringify(b.sectionB2 || {}),
                sectionB2Evidence: b.sectionB2Evidence || '',
                sectionB3: JSON.stringify(b.sectionB3 || {}),
                sectionB3Evidence: b.sectionB3Evidence || '',
                sectionB4: JSON.stringify(b.sectionB4 || {}),
                sectionB4Evidence: b.sectionB4Evidence || '',
                sectionC: JSON.stringify(b.sectionC || {}),
                sectionCEvidence: b.sectionCEvidence || '',
                overallRating: b.overallRating || '',
                cultureTools: JSON.stringify(b.cultureTools || []),
                routinesObserved: JSON.stringify(b.routinesObserved || []),
                studioHabits: JSON.stringify(b.studioHabits || []),
                instructionalTools: JSON.stringify(b.instructionalTools || []),
                feedback: b.feedback || '',
                teacherReflection: b.teacherReflection || '',
                actionStep: b.actionStep || '',
                metaTags: JSON.stringify(b.metaTags || []),
                status: 'Submitted',
            },
        });
        return res.status(201).json({ success: true, data: obs });
    } catch (error) {
        console.error('Error creating VA observation:', error);
        return res.status(500).json({ success: false, message: 'Failed to create observation' });
    }
};

export const getAllVAObs = async (req: Request, res: Response) => {
    try {
        const { block, grade, rating } = req.query;
        let results = (await (prisma as any).visualArtsObservation.findMany({
            orderBy: { createdAt: 'desc' },
        })).map((o: any) => ({
            ...o,
            sectionA: safeJSON(o.sectionA, {}),
            sectionB1: safeJSON(o.sectionB1, {}),
            sectionB2: safeJSON(o.sectionB2, {}),
            sectionB3: safeJSON(o.sectionB3, {}),
            sectionB4: safeJSON(o.sectionB4, {}),
            sectionC: safeJSON(o.sectionC, {}),
            cultureTools: safeJSON(o.cultureTools, []),
            routinesObserved: safeJSON(o.routinesObserved, []),
            studioHabits: safeJSON(o.studioHabits, []),
            instructionalTools: safeJSON(o.instructionalTools, []),
            metaTags: safeJSON(o.metaTags, []),
        }));
        if (block) results = results.filter((r: any) => r.block === block);
        if (grade) results = results.filter((r: any) => r.grade === grade);
        if (rating) results = results.filter((r: any) => r.overallRating === rating);
        return res.status(200).json({ success: true, data: { observations: results, total: results.length } });
    } catch (error) {
        console.error('Error fetching VA observations:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch observations' });
    }
};

export const getVAObsById = async (req: Request, res: Response) => {
    try {
        const obs = await (prisma as any).visualArtsObservation.findUnique({ where: { id: req.params.id } });
        if (!obs) return res.status(404).json({ success: false, message: 'Not found' });
        return res.status(200).json({ success: true, data: obs });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to fetch observation' });
    }
};
