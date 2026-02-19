import axios from 'axios';

async function testLogin() {
    const API_URL = 'http://localhost:4000/api/v1';
    try {
        console.log('Testing Teacher Three login...');
        const response = await axios.post(`${API_URL}/auth/login`, {
            email: 'teacher3.itpl@pdi.com',
            password: 'Teacher3@123'
        });
        console.log('Teacher Three Response Role:', response.data.data.user.role);

        console.log('\nTesting SuperAdmin login...');
        const response2 = await axios.post(`${API_URL}/auth/login`, {
            email: 'bharath.superadmin@padi.com',
            password: 'Bharath@123'
        });
        console.log('SuperAdmin Response Role:', response2.data.data.user.role);
    } catch (error: any) {
        console.error('Login Failed:', error.response?.data || error.message);
    }
}

testLogin();
