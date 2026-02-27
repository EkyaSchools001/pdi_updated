import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    const assessmentId = 'd2b51dcd-f2d0-4bd5-bcc5-8d8c3ca24382';

    const assessment = await prisma.assessment.findUnique({
        where: { id: assessmentId },
        include: { questions: true }
    });

    if (!assessment) {
        console.log('Assessment NOT FOUND:', assessmentId);
        const allAssessments = await prisma.assessment.findMany({ select: { id: true, title: true } });
        console.log('Available Assessments:', JSON.stringify(allAssessments, null, 2));
        return;
    }

    console.log('Assessment FOUND:', assessment.title);
    console.log('Max Attempts:', assessment.maxAttempts);

    // Check if any user has reached max attempts
    const attempts = await prisma.assessmentAttempt.findMany({
        where: { assessmentId: assessmentId }
    });
    console.log('Current Attempts:', JSON.stringify(attempts, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
