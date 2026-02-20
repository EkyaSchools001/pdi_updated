import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const event = await prisma.trainingEvent.findFirst();
    console.log(event ? event.id : 'No event found');
}
main().catch(console.error).finally(() => prisma.$disconnect());
