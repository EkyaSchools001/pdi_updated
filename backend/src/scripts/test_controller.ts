import { getTrainingEvent } from '../api/controllers/trainingController';
import { AuthRequest } from '../api/middlewares/auth';
import { Response } from 'express';

async function test() {
    const req = {
        params: { id: 'ce543f50-08e5-41f3-8b94-db18118965c1' }
    } as unknown as AuthRequest;

    const res = {
        status: (code: number) => {
            console.log('Status:', code);
            return res;
        },
        json: (data: any) => {
            console.log('JSON:', JSON.stringify(data, null, 2));
            return res;
        }
    } as unknown as Response;

    try {
        await getTrainingEvent(req, res);
    } catch (error) {
        console.error('Caught Error:', error);
    }
}

test();
