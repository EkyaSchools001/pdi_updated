import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkConfig() {
    try {
        const config = await prisma.systemSettings.findUnique({
            where: { key: 'access_matrix_config' }
        });

        if (config) {
            console.log('Current Config Found:');
            console.log(JSON.stringify(JSON.parse(config.value), null, 2));
        } else {
            console.log('No access_matrix_config found in database.');
        }
    } catch (e) {
        console.error('Error checking config:', e);
    } finally {
        await prisma.$disconnect();
    }
}

checkConfig();
