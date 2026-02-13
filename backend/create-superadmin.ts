import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function createSuperAdmin() {
    try {
        // Check if super admin already exists
        const existing = await prisma.user.findUnique({
            where: { email: 'bharath.superadmin@pdi.com' }
        });

        if (existing) {
            console.log('✅ Super Admin already exists!');
            console.log('Email: bharath.superadmin@pdi.com');
            console.log('Password: Bharath@123');
            return;
        }

        // Create super admin with pre-hashed password
        const superAdmin = await prisma.user.create({
            data: {
                email: 'bharath.superadmin@pdi.com',
                password: '$2b$10$dWw/AO/ka.8OA1GXSjQvmcsyIhi3FiKe', // Bharath@123
                fullName: 'Bharath',
                role: 'SUPERADMIN'
            }
        });

        console.log('✅ Super Admin created successfully!');
        console.log('Email: bharath.superadmin@pdi.com');
        console.log('Password: Bharath@123');
        console.log('User ID:', superAdmin.id);
    } catch (error) {
        console.error('❌ Error creating Super Admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createSuperAdmin();
