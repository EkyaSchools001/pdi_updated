import prisma from './src/infrastructure/database/prisma';

async function test() {
    console.log('--- Testing TrainingFeedback ---');
    try {
        console.log('Keys in prisma client:', Object.keys(prisma).filter(k => k.toLowerCase().includes('feedback')));

        // Try the property we used in the controller
        const feedbacks = await (prisma as any).trainingFeedback.findMany();
        console.log('Successfully queried trainingFeedback. Count:', feedbacks.length);

        const events = await prisma.trainingEvent.findMany({
            include: {
                feedbacks: true
            } as any
        });
        console.log('Successfully queried trainingEvent with feedbacks. Count:', events.length);

    } catch (error: any) {
        console.error('Error during test:', error.message);
        if (error.stack) console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

test();
