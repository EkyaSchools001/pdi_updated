
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const depts = await prisma.user.findMany({
        select: { department: true },
        distinct: ['department']
    });
    console.log('Unique Departments:', JSON.stringify(depts, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
