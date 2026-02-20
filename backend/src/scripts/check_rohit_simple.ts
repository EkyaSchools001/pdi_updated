import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const rohit = await prisma.user.findFirst({
        where: { fullName: { contains: 'Rohit' } }
    });

    if (rohit) {
        console.log(`Rohit ID: ${rohit.id}`);
        console.log(`Rohit Role: ${rohit.role}`);

        const count = await prisma.trainingEvent.count({
            where: {
                OR: [
                    { createdById: rohit.id },
                    { proposedById: rohit.id }
                ]
            }
        });
        console.log(`Events created/proposed by Rohit: ${count}`);

        const allCount = await prisma.trainingEvent.count();
        console.log(`Total training events in DB: ${allCount}`);
    } else {
        console.log('Rohit not found');
    }
}

main().finally(() => prisma.$disconnect());
