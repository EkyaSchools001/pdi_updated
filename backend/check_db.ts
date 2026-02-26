
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const count = await prisma.formTemplate.count();
    console.log('Total FormTemplates:', count);
    const templates = await prisma.formTemplate.findMany({
        select: { id: true, name: true, type: true }
    });
    console.log('Templates:', JSON.stringify(templates, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
