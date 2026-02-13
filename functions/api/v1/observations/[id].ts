import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '../../../utils/auth';

interface Env {
    DATABASE_URL: string;
    JWT_SECRET: string;
    VITE_SUPABASE_URL: string;
    VITE_SUPABASE_PUBLISHABLE_KEY: string;
}

export const onRequestPatch: PagesFunction<Env> = async ({ request, env, params }) => {
    try {
        const { id } = params;
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

        const updateData: any = {
            updatedAt: new Date().toISOString()
        };

        if (data.teacherReflection !== undefined) updateData.teacherReflection = String(data.teacherReflection);
        if (data.detailedReflection !== undefined) updateData.detailedReflection = data.detailedReflection;
        if (data.hasReflection !== undefined) updateData.hasReflection = !!data.hasReflection;
        if (data.notes !== undefined) updateData.notes = String(data.notes);
        if (data.actionStep !== undefined) updateData.actionStep = String(data.actionStep);
        if (data.discussionMet !== undefined) updateData.discussionMet = !!data.discussionMet;
        if (data.score !== undefined) updateData.score = Number(data.score);
        if (data.domain !== undefined) updateData.domain = String(data.domain);

        if (data.status) {
            const statusMap: Record<string, string> = {
                'Submitted': 'SUBMITTED',
                'submitted': 'SUBMITTED',
                'Draft': 'DRAFT',
                'draft': 'DRAFT',
                'Reviewed': 'REVIEWED',
                'reviewed': 'REVIEWED'
            };
            updateData.status = (statusMap[data.status] || data.status.toUpperCase());
        }

        const { data: updatedObservation, error } = await supabase
            .from('Observation')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return new Response(JSON.stringify({
            status: 'success',
            data: { observation: updatedObservation }
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
