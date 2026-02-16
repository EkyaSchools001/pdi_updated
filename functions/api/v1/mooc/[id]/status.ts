
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '../../../../utils/auth';

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

        if (!user || (user.role !== 'LEADER' && user.role !== 'SCHOOL_LEADER' && user.role !== 'ADMIN' && user.role !== 'MANAGEMENT' && user.role !== 'SUPERADMIN')) {
            return new Response(JSON.stringify({ message: "Forbidden" }), {
                status: 403,
                headers: { "Content-Type": "application/json" },
            });
        }

        const data = await request.json() as any;
        const { status } = data;

        if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
            return new Response(JSON.stringify({ message: "Invalid status" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);

        const { data: submission, error } = await supabase
            .from('MoocSubmission')
            .update({ status, updatedAt: new Date().toISOString() })
            .eq('id', id)
            .select(`
                *,
                User (
                    fullName,
                    email
                )
            `)
            .single();

        if (error) throw error;

        return new Response(JSON.stringify({
            status: 'success',
            data: { submission }
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
