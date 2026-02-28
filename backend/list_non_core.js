const { PrismaClient } = require('./node_modules/.prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const nonCoreUsers = await prisma.user.findMany({
            where: {
                academics: 'NON_CORE'
            },
            select: {
                fullName: true,
                email: true,
                role: true,
                academics: true
            }
        });
        console.log('NON_CORE_TEACHERS_START');
        console.log(JSON.stringify(nonCoreUsers, null, 2));
        console.log('NON_CORE_TEACHERS_END');
    } catch (error) {
        console.error('Error fetching non-core users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
