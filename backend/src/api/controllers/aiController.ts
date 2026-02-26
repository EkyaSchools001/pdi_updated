import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import * as aiService from '../services/aiService';

export const generateQuestions = async (req: AuthRequest, res: Response) => {
    try {
        const { prompt, count } = req.body;

        if (!prompt) {
            return res.status(400).json({ status: 'error', message: 'Prompt is required' });
        }

        const questions = await aiService.generateQuestions(prompt, count || 5);

        res.status(200).json({
            status: 'success',
            data: { questions }
        });
    } catch (error: any) {
        console.error('Error in AI question generation controller:', error);
        res.status(500).json({
            status: 'error',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
