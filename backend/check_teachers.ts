
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTeachers() {
    const teachers = await prisma.user.findMany({
        where: { role: 'TEACHER' },
        select: {
            id: true,
            fullName: true,
            email: true,
            campusId: true,
            department: true
        }
    });

    console.log('Current Teachers Data:');
    console.table(teachers);
}

checkTeachers()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
