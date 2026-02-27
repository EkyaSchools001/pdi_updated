async function testFetch() {
    try {
        // 1. Log in to get token
        const loginRes = await fetch('http://localhost:4000/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'bharath.superadmin@padi.com',
                password: 'Bharath@123'
            })
        });

        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log("Got token.");

        // 2. Fetch templates
        const templatesRes = await fetch('http://localhost:4000/api/v1/templates', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const templatesData = await templatesRes.json();
        console.log("Full data:", JSON.stringify(templatesData).substring(0, 1000));
    } catch (err) {
        console.error("API Error:", err);
    }
}

testFetch();
