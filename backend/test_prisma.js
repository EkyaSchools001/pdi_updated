const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    try {
        const teacher = await prisma.user.findFirst({
            where: { role: 'TEACHER' }
        });
        const observer = await prisma.user.findFirst({
            where: { role: 'LEADER' }
        });

        if (!teacher || !observer) {
            console.log("No teacher or leader found");
            return;
        }

        const payload = {
            teacherId: teacher.id,
            observerId: observer.id,
            campusId: teacher.campusId,
            academicYear: "AY 25-26",
            moduleType: "PERFORMING_ARTS",
            observationDate: new Date(),
            overallRating: 4,
            status: "SUBMITTED",
            formPayload: JSON.stringify({ test: true })
        };

        const result = await prisma.growthObservation.create({
            data: payload
        });
        console.log("Success:", result.id);
    } catch (e) {
        console.error("Prisma error:", e);
    } finally {
        await prisma.$disconnect();
    }
}
test();
