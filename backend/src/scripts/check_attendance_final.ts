
import prisma from '../infrastructure/database/prisma';

async function main() {
    const events = await prisma.trainingEvent.findMany({
        select: { id: true, title: true, createdById: true }
    });

    const attendance = await prisma.eventAttendance.findMany({
        select: { eventId: true }
    });

    console.log(`Total Events: ${events.length}`);
    console.log(`Total Attendance Records: ${attendance.length}`);

    // Group events by title
    const eventsByTitle: Record<string, typeof events> = {};
    for (const e of events) {
        if (!eventsByTitle[e.title]) eventsByTitle[e.title] = [];
        eventsByTitle[e.title].push(e);
    }

    console.log('\n--- Duplicate Check ---');
    let duplicatesFound = false;
    for (const title in eventsByTitle) {
        if (eventsByTitle[title].length > 1) {
            duplicatesFound = true;
            console.log(`Duplicate Title: "${title}"`);
            for (const e of eventsByTitle[title]) {
                const count = attendance.filter(a => a.eventId === e.id).length;
                console.log(`  ID: ${e.id} | CreatedBy: ${e.createdById} | Attendance: ${count}`);
            }
        }
    }
    if (!duplicatesFound) console.log("No duplicate event titles found.");

    console.log('\n--- Events with Attendance ---');
    for (const e of events) {
        const count = attendance.filter(a => a.eventId === e.id).length;
        if (count > 0) {
            console.log(`Event: "${e.title}" (${e.id}) - Attendance: ${count}`);
        }
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
