import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function cleanup() {
    const assessmentId = 'd2b51dcd-f2d0-4bd5-bcc5-8d8c3ca24382';
    const userId = 'cb6cce0d-0fa3-467a-af7d-ffab7ae732a9';

    // Delete all but the first attempt for this user/assessment to reset
    const attempts = await prisma.assessmentAttempt.findMany({
        where: { assessmentId, userId },
        orderBy: { createdAt: 'asc' }
    });

    if (attempts.length > 1) {
        const toDelete = attempts.slice(1).map(a => a.id);
        await prisma.assessmentAttempt.deleteMany({
            where: { id: { in: toDelete } }
        });
        console.log(`Deleted ${toDelete.length} duplicate attempts.`);
    } else {
        console.log('No duplicate attempts found.');
    }
}

cleanup().catch(console.error).finally(() => prisma.$disconnect());
