import * as dotenv from 'dotenv';
import path from 'path';

// Load .env from backend directory
dotenv.config({ path: path.join(__dirname, '../.env') });

import prisma from './infrastructure/database/prisma';

async function testFetch() {
    console.log('--- Testing getGrowthObservations Logic ---');

    // Simulate Leader fetching QUICK_FEEDBACK for all teachers
    let filter: any = { moduleType: 'QUICK_FEEDBACK' };

    try {
        const observations = await prisma.growthObservation.findMany({
            where: filter,
            include: {
                teacher: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true
                    }
                },
                observer: {
                    select: {
                        id: true,
                        fullName: true,
                        role: true
                    }
                }
            },
            orderBy: {
                observationDate: 'desc'
            }
        });

        console.log(`✅ Found ${observations.length} observations.`);
        observations.forEach((obs, i) => {
            console.log(`[${i + 1}] Date: ${obs.observationDate.toISOString().split('T')[0]} | Teacher: ${obs.teacher?.fullName} (ID: ${obs.teacher?.id})`);
        });
    } catch (err: any) {
        console.error('❌ Fetch failed:', err.message);
    }
}

testFetch().catch(console.error).finally(() => prisma.$disconnect());
