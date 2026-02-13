import { jwtVerify } from 'jose';

export async function verifyToken(token: string, secret: string) {
    try {
        const encodedSecret = new TextEncoder().encode(secret || 'secret');
        const { payload } = await jwtVerify(token, encodedSecret);
        return payload as { id: string; role: string };
    } catch (err) {
        return null;
    }
}
