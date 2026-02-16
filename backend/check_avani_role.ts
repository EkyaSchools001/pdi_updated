
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findUnique({
        where: { email: 'avani.admin@pdi.com' }
    });

    if (user) {
        console.log(`User: ${user.fullName}`);
        console.log(`Role: '${user.role}'`);
        console.log(`Char Codes: ${[...user.role].map(c => c.charCodeAt(0)).join(',')}`);
    } else {
        console.log('User not found');
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
