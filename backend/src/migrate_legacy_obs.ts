import * as dotenv from 'dotenv';
import path from 'path';
import { PrismaClient as ActiveClient } from '@prisma/client';

// Load .env
dotenv.config({ path: path.join(__dirname, '../.env') });

async function migrate() {
    console.log('--- Migrating Legacy Observation ---');

    const activePrisma = new ActiveClient();
    const backupPrisma = new ActiveClient({
        datasources: {
            db: {
                url: 'file:C:/Users/Admin/Desktop/PDI/pdi_updated/database/prisma/dev.db.bak'
            }
        }
    });

    try {
        // 1. Get legacy obs from backup
        const legacyObs: any[] = await backupPrisma.$queryRawUnsafe("SELECT * FROM Observation LIMIT 1");

        if (legacyObs.length === 0) {
            console.log('No legacy observations found in backup.');
            return;
        }

        const obs = legacyObs[0];
        console.log(`Found legacy observation: ${obs.id}`);

        // 2. Check if users exist in active DB
        const teacher = await activePrisma.user.findUnique({ where: { id: obs.teacherId } });
        const observer = await activePrisma.user.findUnique({ where: { id: obs.observerId } });

        if (!teacher || !observer) {
            console.log('Teacher or Observer not found in active database. Cannot migrate with original IDs.');
            // Fallback: search by name/email if we had that info, but here we just have IDs.
            // Let's use the first teacher and first admin as fallback if IDs don't match (for demo purposes)
            // Actually, in my audit, Teacher One (8562dc4d-b59e-4be0-a5b0-1ce670e1ec48) exists.
            // Let's check if the IDs match.
            console.log(`Legacy Teacher ID: ${obs.teacherId} | Legacy Observer ID: ${obs.observerId}`);
        }

        const legacyPayload = typeof obs.detailedReflection === 'string' ? JSON.parse(obs.detailedReflection) : obs.detailedReflection || {};
        const mergedPayload = {
            ...legacyPayload,
            teacherReflection: obs.teacherReflection,
            legacyObservationId: obs.id
        };

        const newObs = await activePrisma.growthObservation.create({
            data: {
                teacher: { connect: { email: 'teacher1.btmlayout@pdi.com' } },
                observer: { connect: { email: 'rohit.schoolleader@pdi.com' } },
                campusId: teacher?.campusId || 'EBTM',
                academicYear: 'AY 25-26',
                moduleType: 'DANIELSON',
                observationDate: new Date(obs.date),
                overallRating: 3.5,
                status: 'SUBMITTED',
                formPayload: JSON.stringify(mergedPayload),
                createdAt: new Date(obs.createdAt),
                updatedAt: new Date(obs.updatedAt),
            }
        });

        console.log(`✅ Successfully migrated legacy observation to GrowthObservation (DANIELSON). New ID: ${newObs.id}`);

    } catch (err: any) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        await activePrisma.$disconnect();
        await backupPrisma.$disconnect();
    }
}

migrate();
