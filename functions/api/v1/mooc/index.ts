
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
            return new Response(JSON.stringify({ message: "Forbidden" }), {
                status: 403,
                headers: { "Content-Type": "application/json" },
            });
        }

        const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);

        let query = supabase
            .from('MoocSubmission')
            .select(`
                *,
                User (
                    fullName,
                    email,
                    campusId
                )
            `)
            .order('submittedAt', { ascending: false });

        // If user is a teacher, only show their submissions
        if (user.role === 'TEACHER') {
            query = query.eq('userId', user.id);
        }

        const { data: submissions, error } = await query;

        if (error) throw error;

        const mappedSubmissions = (submissions || []).map((sub: any) => ({
            ...sub,
            name: sub.teacherName || sub.User?.fullName || 'Unknown',
            email: sub.teacherEmail || sub.User?.email || '',
            campus: sub.User?.campusId || 'Unknown',
            completionDate: sub.endDate || sub.submittedAt
        }));

        return new Response(JSON.stringify({
            status: 'success',
            data: { submissions: mappedSubmissions }
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
