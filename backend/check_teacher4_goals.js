
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const teacher = await prisma.user.findFirst({
        where: { fullName: { contains: 'Four' } },
        select: {
            id: true,
            email: true,
            fullName: true,
            academics: true,
            department: true
        }
    });

    console.log('Teacher Details:', JSON.stringify(teacher, null, 2));

    if (teacher) {
        const goals = await prisma.goal.findMany({
            where: { teacherId: teacher.id },
            select: {
                id: true,
                title: true,
                category: true,
                academicType: true,
                status: true
            }
        });
        console.log('Teacher Goals:', JSON.stringify(goals, null, 2));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
