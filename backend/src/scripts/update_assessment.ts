import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateAssessmentType() {
    try {
        const result = await prisma.assessment.updateMany({
            where: {
                title: 'Ekya Professional Standards & Pedagogy',
            },
            data: {
                type: 'POST_ORIENTATION',
            },
        });
        console.log(`Updated ${result.count} assessments to POST_ORIENTATION.`);
    } catch (e) {
        console.error('Error updating assessment type:', e);
    } finally {
        await prisma.$disconnect();
    }
}

updateAssessmentType();
