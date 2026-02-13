const axios = require('axios');

async function verify() {
    const baseUrl = 'http://localhost:4000/api/v1';
    try {
        console.log('Logging in...');
        const loginRes = await axios.post(`${baseUrl}/auth/login`, {
            email: 'rohit.schoolleader@pdi.com',
            password: 'Rohit@123'
        });
        const token = loginRes.data.token;
        const headers = { Authorization: `Bearer ${token}` };

        console.log('Fetching observations...');
        const obsRes = await axios.get(`${baseUrl}/observations`, { headers });
        const observations = obsRes.data.data.observations;

        if (observations.length > 0) {
            const id = observations[0].id;
            console.log(`Patching observation ${id}...`);
            const patchRes = await axios.patch(`${baseUrl}/observations/${id}`, {
                hasReflection: true,
                teacherReflection: 'Node Script Verification',
                detailedReflection: {
                    strengths: 'Node strengths',
                    improvements: 'Node improvements',
                    goal: 'Node goal',
                    sections: {
                        planning: {
                            title: 'Planning',
                            ratings: [{ indicator: 'Test', rating: 'Highly Effective' }],
                            evidence: 'Test evidence'
                        }
                    }
                },
                status: 'Submitted'
            }, { headers });
            console.log('Patch Status:', patchRes.status);
            console.log('Patch Response:', JSON.stringify(patchRes.data, null, 2));
        } else {
            console.log('No observations found.');
        }
    } catch (err) {
        console.error('Error:', err.response?.data || err.message);
    }
}

verify();
