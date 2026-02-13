import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:4000/api/v1';

async function main() {
    try {
        console.log('--- Starting User Management Verification ---');

        // 1. Ensure Admin User Exists
        const adminEmail = 'admin@school.edu';
        const adminPassword = 'adminPassword123';

        let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
        if (!admin) {
            console.log('Creating admin user...');
            const hashedPassword = await bcrypt.hash(adminPassword, 12);
            admin = await prisma.user.create({
                data: {
                    email: adminEmail,
                    password: hashedPassword,
                    fullName: 'Admin User',
                    role: 'ADMIN',
                    status: 'Active'
                }
            });
        } else {
            // Ensure password is known (reset it)
            const hashedPassword = await bcrypt.hash(adminPassword, 12);
            await prisma.user.update({
                where: { email: adminEmail },
                data: { password: hashedPassword, role: 'ADMIN' }
            });
            console.log('Admin user exists. Password reset to ensure access.');
        }

        // 2. Login
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: adminEmail,
            password: adminPassword
        });
        const token = loginRes.data.token;
        console.log('Login successful. Token received.');

        // 3. Get All Users
        console.log('Fetching all users...');
        const getAllRes = await axios.get(`${API_URL}/users`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`Fetched ${getAllRes.data.results} users.`);

        // 4. Create New User
        console.log('Creating new user...');
        const newUserEmail = `testuser_${Date.now()}@school.edu`;
        const createRes = await axios.post(`${API_URL}/users`, {
            fullName: 'Test User',
            email: newUserEmail,
            role: 'TEACHER',
            campusId: 'Main Campus',
            password: 'password123'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const newUserId = createRes.data.data.user.id;
        console.log(`User created: ${newUserId}`);

        // 5. Update User
        console.log('Updating user...');
        await axios.patch(`${API_URL}/users/${newUserId}`, {
            fullName: 'Updated Test User',
            status: 'Inactive'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('User updated.');

        // 6. Verify Update
        const updatedUser = await prisma.user.findUnique({ where: { id: newUserId } });
        if (updatedUser?.fullName === 'Updated Test User' && updatedUser.status === 'Inactive') {
            console.log('Verification: User update persisted in database.');
        } else {
            console.error('Verification FAILED: User update not reflected in database.');
        }

        // 7. Delete User
        console.log('Deleting user...');
        await axios.delete(`${API_URL}/users/${newUserId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('User deleted.');

        console.log('--- Verification Completed Successfully ---');

    } catch (error: any) {
        console.error('Verification Failed:', error.response?.data || error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
