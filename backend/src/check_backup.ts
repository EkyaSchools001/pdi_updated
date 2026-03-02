import * as dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';

async function check() {
    const backupDbPath = "file:C:\\Users\\Admin\\Desktop\\PDI\\pdi_updated\\database\\prisma\\dev.db.bak";
    const prisma = new PrismaClient({
        datasources: {
            db: { url: backupDbPath }
        }
    });

    console.log('--- Backup Database Audit (dev.db.bak) ---');

    try {
        const tables = await prisma.$queryRawUnsafe("SELECT name FROM sqlite_master WHERE type='table'");
        console.log('Tables in backup:', JSON.stringify(tables, null, 2));
    } catch (err: any) {
        console.log('Error listing tables:', err.message);
    }

    try {
        console.log('\nChecking Observation table (Raw Query)...');
        const obs = await prisma.$queryRawUnsafe("SELECT * FROM Observation");
        console.log(`✅ Observation table exists in backup. Count: ${(obs as any).length}`);
        console.log('Observation Data:', JSON.stringify(obs, null, 2));
    } catch (err: any) {
        console.log(`❌ Observation table error in backup:`, err);
    }

    try {
        console.log('\nChecking GrowthObservation table...');
        const count = await (prisma as any).growthObservation.count();
        console.log(`✅ GrowthObservation table exists in backup. Count: ${count}`);
    } catch (err: any) {
        console.log(`❌ GrowthObservation table error in backup: ${err.message.split('\n')[0]}`);
    }

    await prisma.$disconnect();
}

check().catch(console.error);
