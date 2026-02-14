import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Prisma Client (will automatically use DATABASE_URL from .env)
const prisma = new PrismaClient();

async function main() {
    // Clear existing data in correct order
    await prisma.moocSubmission.deleteMany({});
    await prisma.registration.deleteMany({});
    await prisma.pDHour.deleteMany({});
    await prisma.goal.deleteMany({});
    await prisma.observationDomain.deleteMany({});
    await prisma.observation.deleteMany({});
    await prisma.documentAcknowledgement.deleteMany({});
    await prisma.document.deleteMany({});
    await prisma.trainingEvent.deleteMany({});
    await prisma.user.deleteMany({});

    console.log('Cleared existing data.');

    const defaultPassword = 'password123'; // Fallback if needed, but we have specific ones

    const users = [
        { name: 'Rohit', email: 'rohit.schoolleader@pdi.com', pass: 'Rohit@123', role: 'LEADER' },
        { name: 'Avani', email: 'avani.admin@pdi.com', pass: 'Avani@123', role: 'ADMIN' },
        { name: 'Teacher One', email: 'teacher1.btmlayout@pdi.com', pass: 'Teacher1@123', role: 'TEACHER', campusId: 'BTM Layout', department: 'Science' },
        { name: 'Teacher Two', email: 'teacher2.jpnagar@pdi.com', pass: 'Teacher2@123', role: 'TEACHER', campusId: 'JP Nagar', department: 'Mathematics' },
        { name: 'Teacher Three', email: 'teacher3.itpl@pdi.com', pass: 'Teacher3@123', role: 'TEACHER', campusId: 'ITPL', department: 'English' },
        { name: 'Indu', email: 'indu.management@pdi.com', pass: 'Indu@123', role: 'MANAGEMENT', campusId: 'Head Office', department: 'Management' },
        { name: 'Bharath', email: 'bharath.superadmin@padi.com', pass: 'Bharath@123', role: 'SUPERADMIN', campusId: 'Head Office', department: 'Admin' }
    ];

    for (const u of users) {
        const hashedPassword = await bcrypt.hash(u.pass, 10);
        await prisma.user.create({
            data: {
                fullName: u.name,
                email: u.email,
                passwordHash: hashedPassword,
                role: u.role as any,
                campusId: u.campusId,
                department: u.department
            }
        });
    }

    console.log('Seed data created successfully with users from Excel!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
