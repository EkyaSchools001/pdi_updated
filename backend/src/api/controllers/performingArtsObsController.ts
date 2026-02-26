import { Request, Response, NextFunction } from 'express';
import prisma from '../../infrastructure/database/prisma';
import { AppError } from '../../infrastructure/utils/AppError';

// POST /performing-arts-obs
export const createObservation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {
            observerEmail, teacherName, teacherEmail, observerName, observerRole, observerRoleOther,
            observationDate, block, grade, section,
            sectionAResponses, sectionAEvidence,
            sectionBResponses, sectionBEvidence,
            sectionCResponses, sectionCEvidence,
            overallRating, cultureTools, routinesObserved, instructionalTools,
            discussedWithTeacher, feedback, teacherReflection, actionStep, metaTags
        } = req.body;

        const record = await prisma.performingArtsObservation.create({
            data: {
                observerEmail,
                teacherName,
                teacherEmail,
                observerName,
                observerRole,
                observerRoleOther: observerRoleOther || null,
                observationDate,
                block,
                grade,
                section,
                sectionAResponses: JSON.stringify(sectionAResponses || {}),
                sectionAEvidence,
                sectionBResponses: JSON.stringify(sectionBResponses || {}),
                sectionBEvidence,
                sectionCResponses: JSON.stringify(sectionCResponses || {}),
                sectionCEvidence,
                overallRating: parseInt(overallRating),
                cultureTools: JSON.stringify(cultureTools || []),
                routinesObserved: JSON.stringify(routinesObserved || []),
                instructionalTools: JSON.stringify(instructionalTools || []),
                discussedWithTeacher: !!discussedWithTeacher,
                feedback,
                teacherReflection,
                actionStep,
                metaTags: JSON.stringify(metaTags || []),
                status: 'Submitted',
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

        let where: any = {};
        if (block) where.block = block;
        if (grade) where.grade = grade;
        if (observer) where.observerEmail = observer;
        if (rating) where.overallRating = parseInt(rating as string);
        if (dateFrom || dateTo) {
            where.observationDate = {};
            if (dateFrom) where.observationDate.gte = dateFrom;
            if (dateTo) where.observationDate.lte = dateTo;
        }

        const records = await prisma.performingArtsObservation.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        // Parse JSON fields for response
        const parsed = records.map(r => ({
            ...r,
            sectionAResponses: JSON.parse(r.sectionAResponses),
            sectionBResponses: JSON.parse(r.sectionBResponses),
            sectionCResponses: JSON.parse(r.sectionCResponses),
            cultureTools: JSON.parse(r.cultureTools),
            routinesObserved: JSON.parse(r.routinesObserved),
            instructionalTools: JSON.parse(r.instructionalTools),
            metaTags: JSON.parse(r.metaTags),
        }));

        res.status(200).json({ status: 'success', results: parsed.length, data: { observations: parsed } });
    } catch (err) {
        next(err);
    }
};

// GET /performing-arts-obs/:id
export const getObservationById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const record = await prisma.performingArtsObservation.findUnique({ where: { id } });
        if (!record) return next(new AppError('Observation not found', 404));

        const parsed = {
            ...record,
            sectionAResponses: JSON.parse(record.sectionAResponses),
            sectionBResponses: JSON.parse(record.sectionBResponses),
            sectionCResponses: JSON.parse(record.sectionCResponses),
            cultureTools: JSON.parse(record.cultureTools),
            routinesObserved: JSON.parse(record.routinesObserved),
            instructionalTools: JSON.parse(record.instructionalTools),
            metaTags: JSON.parse(record.metaTags),
        };

        res.status(200).json({ status: 'success', data: { observation: parsed } });
    } catch (err) {
        next(err);
    }
};
