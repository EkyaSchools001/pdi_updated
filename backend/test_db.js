const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.trainingEvent.findMany().then(events => {
    console.log("Training Events:");
    console.log(events.map(e => ({ title: e.title, location: e.location, schoolId: e.schoolId })));
}).finally(() => prisma.$disconnect());
