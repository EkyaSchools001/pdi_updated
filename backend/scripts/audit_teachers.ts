
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const teachers = await prisma.user.findMany({
        where: { role: 'TEACHER' }
    });

    console.log('Teachers Audit:');
    teachers.forEach(t => {
        console.log(`Email: ${t.email}, Name: ${t.fullName}, Campus: ${t.campusId}, Dept: ${t.department}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
