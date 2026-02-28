const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const hash = await bcrypt.hash('teacher123', 10);

    // Check if PE teacher already exists
    const existing = await prisma.user.findUnique({ where: { email: 'teacher5.pe@pdi.com' } });
    if (existing) {
        console.log('PE teacher already exists:', existing.email, '| ID:', existing.id);
        return;
    }

    const teacher = await prisma.user.create({
        data: {
            fullName: 'Teacher Five',
            email: 'teacher5.pe@pdi.com',
            passwordHash: hash,
            role: 'TEACHER',
            academics: 'NON_CORE',
            status: 'Active',
        }
    });

    console.log('Created PE teacher:', teacher.email, '| ID:', teacher.id);
}

main().catch(console.error).finally(() => prisma.$disconnect());
