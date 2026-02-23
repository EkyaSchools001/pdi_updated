import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Training Events ---');
    const events = await prisma.trainingEvent.findMany({
        include: {
            registrations: true
        }
    });
    console.log(JSON.stringify(events, null, 2));

    console.log('\n--- Users ---');
    const users = await prisma.user.findMany({
        select: {
            id: true,
            fullName: true,
            email: true,
            role: true
        }
    });
    console.log(JSON.stringify(users, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
