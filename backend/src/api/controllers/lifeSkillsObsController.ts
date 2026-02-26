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
            observerEmail, teacherName, teacherEmail, observerName,
            observerRole, observerRoleOther, observationDate,
            block, grade, section,
            sectionAResponses, sectionAEvidence,
            sectionBResponses, sectionBEvidence,
            sectionCResponses, sectionCEvidence,
            overallRating, cultureTools, routinesObserved, instructionalTools,
            discussedWithTeacher, feedback, teacherReflection, actionStep, metaTags,
        } = req.body;

        const obs = await prisma.lifeSkillsObservation.create({
            data: {
                observerEmail, teacherName, teacherEmail, observerName,
                observerRole, observerRoleOther: observerRoleOther || '',
                observationDate, block, grade, section,
                sectionAResponses: JSON.stringify(sectionAResponses || {}),
                sectionAEvidence: sectionAEvidence || '',
                sectionBResponses: JSON.stringify(sectionBResponses || {}),
                sectionBEvidence: sectionBEvidence || '',
                sectionCResponses: JSON.stringify(sectionCResponses || {}),
                sectionCEvidence: sectionCEvidence || '',
                overallRating: Number(overallRating) || 0,
                cultureTools: JSON.stringify(cultureTools || []),
                routinesObserved: JSON.stringify(routinesObserved || []),
                instructionalTools: JSON.stringify(instructionalTools || []),
                discussedWithTeacher: Boolean(discussedWithTeacher),
                feedback: feedback || '',
                teacherReflection: teacherReflection || '',
                actionStep: actionStep || '',
                metaTags: JSON.stringify(metaTags || []),
                status: 'Submitted',
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

        const all = await prisma.lifeSkillsObservation.findMany({
            orderBy: { createdAt: 'desc' },
        });

        // Parse JSON fields and apply filters
        let results = all.map((o) => ({
            ...o,
            sectionAResponses: safeJSON(o.sectionAResponses, {}),
            sectionBResponses: safeJSON(o.sectionBResponses, {}),
            sectionCResponses: safeJSON(o.sectionCResponses, {}),
            cultureTools: safeJSON(o.cultureTools, []),
            routinesObserved: safeJSON(o.routinesObserved, []),
            instructionalTools: safeJSON(o.instructionalTools, []),
            metaTags: safeJSON(o.metaTags, []),
        }));

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
        const obs = await prisma.lifeSkillsObservation.findUnique({ where: { id } });
        if (!obs) return res.status(404).json({ success: false, message: 'Not found' });
        return res.status(200).json({
            success: true,
            data: {
                ...obs,
                sectionAResponses: safeJSON(obs.sectionAResponses, {}),
                sectionBResponses: safeJSON(obs.sectionBResponses, {}),
                sectionCResponses: safeJSON(obs.sectionCResponses, {}),
                cultureTools: safeJSON(obs.cultureTools, []),
                routinesObserved: safeJSON(obs.routinesObserved, []),
                instructionalTools: safeJSON(obs.instructionalTools, []),
                metaTags: safeJSON(obs.metaTags, []),
            },
        });
    } catch (error) {
        console.error('Error fetching life skills observation:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch observation' });
    }
};
