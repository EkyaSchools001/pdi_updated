
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '../../../utils/auth';

interface Env {
    DATABASE_URL: string;
    JWT_SECRET: string;
    VITE_SUPABASE_URL: string;
    VITE_SUPABASE_PUBLISHABLE_KEY: string;
}

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
            return new Response(JSON.stringify({ message: "Forbidden" }), {
                status: 403,
                headers: { "Content-Type": "application/json" },
            });
        }

        const data = await request.json() as any;
        const {
            courseName,
            platform,
            otherPlatform,
            hours,
            startDate,
            endDate,
            hasCertificate,
            certificateType,
            proofLink,
            certificateFile,
            certificateFileName,
            keyTakeaways,
            unansweredQuestions,
            enjoyedMost,
            effectivenessRating,
            additionalFeedback,
            name,
            email
        } = data;

        const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);

        const newSubmission = {
            userId: user.id,
            courseName,
            platform,
            otherPlatform,
            hours: parseFloat(hours),
            startDate: new Date(startDate).toISOString(),
            endDate: new Date(endDate).toISOString(),
            hasCertificate,
            certificateType,
            proofLink,
            certificateFile,
            certificateFileName,
            keyTakeaways,
            unansweredQuestions,
            enjoyedMost,
            effectivenessRating: Array.isArray(effectivenessRating) ? effectivenessRating[0] : effectivenessRating,
            additionalFeedback,
            teacherName: name,
            teacherEmail: email,
            status: 'PENDING',
            submittedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const { data: submission, error } = await supabase
            .from('MoocSubmission')
            .insert([newSubmission])
            .select('*')
            .single();

        if (error) throw error;

        return new Response(JSON.stringify({
            status: 'success',
            data: { submission }
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
