import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function migrate() {
    const mapping: Record<string, string> = {
        'BTM Layout': 'EBTM',
        'JP Nagar': 'EJPN',
        'ITPL': 'EITPL'
    };

    console.log('Starting migration...');

    for (const [oldVal, newVal] of Object.entries(mapping)) {
        // 1. Update Users
        const users = await prisma.user.updateMany({
            where: { campusId: oldVal },
            data: { campusId: newVal }
        });
        console.log(`Updated ${users.count} users from ${oldVal} to ${newVal}`);

        // 2. Update Observations
        const observations = await prisma.observation.updateMany({
            where: { campus: oldVal },
            data: { campus: newVal }
        });
        console.log(`Updated ${observations.count} observations from ${oldVal} to ${newVal}`);

        // 3. Update Meetings
        const meetings = await prisma.meeting.updateMany({
            where: { campusId: oldVal },
            data: { campusId: newVal }
        });
        console.log(`Updated ${meetings.count} meetings from ${oldVal} to ${newVal}`);

        // 4. Update Event Attendance
        const attendance = await prisma.eventAttendance.updateMany({
            where: { schoolId: oldVal },
            data: { schoolId: newVal }
        });
        console.log(`Updated ${attendance.count} attendance records from ${oldVal} to ${newVal}`);

        // 5. Update Goals
        const goals = await prisma.goal.updateMany({
            where: { campus: oldVal },
            data: { campus: newVal }
        });
        console.log(`Updated ${goals.count} goals from ${oldVal} to ${newVal}`);

        // 6. Update Assessment Assignments
        const assignments = await prisma.assessmentAssignment.updateMany({
            where: { assignedToCampusId: oldVal },
            data: { assignedToCampusId: newVal }
        });
        console.log(`Updated ${assignments.count} assignments from ${oldVal} to ${newVal}`);
    }

    console.log('Migration complete!');
}

migrate()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
