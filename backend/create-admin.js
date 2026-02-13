const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createSuperAdmin() {
    try {
        console.log('Creating Super Admin...');

        const hashedPassword = await bcrypt.hash('Bharath@123', 10);

        const superAdmin = await prisma.user.create({
            data: {
                email: 'bharath.superadmin@pdi.com',
                password: hashedPassword,
                fullName: 'Bharath',
                role: 'SUPERADMIN'
            }
        });

        console.log('✅ Super Admin created successfully!');
        console.log('Email: bharath.superadmin@pdi.com');
        console.log('Password: Bharath@123');
        console.log('User ID:', superAdmin.id);
    } catch (error) {
        if (error.code === 'P2002') {
            console.log('✅ Super Admin already exists!');
            console.log('Email: bharath.superadmin@pdi.com');
            console.log('Password: Bharath@123');
        } else {
            console.error('❌ Error:', error.message);
        }
    } finally {
        await prisma.$disconnect();
    }
}

createSuperAdmin();
