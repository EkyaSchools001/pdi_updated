
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const emailsToDelete = ['indu.management@pdi.com', 'bharath.superadmin@pdi.com'];

        const result = await prisma.user.deleteMany({
            where: {
                email: {
                    in: emailsToDelete
                }
            }
        });

        console.log(`Deleted ${result.count} users.`);

        // Verify
        const remaining = await prisma.user.findMany({
            where: {
                email: {
                    in: emailsToDelete
                }
            }
        });

        if (remaining.length === 0) {
            console.log('Verification successful: Users removed.');
        } else {
            console.log('Warning: Some users still exist:', remaining);
        }

    } catch (error) {
        console.error('Error deleting users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
