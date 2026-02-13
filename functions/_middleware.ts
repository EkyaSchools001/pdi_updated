interface Env {
    DATABASE_URL: string;
    JWT_SECRET: string;
}

export const onRequest: PagesFunction<Env> = async ({ request, next, env }) => {
    // Handle CORS Preflight
    if (request.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization, Bypass-Tunnel-Reminder",
                "Access-Control-Max-Age": "86400",
            },
        });
    }

    try {
        const response = await next();

        // Clone the response to add CORS headers
        const newResponse = new Response(response.body, response);
        newResponse.headers.set("Access-Control-Allow-Origin", "*");
        newResponse.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
        newResponse.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, Bypass-Tunnel-Reminder");

        return newResponse;
    } catch (err: any) {
        return new Response(JSON.stringify({
            status: 'error',
            message: err.message || 'Internal Server Error',
            stack: env.NODE_ENV === 'development' ? err.stack : undefined
        }), {
            status: err.statusCode || 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        });
    }
};
