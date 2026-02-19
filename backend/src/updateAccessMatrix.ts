import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateConfig() {
    try {
        const config = await prisma.systemSettings.findUnique({
            where: { key: 'access_matrix_config' }
        });

        if (config) {
            const value = JSON.parse(config.value);
            const matrix = value.accessMatrix;

            // Check if meetings already exists
            const exists = matrix.find((m: any) => m.moduleId === 'meetings');

            if (!exists) {
                console.log('Adding "meetings" module to access matrix...');
                matrix.push({
                    moduleId: 'meetings',
                    moduleName: 'Meetings',
                    roles: {
                        SUPERADMIN: true,
                        ADMIN: true,
                        LEADER: true,
                        MANAGEMENT: true,
                        TEACHER: true
                    }
                });

                await prisma.systemSettings.update({
                    where: { key: 'access_matrix_config' },
                    data: { value: JSON.stringify(value) }
                });
                console.log('Database updated successfully.');
            } else {
                console.log('"meetings" module already exists in database config.');

                // Ensure all roles are true just in case
                exists.roles = {
                    SUPERADMIN: true,
                    ADMIN: true,
                    LEADER: true,
                    MANAGEMENT: true,
                    TEACHER: true
                };

                await prisma.systemSettings.update({
                    where: { key: 'access_matrix_config' },
                    data: { value: JSON.stringify(value) }
                });
                console.log('Database updated (roles ensured).');
            }
        } else {
            console.log('No access_matrix_config found. You may need to run seed.');
        }
    } catch (e) {
        console.error('Error updating config:', e);
    } finally {
        await prisma.$disconnect();
    }
}

updateConfig();
