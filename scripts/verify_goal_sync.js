const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyGoalSync() {
    console.log('--- Verifying Goal Sync ---');

    const leaderEmail = 'rohit.schoolleader@pdi.com';
    const teacherEmail = 'teacher1.btmlayout@pdi.com';

    // 1. Find the leader and teacher
    const leader = await prisma.user.findUnique({ where: { email: leaderEmail } });
    const teacher = await prisma.user.findUnique({ where: { email: teacherEmail } });

    if (!leader || !teacher) {
        console.error('Leader or Teacher not found in DB!');
        return;
    }

    console.log(`Found Leader: ${leader.fullName} (${leader.id})`);
    console.log(`Found Teacher: ${teacher.fullName} (${teacher.id})`);

    // 2. Create a goal as if assigned by leader (simulating controller logic)
    const goalTitle = `Sync Test Goal ${new Date().getTime()}`;
    console.log(`Creating goal: ${goalTitle}`);

    const newGoal = await prisma.goal.create({
        data: {
            title: goalTitle,
            description: 'Test description',
            dueDate: '2026-06-30',
            teacherId: teacher.id, // Correctly linking to teacher
            isSchoolAligned: true,
            category: 'Instruction'
        }
    });

    console.log(`Goal created with ID: ${newGoal.id}, teacherId: ${newGoal.teacherId}`);

    // 3. Verify teacher can see it
    const teacherGoals = await prisma.goal.findMany({
        where: { teacherId: teacher.id }
    });

    const found = teacherGoals.find(g => g.id === newGoal.id);
    if (found) {
        console.log('SUCCESS: Goal is visible to the teacher!');
    } else {
        console.error('FAILURE: Goal is NOT visible to the teacher!');
    }

    // 4. Check for "orphaned" goals assigned to leaders
    const leaderGoals = await prisma.goal.findMany({
        where: { teacherId: leader.id }
    });

    if (leaderGoals.length > 0) {
        console.log(`WARNING: Found ${leaderGoals.length} goals assigned to the leader instead of teachers. This confirms the previous bug.`);
        leaderGoals.forEach(g => console.log(` - ${g.title}`));
    }

    await prisma.$disconnect();
}

verifyGoalSync().catch(console.error);
