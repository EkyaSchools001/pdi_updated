import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllWorkflows = async (req: Request, res: Response) => {
    try {
        const workflows = await prisma.formWorkflow.findMany({
            include: {
                formTemplate: true,
            },
        });
        res.json(workflows);
    } catch (error) {
        console.error('Error fetching workflows:', error);
        res.status(500).json({ error: 'Failed to fetch workflows' });
    }
};

export const createWorkflow = async (req: Request, res: Response) => {
    try {
        const {
            formTemplateId,
            subjectType,
            sentByRole,
            redirectTo,
            displayLocation,
            logicDescription,
            isActive,
            specificSubjects,
            targetSchool,
        } = req.body;

        const workflow = await prisma.formWorkflow.create({
            data: {
                formTemplateId,
                subjectType,
                sentByRole,
                redirectTo,
                displayLocation,
                logicDescription,
                isActive: isActive !== undefined ? isActive : true,
                specificSubjects,
                targetSchool: targetSchool || 'ALL',
            },
            include: {
                formTemplate: true,
            }
        });
        res.status(201).json(workflow);
    } catch (error) {
        console.error('Error creating workflow:', error);
        res.status(500).json({ error: 'Failed to create workflow' });
    }
};

export const updateWorkflow = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const {
            formTemplateId,
            subjectType,
            sentByRole,
            redirectTo,
            displayLocation,
            logicDescription,
            isActive,
            specificSubjects,
            targetSchool,
        } = req.body;

        const workflow = await prisma.formWorkflow.update({
            where: { id },
            data: {
                formTemplateId,
                subjectType,
                sentByRole,
                redirectTo,
                displayLocation,
                logicDescription,
                isActive,
                specificSubjects,
                targetSchool,
            },
            include: {
                formTemplate: true,
            }
        });
        res.json(workflow);
    } catch (error) {
        console.error('Error updating workflow:', error);
        res.status(500).json({ error: 'Failed to update workflow' });
    }
};

export const deleteWorkflow = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        await prisma.formWorkflow.delete({ where: { id } });
        res.json({ message: 'Workflow deleted successfully' });
    } catch (error) {
        console.error('Error deleting workflow:', error);
        res.status(500).json({ error: 'Failed to delete workflow' });
    }
};
