const axios = require('axios');

const API_URL = 'http://localhost:4000/api/v1';

async function main() {
    try {
        console.log('--- Starting User Management Verification (JS) ---');

        // 1. Login
        const adminEmail = 'avani.admin@pdi.com';
        const adminPassword = 'Avani@123';

        console.log(`Logging in as ${adminEmail}...`);
        let token;
        try {
            const loginRes = await axios.post(`${API_URL}/auth/login`, {
                email: adminEmail,
                password: adminPassword
            });
            token = loginRes.data.token;
            console.log('Login successful. Token received.');
        } catch (error) {
            console.error('Login Failed Raw Error:', error.message);
            if (error.response) {
                console.error('Response Status:', error.response.status);
                console.error('Response Data:', error.response.data);
            } else {
                console.error('No response received from server.');
                if (error.code) console.error('Error Code:', error.code);
            }
            // Try fallback if seed data isn't there (unlikely if dev environment)
            // But we can't easily create an admin via API without being unauthorized.
            process.exit(1);
        }

        // 2. Get All Users
        console.log('Fetching all users...');
        const getAllRes = await axios.get(`${API_URL}/users`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`Fetched ${getAllRes.data.results} users.`);

        // 3. Create New User
        console.log('Creating new user...');
        const newUserEmail = `testuser_${Date.now()}@school.edu`;
        const createRes = await axios.post(`${API_URL}/users`, {
            fullName: 'Test User JS',
            email: newUserEmail,
            role: 'TEACHER',
            campusId: 'Main Campus',
            password: 'password123'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const newUserId = createRes.data.data.user.id;
        console.log(`User created: ${newUserId}`);

        // 4. Update User
        console.log('Updating user...');
        const updateRes = await axios.patch(`${API_URL}/users/${newUserId}`, {
            fullName: 'Updated Test User JS',
            status: 'Inactive'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (updateRes.data.data.user.fullName === 'Updated Test User JS' &&
            updateRes.data.data.user.status === 'Inactive') {
            console.log('User update verified via API response.');
        } else {
            console.error('User update verification failed.');
        }

        // 5. Delete User
        console.log('Deleting user...');
        await axios.delete(`${API_URL}/users/${newUserId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('User deleted.');

        console.log('--- Verification Completed Successfully ---');

    } catch (error) {
        console.error('Verification Failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

main();
