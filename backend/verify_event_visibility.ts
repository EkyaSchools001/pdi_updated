
import axios from 'axios';

const API_URL = 'http://localhost:4000/api/v1';

async function verifyEventVisibility() {
    try {
        console.log('--- Starting Event Visibility Verification ---');

        // 1. Login as Admin
        console.log('\n1. Logging in as Admin...');
        const adminLogin = await axios.post(`${API_URL}/auth/login`, {
            email: 'avani.admin@pdi.com',
            password: 'Avani@123'
        });
        const adminToken = adminLogin.data.token;
        console.log('Admin logged in successfully.');

        // 2. Create a Training Event (Simulating AdminCalendarView)
        console.log('\n2. Creating a Training Event...');
        const newEventData = {
            title: "Verification Workshop " + Date.now(),
            topic: "Pedagogy",
            type: "Pedagogy",
            date: "Feb 20, 2026",
            location: "Virtual Lab",
            capacity: 50,
            status: "Approved"
        };

        const createResponse = await axios.post(`${API_URL}/training`, newEventData, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });

        if (createResponse.data?.status === 'success') {
            console.log('Event created successfully:', createResponse.data.data.event.title);
        } else {
            console.error('Failed to create event:', createResponse.data);
            return;
        }

        // 3. Login as Teacher (Simulating TeacherDashboard)
        console.log('\n3. Logging in as Teacher...');
        const teacherLogin = await axios.post(`${API_URL}/auth/login`, {
            email: 'teacher1.btmlayout@pdi.com',
            password: 'Teacher1@123'
        });
        const teacherToken = teacherLogin.data.token;
        console.log('Teacher logged in successfully.');

        // 4. Fetch Training Events (Simulating TeacherDashboard fetch)
        console.log('\n4. Fetching Training Events as Teacher...');
        const fetchResponse = await axios.get(`${API_URL}/training`, {
            headers: { Authorization: `Bearer ${teacherToken}` }
        });

        const events = fetchResponse.data?.data?.events || [];
        const foundEvent = events.find((e: any) => e.title === newEventData.title);

        if (foundEvent) {
            console.log('SUCCESS: Teacher can verify the newly created event!');
            console.log('Event Details:', {
                id: foundEvent.id,
                title: foundEvent.title,
                date: foundEvent.date
            });
        } else {
            console.error('FAILURE: Teacher could not find the newly created event.');
            console.log('Fetched Events:', events.map((e: any) => e.title));
        }

    } catch (error: any) {
        console.error('An error occurred during verification:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', error.response.data);
        }
    }
}

verifyEventVisibility();
