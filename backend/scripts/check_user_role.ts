import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    // Check Rohit's role
    const rohit = await prisma.user.findFirst({
        where: { fullName: { contains: 'Rohit' } },
        select: { id: true, fullName: true, role: true, email: true }
    });
    console.log('ROHIT USER:', JSON.stringify(rohit, null, 2));

    // Check all users with SCHOOL_LEADER or LEADER role
    const leaders = await prisma.user.findMany({
        where: { role: { in: ['SCHOOL_LEADER', 'LEADER'] } },
        select: { fullName: true, role: true, email: true }
    });
    console.log('\nALL LEADERS:', JSON.stringify(leaders, null, 2));

    await prisma.$disconnect();
}

check().catch(console.error);
