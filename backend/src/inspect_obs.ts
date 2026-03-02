import { PrismaClient } from '@prisma/client';
import path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
    const obsId = 'bec3ca86-a505-4187-9297-416d73969dad';
    const observation = await prisma.growthObservation.findUnique({
        where: { id: obsId },
        include: {
            teacher: true,
            observer: true
        }
    });

    if (!observation) {
        console.log('Observation not found');
        return;
    }

    console.log('--- Observation Data ---');
    console.log(JSON.stringify(observation, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
