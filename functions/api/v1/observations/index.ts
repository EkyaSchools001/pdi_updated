import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '../../../utils/auth';

interface Env {
    DATABASE_URL: string;
    JWT_SECRET: string;
    VITE_SUPABASE_URL: string;
    VITE_SUPABASE_PUBLISHABLE_KEY: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ message: "Unauthorized" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }

        const token = authHeader.split(' ')[1];
        const user = await verifyToken(token, env.JWT_SECRET);

        if (!user) {
            return new Response(JSON.stringify({ message: "Unauthorized" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }

        const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);

        let query = supabase
            .from('Observation')
            .select('*, teacher:User!Observation_teacherId_fkey(id, fullName, email)');

        // RBAC: Teachers only see their own
        if (user.role === 'TEACHER') {
            query = query.eq('teacherId', user.id);
        }

        const { data: observations, error } = await query;

        if (error) throw error;

        return new Response(JSON.stringify({
            status: 'success',
            results: observations.length,
            data: { observations }
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err: any) {
        return new Response(JSON.stringify({
            status: 'error',
            message: err.message || 'Internal Server Error'
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ message: "Unauthorized" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }

        const token = authHeader.split(' ')[1];
        const user = await verifyToken(token, env.JWT_SECRET);

        if (!user) {
            return new Response(JSON.stringify({ message: "Unauthorized" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }

        const data = await request.json() as any;
        const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);

        // Basic creation logic (porting from controller)
        let teacherId = data.teacherId;

        // Simplification for migration: assume teacherId is provided or look it up
        if (!teacherId && data.teacherEmail) {
            const { data: teacher } = await supabase
                .from('User')
                .select('id')
                .eq('email', data.teacherEmail)
                .single();
            if (teacher) teacherId = teacher.id;
        }

        if (!teacherId || !user.id) {
            return new Response(JSON.stringify({ message: "A valid teacher and authenticated observer are required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const newObservationData = {
            teacherId: teacherId,
            observerId: user.id,
            date: data.date || new Date().toISOString(),
            domain: data.domain || 'General',
            score: Number(data.score || 0),
            notes: data.notes || data.feedback || '',
            status: 'SUBMITTED',
            actionStep: data.actionStep || '',
            teacherReflection: data.teacherReflection || '',
            discussionMet: !!data.discussionMet,
            hasReflection: !!data.hasReflection,
            createdAt: new Date().toISOString()
        };

        const { data: newObservation, error } = await supabase
            .from('Observation')
            .insert([newObservationData])
            .select()
            .single();

        if (error) throw error;

        return new Response(JSON.stringify({
            status: 'success',
            data: { observation: newObservation }
        }), {
            status: 201,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err: any) {
        return new Response(JSON.stringify({
            status: 'error',
            message: err.message || 'Internal Server Error'
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};
