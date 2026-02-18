
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkUsers() {
    const avani = await prisma.user.findFirst({
        where: { fullName: 'Avani' },
        select: { role: true }
    });
    if (avani) {
        console.log(`Role: '${avani.role}'`);
        const codes = [...avani.role].map(c => c.charCodeAt(0));
        console.log(`Codes: ${codes.join(', ')}`);
    }
    await prisma.$disconnect();
}

checkUsers().catch(console.error);
