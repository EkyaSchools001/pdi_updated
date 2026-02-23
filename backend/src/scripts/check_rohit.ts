import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const rohit = await prisma.user.findFirst({
        where: {
            fullName: {
                contains: 'Rohit'
            }
        }
    });

    if (!rohit) {
        console.log('User Rohit not found');
    } else {
        console.log('User Rohit:', JSON.stringify(rohit, null, 2));

        const events = await prisma.trainingEvent.findMany({
            where: {
                OR: [
                    { createdById: rohit.id },
                    { proposedById: rohit.id }
                ]
            },
            include: {
                registrations: true
            }
        });
        console.log(`Found ${events.length} events created/proposed by Rohit`);
        console.log('Events:', JSON.stringify(events, null, 2));
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
