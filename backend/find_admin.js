const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    console.log(user ? user.id : 'null');
    await prisma.$disconnect();
}

main().catch(console.error);
