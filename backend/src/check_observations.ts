import * as dotenv from 'dotenv';
import path from 'path';

// Load .env from backend directory
dotenv.config({ path: path.join(__dirname, '../.env') });

import prisma from './infrastructure/database/prisma';

async function check() {
    console.log('--- Database Audit ---');

    try {
        const tables: any[] = await prisma.$queryRawUnsafe("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%Observation%'");
        console.log('Observation-related tables:', tables.map(t => t.name).join(', '));
    } catch (err: any) {
        console.log('Error listing tables:', err.message);
    }

    try {
        console.log('\nChecking Observation table...');
        const count = await (prisma as any).observation.count();
        console.log(`✅ Observation table exists. Count: ${count}`);
    } catch (err: any) {
        console.log(`❌ Observation table error: ${err.message.split('\n')[0]}`);
    }

    try {
        console.log('\nChecking GrowthObservation table...');
        const growthObs = await prisma.growthObservation.findMany({
            include: {
                teacher: { select: { fullName: true } },
                observer: { select: { fullName: true } }
            }
        });
        console.log(`✅ GrowthObservation table exists. Count: ${growthObs.length}`);

        const counts: Record<string, number> = {};
        growthObs.forEach(obs => {
            counts[obs.moduleType] = (counts[obs.moduleType] || 0) + 1;
        });
        console.log('Counts by moduleType:', JSON.stringify(counts, null, 2));
    } catch (err: any) {
        console.log(`❌ GrowthObservation table error: ${err.message.split('\n')[0]}`);
    }

    try {
        console.log('\nChecking User table...');
        const userCount = await prisma.user.count();
        console.log(`✅ User table exists. Count: ${userCount}`);
    } catch (err: any) {
        console.log(`❌ User table error: ${err.message.split('\n')[0]}`);
    }
}

check().catch(console.error).finally(() => prisma.$disconnect());
