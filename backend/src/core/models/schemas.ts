import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

export const createObservationSchema = z.object({
    teacherId: z.string().uuid(),
    date: z.string(),
    domain: z.string(),
    score: z.number().min(1).max(5),
    notes: z.string().optional(),
    domainRatings: z.array(z.object({
        domainId: z.number(),
        title: z.string(),
        rating: z.string(),
        evidence: z.string().optional(),
    })).optional(),
});

export const createGoalSchema = z.object({
    teacherId: z.string().uuid().optional(),
    teacherEmail: z.string().email().optional(),
    title: z.string().min(3),
    description: z.string().optional(),
    dueDate: z.string(),
    isSchoolAligned: z.boolean().optional().default(false),
    category: z.string().optional(),
});
