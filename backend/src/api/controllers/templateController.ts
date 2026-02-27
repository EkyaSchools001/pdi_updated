import { Request, Response, NextFunction } from 'express';
import prisma from '../../infrastructure/database/prisma';
import { AppError } from '../../infrastructure/utils/AppError';



// Get all form templates
export const getAllTemplates = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { type } = req.query;

        const filter: any = {};
        if (type) filter.type = type;

        const templates = await prisma.formTemplate.findMany({
            where: filter,
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({
            status: 'success',
            results: templates.length,
            data: { templates }
        });

    } catch (err) {
        next(err);
    }
};

// Get a single template by ID
export const getTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

        const template = await prisma.formTemplate.findUnique({
            where: { id }
        });

        if (!template) {
            return next(new AppError('Template not found', 404));
        }

        res.status(200).json({
            status: 'success',
            data: { template }
        });
    } catch (err) {
        next(err);
    }
};

// Create a new template
export const createTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { type, name, structure, isDefault } = req.body;

        const newTemplate = await prisma.formTemplate.create({
            data: {
                type,
                name,
                structure: JSON.stringify(structure),
                isDefault: Boolean(isDefault)
            }
        });

        res.status(201).json({
            status: 'success',
            data: { template: newTemplate }
        });
    } catch (err) {
        next(err);
    }
};

// Update a template
export const updateTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const { type, name, structure, isDefault } = req.body;

        const updatedTemplate = await prisma.formTemplate.update({
            where: { id },
            data: {
                ...(type && { type }),
                ...(name && { name }),
                ...(structure && { structure: JSON.stringify(structure) }),
                ...(isDefault !== undefined && { isDefault: Boolean(isDefault) })
            }
        });

        res.status(200).json({
            status: 'success',
            data: { template: updatedTemplate }
        });
    } catch (err) {
        next(err);
    }
};

// Delete a template
export const deleteTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

        await prisma.formTemplate.delete({
            where: { id }
        });

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (err) {
        next(err);
    }
};
