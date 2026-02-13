import { createClient } from '@supabase/supabase-js';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';

interface Env {
    DATABASE_URL: string;
    JWT_SECRET: string;
    VITE_SUPABASE_URL: string;
    VITE_SUPABASE_PUBLISHABLE_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
    try {
        const body = await request.json() as any;
        const { email, password } = body;

        if (!email || !password) {
            return new Response(JSON.stringify({
                status: 'fail',
                message: "Invalid input data"
            }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Initialize Supabase client
        // Note: In Cloudflare Functions, these might be in env
        const supabaseUrl = env.VITE_SUPABASE_URL;
        // Use Service Role Key if available (bypasses RLS), otherwise fall back to Anon key
        const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            throw new Error("Supabase configuration missing in environment");
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1) Find user
        // Prisma model User maps to table User in Supabase
        const { data: user, error } = await supabase
            .from('User')
            .select('*')
            .eq('email', email)
            .single();

        if (error) {
            // PGRST116: JSON object requested, but no rows returned
            if (error.code === 'PGRST116') {
                return new Response(JSON.stringify({
                    status: 'fail',
                    message: "User not found"
                }), {
                    status: 401,
                    headers: { "Content-Type": "application/json" },
                });
            }

            return new Response(JSON.stringify({
                status: 'fail',
                message: "Login query error",
                debug: {
                    error: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                }
            }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }

        if (!user) {
            return new Response(JSON.stringify({
                status: 'fail',
                message: "User not found"
            }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }

        // 2) Verify password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return new Response(JSON.stringify({
                status: 'fail',
                message: "Incorrect email or password"
            }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }

        // 3) Sign token using jose
        const secret = new TextEncoder().encode(env.JWT_SECRET || 'secret');
        const token = await new SignJWT({ id: user.id, role: user.role })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime(env.JWT_EXPIRES_IN || '1d')
            .sign(secret);

        return new Response(JSON.stringify({
            status: 'success',
            token,
            data: {
                user: {
                    id: user.id,
                    fullName: user.fullName,
                    email: user.email,
                    role: user.role,
                },
            },
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
