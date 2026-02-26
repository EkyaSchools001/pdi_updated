import { Request, Response } from 'express';
import prisma from '../../infrastructure/database/prisma';

const safeJSON = (val: any, def: any = []) => {
    if (!val) return def;
    if (typeof val !== 'string') return val;
    try { return JSON.parse(val); } catch { return def; }
};

export const createPEObs = async (req: Request, res: Response) => {
    try {
        const body = req.body;
        const obs = await prisma.physicalEducationObservation.create({
            data: {
                observerEmail: body.observerEmail,
                teacherName: body.teacherName,
                teacherEmail: body.teacherEmail,
                observerName: body.observerName,
                observerRole: body.observerRole,
                observerRoleOther: body.observerRoleOther || '',
                observationDate: body.observationDate,
                block: body.block,
                grade: body.grade,
                section: body.section,
                sectionAResponses: JSON.stringify(body.sectionAResponses || {}),
                sectionAEvidence: body.sectionAEvidence || '',
                sectionBResponses: JSON.stringify(body.sectionBResponses || {}),
                sectionBEvidence: body.sectionBEvidence || '',
                sectionCResponses: JSON.stringify(body.sectionCResponses || {}),
                sectionCEvidence: body.sectionCEvidence || '',
                overallRating: Number(body.overallRating) || 0,
                cultureTools: JSON.stringify(body.cultureTools || []),
                routinesObserved: JSON.stringify(body.routinesObserved || []),
                instructionalTools: JSON.stringify(body.instructionalTools || []),
                discussedWithTeacher: Boolean(body.discussedWithTeacher),
                feedback: body.feedback || '',
                teacherReflection: body.teacherReflection || '',
                actionStep: body.actionStep || '',
                metaTags: JSON.stringify(body.metaTags || []),
                status: 'Submitted',
            },
        });
        return res.status(201).json({ success: true, data: obs });
    } catch (error) {
        console.error('Error creating PE observation:', error);
        return res.status(500).json({ success: false, message: 'Failed to create observation' });
    }
};

export const getAllPEObs = async (req: Request, res: Response) => {
    try {
        const { block, grade, rating } = req.query;
        let results = (await prisma.physicalEducationObservation.findMany({
            orderBy: { createdAt: 'desc' },
        })).map(o => ({
            ...o,
            sectionAResponses: safeJSON(o.sectionAResponses, {}),
            sectionBResponses: safeJSON(o.sectionBResponses, {}),
            sectionCResponses: safeJSON(o.sectionCResponses, {}),
            cultureTools: safeJSON(o.cultureTools, []),
            routinesObserved: safeJSON(o.routinesObserved, []),
            instructionalTools: safeJSON(o.instructionalTools, []),
            metaTags: safeJSON(o.metaTags, []),
        }));
        if (block) results = results.filter(r => r.block === block);
        if (grade) results = results.filter(r => r.grade === grade);
        if (rating) results = results.filter(r => r.overallRating === Number(rating));
        return res.status(200).json({ success: true, data: { observations: results, total: results.length } });
    } catch (error) {
        console.error('Error fetching PE observations:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch observations' });
    }
};

export const getPEObsById = async (req: Request, res: Response) => {
    try {
        const obs = await prisma.physicalEducationObservation.findUnique({ where: { id: req.params.id } });
        if (!obs) return res.status(404).json({ success: false, message: 'Not found' });
        return res.status(200).json({ success: true, data: { ...obs, sectionAResponses: safeJSON(obs.sectionAResponses, {}), sectionBResponses: safeJSON(obs.sectionBResponses, {}), sectionCResponses: safeJSON(obs.sectionCResponses, {}), cultureTools: safeJSON(obs.cultureTools, []), routinesObserved: safeJSON(obs.routinesObserved, []), instructionalTools: safeJSON(obs.instructionalTools, []), metaTags: safeJSON(obs.metaTags, []) } });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to fetch observation' });
    }
};
