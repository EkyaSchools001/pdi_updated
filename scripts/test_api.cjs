const http = require('http');

function check(path) {
    const options = {
        hostname: 'localhost',
        port: 4000,
        path: path,
        method: 'GET'
    };
    const req = http.request(options, (res) => {
        console.log(`${path} STATUS: ${res.statusCode}`);
    });
    req.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
    });
    req.end();
}

check('/api/health'); // Should be 200
check('/api/v1/attendance/admin/all'); // Should be 401 (Protected)
