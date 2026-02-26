import axios from 'axios';

const testLogin = async () => {
    try {
        const response = await axios.post('http://localhost:4000/api/v1/auth/login', {
            email: 'rohit.schoolleader@pdi.com',
            password: 'Rohit@123'
        });
        console.log('Login successful!');
        console.log('Status:', response.status);
        console.log('Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Login failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
};

testLogin();
