import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Classifying teachers as Core or Non-Core...');

    const coreDepartments = ['Mathematics', 'Science', 'English', 'Social Studies'];
    const nonCoreDepartments = ['Arts', 'Physical Education', 'Visual Arts', 'Music'];

    const teachers = await prisma.user.findMany({
        where: { role: 'TEACHER' }
    });

    for (const teacher of teachers) {
        let academicType: 'CORE' | 'NON_CORE' = 'NON_CORE';

        if (teacher.department && coreDepartments.some(dept => teacher.department?.includes(dept))) {
            academicType = 'CORE';
        }

        await prisma.user.update({
            where: { id: teacher.id },
            data: { academics: academicType }
        });

        console.log(`Updated ${teacher.fullName} (${teacher.department}) -> ${academicType}`);
    }

    console.log('Auto-classification complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
