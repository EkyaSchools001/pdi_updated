
import axios from 'axios';

const API_URL = 'http://localhost:4000/api/v1';

async function main() {
    try {
        // 1. Login as Teacher which exists in seed
        console.log('Logging in as Teacher...');
        const teacherLogin = await axios.post(`${API_URL}/auth/login`, {
            email: 'teacher1.btmlayout@pdi.com',
            password: 'Teacher1@123'
        });
        const teacherToken = teacherLogin.data.token;
        console.log('Teacher logged in.');

        // 2. Submit Evidence
        console.log('Submitting Evidence...');
        const submissionData = {
            courseName: 'Test Course Flow',
            platform: 'Coursera',
            hours: '10',
            startDate: '2026-01-01',
            endDate: '2026-01-10',
            hasCertificate: 'no',
            effectivenessRating: 8,
            keyTakeaways: 'Learned a lot',
            unansweredQuestions: 'None',
            enjoyedMost: 'Everything',
            name: 'Teacher One',
            email: 'teacher1.btmlayout@pdi.com'
        };

        const submissionRes = await axios.post(`${API_URL}/mooc/submit`, submissionData, {
            headers: { Authorization: `Bearer ${teacherToken}` }
        });
        console.log('Evidence submitted. ID:', submissionRes.data.data.submission.id);

        // 3. Login as Leader
        console.log('Logging in as Leader...');
        const leaderLogin = await axios.post(`${API_URL}/auth/login`, {
            email: 'rohit.schoolleader@pdi.com',
            password: 'Rohit@123'
        });
        const leaderToken = leaderLogin.data.token;
        console.log('Leader logged in.');

        // 4. Get Submissions as Leader
        console.log('Fetching Submissions as Leader...');
        const submissionsRes = await axios.get(`${API_URL}/mooc`, {
            headers: { Authorization: `Bearer ${leaderToken}` }
        });

        const submissions = submissionsRes.data.data.submissions;
        console.log(`Leader found ${submissions.length} submissions.`);

        const found = submissions.find((s: any) => s.courseName === 'Test Course Flow');
        if (found) {
            console.log('SUCCESS: Leader can see the new submission.');
            console.log('Submission details:', {
                id: found.id,
                teacherName: found.name,
                status: found.status
            });
        } else {
            console.error('FAILURE: Leader CANNOT see the new submission.');
        }

    } catch (error: any) {
        console.error('Error:', error.response?.data || error.message);
    }
}

main();
