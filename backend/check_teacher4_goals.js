const { PrismaClient } = require('./node_modules/.prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const goals = await prisma.goal.findMany({
            where: {
                teacherEmail: 'teacher4.art@pdi.com'
            },
            select: {
                id: true,
                title: true,
                status: true,
                academicType: true,
                category: true
            }
        });
        console.log('TEACHER_FOUR_GOALS_START');
        console.log(JSON.stringify(goals, null, 2));
        console.log('TEACHER_FOUR_GOALS_END');
    } catch (error) {
        console.error('Error fetching goals:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
