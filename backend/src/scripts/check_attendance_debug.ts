
import prisma from '../infrastructure/database/prisma';

async function main() {
    console.log('--- Checking Training Events ---');
    const events = await prisma.trainingEvent.findMany({
        select: {
            id: true,
            title: true,
            attendanceEnabled: true,
            attendanceClosed: true,
            createdById: true
        }
    });
    console.log(JSON.stringify(events, null, 2));

    console.log('\n--- Checking Attendance Records ---');
    const attendance = await prisma.eventAttendance.findMany({
        select: {
            id: true,
            eventId: true,
            teacherName: true,
            teacherEmail: true,
            status: true
        }
    });
    console.log(JSON.stringify(attendance, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
