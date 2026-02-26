import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    const config = await prisma.systemSettings.findUnique({ where: { key: 'access_matrix_config' } });
    if (!config) { console.log('No config found'); return; }
    const value = JSON.parse(config.value);
    const usersModule = value.accessMatrix.find((m: any) => m.moduleId === 'users');
    console.log('USERS MODULE IN DB:');
    console.log(JSON.stringify(usersModule, null, 2));
    console.log('\nFull access matrix:');
    value.accessMatrix.forEach((m: any) => {
        console.log(`  ${m.moduleId}: LEADER=${m.roles.LEADER}, SCHOOL_LEADER=${m.roles.SCHOOL_LEADER}`);
    });
    await prisma.$disconnect();
}

check().catch(console.error);
