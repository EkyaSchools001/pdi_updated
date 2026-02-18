import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Prisma Client (will automatically use DATABASE_URL from .env)
const prisma = new PrismaClient();

async function main() {
    // Clear existing data in correct order to avoid foreign key constraints
    console.log('Clearing existing data...');

    const tables = [
        'courseEnrollment', 'moocSubmission', 'registration', 'pDHour',
        'goal', 'documentAcknowledgement', 'observationDomain', 'observation',
        'document', 'trainingEvent', 'course', 'formTemplate', 'systemSettings', 'user'
    ];

    for (const table of tables) {
        try {
            await (prisma as any)[table].deleteMany({});
            console.log(`Cleared ${table}`);
        } catch (e) {
            console.warn(`Could not clear ${table}, maybe it depends on something else.`);
        }
    }

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
        await prisma.user.upsert({
            where: { email: u.email },
            update: {
                fullName: u.name,
                passwordHash: hashedPassword,
                role: u.role as any,
                campusId: u.campusId,
                department: u.department
            },
            create: {
                fullName: u.name,
                email: u.email,
                passwordHash: hashedPassword,
                role: u.role as any,
                campusId: u.campusId,
                department: u.department
            }
        });
    }

    // Seed default access matrix config
    const defaultAccessMatrix = [
        { moduleId: 'users', moduleName: 'User Management', roles: { SUPERADMIN: true, ADMIN: true, LEADER: false, MANAGEMENT: false, TEACHER: false } },
        { moduleId: 'forms', moduleName: 'Form Templates', roles: { SUPERADMIN: true, ADMIN: true, LEADER: false, MANAGEMENT: false, TEACHER: false } },
        { moduleId: 'courses', moduleName: 'Course Catalogue', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: true, TEACHER: true } },
        { moduleId: 'calendar', moduleName: 'Training Calendar', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: true, TEACHER: true } },
        { moduleId: 'documents', moduleName: 'Documents', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: true, TEACHER: true } },
        { moduleId: 'reports', moduleName: 'Reports & Analytics', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: true, TEACHER: false } },
        { moduleId: 'settings', moduleName: 'System Settings', roles: { SUPERADMIN: true, ADMIN: false, LEADER: false, MANAGEMENT: false, TEACHER: false } },
        { moduleId: 'attendance', moduleName: 'Attendance', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: false, TEACHER: false } },
        { moduleId: 'observations', moduleName: 'Observations', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: true, TEACHER: true } },
        { moduleId: 'goals', moduleName: 'Goal Management', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: true, TEACHER: true } },
        { moduleId: 'hours', moduleName: 'PD Hours Tracking', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: true, TEACHER: true } },
        { moduleId: 'insights', moduleName: 'Data Insights', roles: { SUPERADMIN: true, ADMIN: true, LEADER: true, MANAGEMENT: true, TEACHER: true } },
    ];

    const defaultFormFlows = [
        { id: '1', formName: 'Walkthrough Observation', senderRole: 'LEADER', targetDashboard: 'Teacher Dashboard', targetLocation: 'Growth Reports' },
        { id: '2', formName: 'Annual Goal Setting', senderRole: 'TEACHER', targetDashboard: 'Leader Dashboard', targetLocation: 'Pending Approvals' },
        { id: '3', formName: 'MOOC Submission', senderRole: 'TEACHER', targetDashboard: 'Admin Dashboard', targetLocation: 'Course Reviews' },
        { id: '4', formName: 'Self-Reflection', senderRole: 'TEACHER', targetDashboard: 'Teacher Dashboard', targetLocation: 'My Portfolio' },
    ];

    await prisma.systemSettings.upsert({
        where: { key: 'access_matrix_config' },
        update: {
            value: JSON.stringify({ accessMatrix: defaultAccessMatrix, formFlows: defaultFormFlows })
        },
        create: {
            key: 'access_matrix_config',
            value: JSON.stringify({ accessMatrix: defaultAccessMatrix, formFlows: defaultFormFlows })
        }
    });

    console.log('Seed data created successfully with users and default access matrix!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
