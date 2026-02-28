const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
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
    console.log(JSON.stringify(nonCoreUsers, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
