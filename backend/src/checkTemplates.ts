
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkTemplates() {
    console.log('--- FORM TEMPLATES CHECK ---');
    try {
        const templates = await prisma.formTemplate.findMany();
        console.log(`Total Templates: ${templates.length}`);
        console.log(JSON.stringify(templates, null, 2));
    } catch (error: any) {
        console.error('❌ Error checking templates:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkTemplates();
