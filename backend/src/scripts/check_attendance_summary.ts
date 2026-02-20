
import prisma from '../infrastructure/database/prisma';

async function main() {
    const events = await prisma.trainingEvent.findMany({
        select: { id: true, title: true, createdById: true }
    });

    const attendance = await prisma.eventAttendance.findMany({
        select: { eventId: true }
    });

    console.log('--- Event Summary (All) ---');
    // Sort by title to easily spot duplicates
    events.sort((a, b) => a.title.localeCompare(b.title));

    for (const e of events) {
        const count = attendance.filter(a => a.eventId === e.id).length;
        console.log(`Event: "${e.title}"`);
        console.log(`  ID: ${e.id}`);
        console.log(`  CreatedBy: ${e.createdById}`);
        console.log(`  Attendance: ${count}`);
        console.log('-----------------------------------');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
