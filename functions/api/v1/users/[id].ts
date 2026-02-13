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

        if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN' && user.role !== 'MANAGEMENT')) {
            return new Response(JSON.stringify({ message: "Forbidden" }), {
                status: 403,
                headers: { "Content-Type": "application/json" },
            });
        }

        const data = await request.json() as any;
        const { fullName, role, campusId, department, status } = data;

        const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);

        const updateData: any = {};
        if (fullName !== undefined) updateData.fullName = fullName;
        if (role !== undefined) updateData.role = role;
        if (campusId !== undefined) updateData.campusId = campusId;
        if (department !== undefined) updateData.department = department;
        if (status !== undefined) updateData.status = status;

        const { data: updatedUser, error } = await supabase
            .from('User')
            .update(updateData)
            .eq('id', id)
            .select('id, fullName, email, role, campusId, department, status, createdAt')
            .single();

        if (error) throw error;

        return new Response(JSON.stringify({
            status: 'success',
            data: { user: updatedUser }
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

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
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

        if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
            return new Response(JSON.stringify({ message: "Forbidden" }), {
                status: 403,
                headers: { "Content-Type": "application/json" },
            });
        }

        const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);

        const { error } = await supabase
            .from('User')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return new Response(JSON.stringify({
            status: 'success',
            data: null
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
