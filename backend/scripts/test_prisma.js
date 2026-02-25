const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    try {
        const ackId = '0d8e8749-92c1-4176-b6ac-a63602025e6e';
        const ack = await prisma.documentAcknowledgement.findUnique({
            where: { id: ackId }
        });
        console.log("Found ack:", ack);

        const updatedAck = await prisma.documentAcknowledgement.update({
            where: { id: ackId },
            data: {
                status: 'VIEWED',
                viewedAt: new Date()
            }
        });
        console.log("Updated ack:", updatedAck);
    } catch (err) {
        console.error("PRISMA ERROR:", err);
    } finally {
        await prisma.$disconnect();
    }
}
test();
