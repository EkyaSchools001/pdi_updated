const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    try {
        const acks = await prisma.documentAcknowledgement.findMany();
        console.log("Found acks:", acks.length);
        if (acks.length > 0) {
            console.log("First ack:", acks[0]);
            const ackById = await prisma.documentAcknowledgement.findUnique({ where: { id: acks[0].id } });
            console.log("Ack by ID:", ackById ? "FOUND" : "NOT FOUND");
        }
    } catch (err) {
        console.error("PRISMA ERROR:", err);
    } finally {
        await prisma.$disconnect();
    }
}
test();
