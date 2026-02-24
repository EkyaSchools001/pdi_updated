const fs = require('fs');
try {
    const content = fs.readFileSync('vite_error.log', 'utf16le');

    const errorLines = content.split('\n').filter(line =>
        line.toLowerCase().includes('error') ||
        line.includes('resolve') ||
        line.includes('.tsx') ||
        line.includes('.ts')
    );

    fs.writeFileSync('vite_error_parsed.txt', errorLines.join('\n'));
} catch (e) {
    fs.writeFileSync('vite_error_parsed.txt', String(e));
}
