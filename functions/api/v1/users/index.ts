import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '../../../utils/auth';
import bcrypt from 'bcryptjs';

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

        if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN' && user.role !== 'MANAGEMENT')) {
            return new Response(JSON.stringify({ message: "Forbidden" }), {
                status: 403,
                headers: { "Content-Type": "application/json" },
            });
        }

        const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);

        const { data: users, error } = await supabase
            .from('User')
            .select('id, fullName, email, role, campusId, department, status, createdAt')
            .order('createdAt', { ascending: false });

        if (error) throw error;

        return new Response(JSON.stringify({
            status: 'success',
            results: users.length,
            data: { users }
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

        if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
            return new Response(JSON.stringify({ message: "Forbidden" }), {
                status: 403,
                headers: { "Content-Type": "application/json" },
            });
        }

        const data = await request.json() as any;
        const { fullName, email, role, campusId, department, password } = data;

        const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);

        // Check if user exists
        const { data: existingUser } = await supabase
            .from('User')
            .select('id')
            .eq('email', email)
            .maybeSingle();

        if (existingUser) {
            return new Response(JSON.stringify({ message: "User already exists with this email" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password || 'password123', 12);

        const newUser = {
            fullName,
            email,
            role: role || 'TEACHER',
            campusId,
            department,
            password: hashedPassword,
            status: 'Active',
            createdAt: new Date().toISOString()
        };

        const { data: createdUser, error } = await supabase
            .from('User')
            .insert([newUser])
            .select('id, fullName, email, role, campusId, department, status, createdAt')
            .single();

        if (error) throw error;

        return new Response(JSON.stringify({
            status: 'success',
            data: { user: createdUser }
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
