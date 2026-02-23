import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const user = await prisma.user.findFirst({ where: { fullName: { contains: 'Rohit' } } });
    if (user) console.log(`ROLE_FOR_ROHIT: ${user.role}`);
    else console.log('USER_NOT_FOUND');
}
main().finally(() => prisma.$disconnect());
