const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const assessments = await prisma.assessment.findMany({ include: { questions: true } });
    console.log(JSON.stringify(assessments, null, 2));
    await prisma.$disconnect();
}

main().catch(console.error);
