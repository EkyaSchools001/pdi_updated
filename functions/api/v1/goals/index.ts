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
            .from('Goal')
            .select('*')
            .order('createdAt', { ascending: false });

        // RBAC: Teachers only see their own
        if (user.role === 'TEACHER') {
            query = query.eq('teacherId', user.id);
        }

        const { data: goals, error } = await query;

        if (error) throw error;

        return new Response(JSON.stringify({
            status: 'success',
            results: goals.length,
            data: { goals }
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

        let teacherId = data.teacherId;

        if (user.role !== 'TEACHER' && !teacherId && data.teacherEmail) {
            const { data: targetTeacher } = await supabase
                .from('User')
                .select('id')
                .eq('email', data.teacherEmail)
                .single();
            if (targetTeacher) {
                teacherId = targetTeacher.id;
            } else {
                return new Response(JSON.stringify({ message: "Target teacher not found" }), {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                });
            }
        }

        if (!teacherId) {
            if (user.role === 'TEACHER') {
                teacherId = user.id;
            } else {
                return new Response(JSON.stringify({ message: "A valid teacherId or teacherEmail is required" }), {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                });
            }
        }

        const newGoalData = {
            teacherId: teacherId,
            title: data.title,
            description: data.description || '',
            dueDate: data.dueDate,
            isSchoolAligned: !!data.isSchoolAligned,
            status: 'IN_PROGRESS',
            progress: 0,
            createdAt: new Date().toISOString()
        };

        const { data: newGoal, error } = await supabase
            .from('Goal')
            .insert([newGoalData])
            .select()
            .single();

        if (error) throw error;

        return new Response(JSON.stringify({
            status: 'success',
            data: { goal: newGoal }
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
