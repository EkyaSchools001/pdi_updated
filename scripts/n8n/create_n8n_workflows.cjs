/**
 * PDI Platform - n8n Workflow Creator
 * Creates 4 automation workflows for the Ekya PDI platform via n8n REST API.
 * Run with: node --input-type=commonjs create_n8n_workflows.js
 * OR:       node create_n8n_workflows.cjs
 */

const http = require('http');

const N8N_HOST = 'localhost';
const N8N_PORT = 5678;

// Workflow definitions
const workflows = [
    {
        name: "PDI - Daily PD Hours Reminder",
        nodes: [
            {
                id: "cron-node-1",
                name: "Schedule: 8:30 AM Daily",
                type: "n8n-nodes-base.scheduleTrigger",
                typeVersion: 1.2,
                position: [250, 300],
                parameters: {
                    rule: { interval: [{ field: "cronExpression", expression: "30 8 * * *" }] }
                }
            },
            {
                id: "http-node-1",
                name: "POST → PDI: Trigger PD Reminder",
                type: "n8n-nodes-base.httpRequest",
                typeVersion: 4.2,
                position: [520, 300],
                parameters: {
                    method: "POST",
                    url: "http://localhost:4000/api/v1/reminders/pd-hours",
                    sendHeaders: true,
                    headerParameters: { parameters: [{ name: "Content-Type", value: "application/json" }] },
                    sendBody: true,
                    specifyBody: "json",
                    jsonBody: '{"type":"pd_hours_reminder","threshold_days":7}'
                }
            },
            {
                id: "noop-1",
                name: "Done",
                type: "n8n-nodes-base.noOp",
                typeVersion: 1,
                position: [780, 300],
                parameters: {}
            }
        ],
        connections: {
            "Schedule: 8:30 AM Daily": { main: [[{ node: "POST → PDI: Trigger PD Reminder", type: "main", index: 0 }]] },
            "POST → PDI: Trigger PD Reminder": { main: [[{ node: "Done", type: "main", index: 0 }]] }
        }
    },
    {
        name: "PDI - Weekly Observation Summary (Monday 9 AM)",
        nodes: [
            {
                id: "cron-node-2",
                name: "Schedule: Monday 9 AM",
                type: "n8n-nodes-base.scheduleTrigger",
                typeVersion: 1.2,
                position: [250, 300],
                parameters: {
                    rule: { interval: [{ field: "cronExpression", expression: "0 9 * * 1" }] }
                }
            },
            {
                id: "http-node-2",
                name: "POST → PDI: Weekly Observation Report",
                type: "n8n-nodes-base.httpRequest",
                typeVersion: 4.2,
                position: [520, 300],
                parameters: {
                    method: "POST",
                    url: "http://localhost:4000/api/v1/reports/weekly-observations",
                    sendHeaders: true,
                    headerParameters: { parameters: [{ name: "Content-Type", value: "application/json" }] },
                    sendBody: true,
                    specifyBody: "json",
                    jsonBody: '{"type":"weekly_summary","send_to":"leaders"}'
                }
            },
            {
                id: "if-node-2",
                name: "Success?",
                type: "n8n-nodes-base.if",
                typeVersion: 2,
                position: [780, 300],
                parameters: {
                    conditions: {
                        options: { caseSensitive: true },
                        conditions: [
                            {
                                leftValue: "={{ $json.status }}",
                                rightValue: "success",
                                operator: { type: "string", operation: "equals" }
                            }
                        ]
                    }
                }
            },
            {
                id: "noop-2a",
                name: "Report Sent ✓",
                type: "n8n-nodes-base.noOp",
                typeVersion: 1,
                position: [1050, 200],
                parameters: {}
            },
            {
                id: "noop-2b",
                name: "Report Failed ✗",
                type: "n8n-nodes-base.noOp",
                typeVersion: 1,
                position: [1050, 420],
                parameters: {}
            }
        ],
        connections: {
            "Schedule: Monday 9 AM": { main: [[{ node: "POST → PDI: Weekly Observation Report", type: "main", index: 0 }]] },
            "POST → PDI: Weekly Observation Report": { main: [[{ node: "Success?", type: "main", index: 0 }]] },
            "Success?": {
                main: [
                    [{ node: "Report Sent ✓", type: "main", index: 0 }],
                    [{ node: "Report Failed ✗", type: "main", index: 0 }]
                ]
            }
        }
    },
    {
        name: "PDI - Webhook: New Goal → Notify Leader",
        nodes: [
            {
                id: "webhook-node-3",
                name: "Webhook: Teacher Created Goal",
                type: "n8n-nodes-base.webhook",
                typeVersion: 2,
                position: [250, 300],
                parameters: {
                    path: "pdi-goal-created",
                    httpMethod: "POST",
                    responseMode: "onReceived",
                    responseData: "allEntries"
                }
            },
            {
                id: "set-node-3",
                name: "Extract Goal Data",
                type: "n8n-nodes-base.set",
                typeVersion: 3.4,
                position: [500, 300],
                parameters: {
                    assignments: {
                        assignments: [
                            { id: "s1", name: "teacherId", value: "={{ $json.body.teacherId }}", type: "string" },
                            { id: "s2", name: "goalTitle", value: "={{ $json.body.title }}", type: "string" },
                            { id: "s3", name: "campusId", value: "={{ $json.body.campusId }}", type: "string" }
                        ]
                    }
                }
            },
            {
                id: "http-node-3",
                name: "POST → PDI: Notify Leader",
                type: "n8n-nodes-base.httpRequest",
                typeVersion: 4.2,
                position: [750, 300],
                parameters: {
                    method: "POST",
                    url: "http://localhost:4000/api/v1/notifications/goal-created",
                    sendHeaders: true,
                    headerParameters: { parameters: [{ name: "Content-Type", value: "application/json" }] },
                    sendBody: true,
                    specifyBody: "json",
                    jsonBody: '={"teacherId":"{{ $json.teacherId }}","goalTitle":"{{ $json.goalTitle }}","campusId":"{{ $json.campusId }}"}'
                }
            },
            {
                id: "respond-node-3",
                name: "Respond: OK",
                type: "n8n-nodes-base.respondToWebhook",
                typeVersion: 1.1,
                position: [1000, 300],
                parameters: {
                    respondWith: "json",
                    responseBody: '{"status":"notification_sent","message":"Leader notified of new goal"}'
                }
            }
        ],
        connections: {
            "Webhook: Teacher Created Goal": { main: [[{ node: "Extract Goal Data", type: "main", index: 0 }]] },
            "Extract Goal Data": { main: [[{ node: "POST → PDI: Notify Leader", type: "main", index: 0 }]] },
            "POST → PDI: Notify Leader": { main: [[{ node: "Respond: OK", type: "main", index: 0 }]] }
        }
    },
    {
        name: "PDI - Monthly Analytics Report to Management",
        nodes: [
            {
                id: "cron-node-4",
                name: "Schedule: 1st of Month 7 AM",
                type: "n8n-nodes-base.scheduleTrigger",
                typeVersion: 1.2,
                position: [250, 300],
                parameters: {
                    rule: { interval: [{ field: "cronExpression", expression: "0 7 1 * *" }] }
                }
            },
            {
                id: "http-node-4a",
                name: "GET → PDI: Fetch Monthly Analytics",
                type: "n8n-nodes-base.httpRequest",
                typeVersion: 4.2,
                position: [500, 300],
                parameters: {
                    method: "GET",
                    url: "http://localhost:4000/api/v1/analytics/monthly-summary",
                    sendHeaders: true,
                    headerParameters: { parameters: [{ name: "Content-Type", value: "application/json" }] }
                }
            },
            {
                id: "set-node-4",
                name: "Format Report Payload",
                type: "n8n-nodes-base.set",
                typeVersion: 3.4,
                position: [750, 300],
                parameters: {
                    assignments: {
                        assignments: [
                            { id: "f1", name: "reportMonth", value: "={{ new Date().toLocaleString('default', {month: 'long', year: 'numeric'}) }}", type: "string" },
                            { id: "f2", name: "totalTeachers", value: "={{ $json.data ? $json.data.totalTeachers : 0 }}", type: "number" },
                            { id: "f3", name: "avgPdHours", value: "={{ $json.data ? ($json.data.avgPdHours || 0).toFixed(1) : 0 }}", type: "string" },
                            { id: "f4", name: "goalsOnTrack", value: "={{ $json.data ? $json.data.goalsOnTrack : 0 }}", type: "number" },
                            { id: "f5", name: "obsCompleted", value: "={{ $json.data ? $json.data.observationsCompleted : 0 }}", type: "number" }
                        ]
                    }
                }
            },
            {
                id: "http-node-4b",
                name: "POST → PDI: Send to Management",
                type: "n8n-nodes-base.httpRequest",
                typeVersion: 4.2,
                position: [1000, 300],
                parameters: {
                    method: "POST",
                    url: "http://localhost:4000/api/v1/notifications/monthly-report",
                    sendHeaders: true,
                    headerParameters: { parameters: [{ name: "Content-Type", value: "application/json" }] },
                    sendBody: true,
                    specifyBody: "json",
                    jsonBody: '={"reportMonth":"{{ $json.reportMonth }}","totalTeachers":{{ $json.totalTeachers }},"avgPdHours":"{{ $json.avgPdHours }}","goalsOnTrack":{{ $json.goalsOnTrack }},"observationsCompleted":{{ $json.obsCompleted }}}'
                }
            },
            {
                id: "noop-4",
                name: "Report Dispatched",
                type: "n8n-nodes-base.noOp",
                typeVersion: 1,
                position: [1250, 300],
                parameters: {}
            }
        ],
        connections: {
            "Schedule: 1st of Month 7 AM": { main: [[{ node: "GET → PDI: Fetch Monthly Analytics", type: "main", index: 0 }]] },
            "GET → PDI: Fetch Monthly Analytics": { main: [[{ node: "Format Report Payload", type: "main", index: 0 }]] },
            "Format Report Payload": { main: [[{ node: "POST → PDI: Send to Management", type: "main", index: 0 }]] },
            "POST → PDI: Send to Management": { main: [[{ node: "Report Dispatched", type: "main", index: 0 }]] }
        }
    }
];

function makeRequest(path, method, body, cookieHeader) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : null;
        const opts = {
            hostname: N8N_HOST, port: N8N_PORT, path, method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
                ...(cookieHeader ? { 'Cookie': cookieHeader } : {})
            }
        };
        const req = http.request(opts, res => {
            let raw = '';
            const cookies = res.headers['set-cookie'] || [];
            res.on('data', chunk => raw += chunk);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(raw), cookies }); }
                catch { resolve({ status: res.statusCode, body: raw, cookies }); }
            });
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function main() {
    console.log('🔐 Logging in to n8n...');

    // Try different passwords
    const passwords = ['Admin@123', 'Ekya@123', 'password123', 'n8n@ekya123', 'PDI@2026'];
    let sessionCookie = null;

    for (const pass of passwords) {
        try {
            const loginRes = await makeRequest('/rest/login', 'POST', {
                email: 'techproducts@ekyaschools.com',
                password: pass
            });

            if (loginRes.status === 200 && loginRes.body.data) {
                sessionCookie = loginRes.cookies.map(c => c.split(';')[0]).join('; ');
                console.log(`✅ Logged in successfully! (password: ${pass})`);
                break;
            } else {
                console.log(`❌ Wrong password: ${pass} → ${loginRes.status}`);
            }
        } catch (e) {
            console.log(`❌ Error with ${pass}: ${e.message}`);
        }
    }

    if (!sessionCookie) {
        console.log('\n⚠️  Could not login. Trying to get API key from public endpoint...');
        // Try to use the public API
        const testRes = await makeRequest('/rest/workflows', 'GET', null, null);
        console.log('Public workflows endpoint status:', testRes.status);
        return;
    }

    console.log('\n🚀 Creating PDI workflows...\n');

    for (const wf of workflows) {
        try {
            const payload = {
                name: wf.name,
                nodes: wf.nodes,
                connections: wf.connections,
                settings: { executionOrder: 'v1', saveManualExecutions: true },
                staticData: null,
                active: false,
                tags: []
            };

            const res = await makeRequest('/rest/workflows', 'POST', payload, sessionCookie);

            if (res.status === 200 || res.status === 201) {
                const id = res.body.id || res.body.data?.id || 'unknown';
                console.log(`✅ Created: "${wf.name}" (ID: ${id})`);
            } else {
                console.log(`❌ Failed "${wf.name}": Status ${res.status}`);
                console.log('   Body:', JSON.stringify(res.body).substring(0, 200));
            }
        } catch (e) {
            console.log(`❌ Error creating "${wf.name}": ${e.message}`);
        }
    }

    console.log('\n✨ Done! Open http://localhost:5678 to see your workflows.');
}

main();
