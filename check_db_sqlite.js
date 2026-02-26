const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database/prisma/dev.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Connection error:', err.message);
        return;
    }
    db.all('SELECT * FROM FormTemplate', [], (err, rows) => {
        if (err) {
            console.error('Query error:', err.message);
            return;
        }
        console.log(`Found ${rows.length} templates.`);
        console.log(JSON.stringify(rows.slice(0, 2), null, 2));
        db.close();
    });
});
