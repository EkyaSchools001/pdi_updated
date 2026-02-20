
import prisma from '../infrastructure/database/prisma';

async function main() {
    const titles = ["Effective Questioning", "pdi"]; // Add other titles if known
    console.log(`Checking for duplicates of: ${titles.join(", ")}`);

    const events = await prisma.trainingEvent.findMany({
        where: {
            OR: titles.map(t => ({ title: { contains: t } }))
        },
        select: { id: true, title: true, createdById: true, status: true, attendanceEnabled: true }
    });

    const attendance = await prisma.eventAttendance.findMany({
        where: {
            eventId: { in: events.map(e => e.id) }
        }
    });

    for (const e of events) {
        const count = attendance.filter(a => a.eventId === e.id).length;
        console.log(`Event: "${e.title}"`);
        console.log(`  ID: ${e.id}`);
        console.log(`  CreatedBy: ${e.createdById}`);
        console.log(`  Status: ${e.status}, Enabled: ${e.attendanceEnabled}`);
        console.log(`  Attendance Count: ${count}`);
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
