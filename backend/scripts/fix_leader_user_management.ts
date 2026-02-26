import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * This script reads the current access matrix from the DB,
 * forces LEADER=true on the 'users' module, and writes it back.
 * It also calls invalidateAccessMatrixCache() equivalent by
 * directly rewriting the value.
 */
async function fix() {
    const config = await prisma.systemSettings.findUnique({
        where: { key: 'access_matrix_config' }
    });

    if (!config) {
        console.log('No config found in DB!');
        await prisma.$disconnect();
        return;
    }

    const value = JSON.parse(config.value);
    const matrix: any[] = value.accessMatrix || [];

    let changed = false;

    // Fix 'users' module LEADER permission
    for (const m of matrix) {
        if (m.moduleId === 'users') {
            console.log(`BEFORE users module: ${JSON.stringify(m.roles)}`);
            if (m.roles.LEADER !== true) {
                m.roles.LEADER = true;
                changed = true;
            } else {
                console.log('LEADER is already true — no change needed.');
            }
            console.log(`AFTER  users module: ${JSON.stringify(m.roles)}`);
        }
    }

    // Write it back
    await prisma.systemSettings.update({
        where: { key: 'access_matrix_config' },
        data: { value: JSON.stringify(value) }
    });

    console.log(changed ? '✅ DB updated.' : '✅ DB confirmed correct (no change needed).');

    // Verify
    const check = await prisma.systemSettings.findUnique({ where: { key: 'access_matrix_config' } });
    const checkVal = JSON.parse(check!.value);
    const usersCheck = checkVal.accessMatrix.find((m: any) => m.moduleId === 'users');
    console.log('VERIFICATION - users module in DB:', JSON.stringify(usersCheck?.roles));

    await prisma.$disconnect();
}

fix().catch(console.error);
