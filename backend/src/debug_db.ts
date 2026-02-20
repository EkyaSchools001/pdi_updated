import prisma from './infrastructure/database/prisma';

import * as fs from 'fs';

async function main() {
    const events = await prisma.trainingEvent.findMany({
        select: { id: true, title: true, status: true }
    });
    const users = await prisma.user.findMany({
        select: { id: true, fullName: true, role: true, email: true }
    });

    const results = {
        events,
        users
    };

    fs.writeFileSync('debug_results.json', JSON.stringify(results, null, 2));
    console.log('Results written to debug_results.json');
}

main().catch(console.error).finally(() => prisma.$disconnect());
