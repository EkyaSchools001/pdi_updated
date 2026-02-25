
const fs = require('fs');

const targetFile = 'c:\\Users\\HP\\Desktop\\ekya\\school-growth-hub-main\\src\\pages\\LeaderDashboard.tsx';
const sourceFile = 'c:\\Users\\HP\\Desktop\\ekya\\school-growth-hub-main\\src\\pages\\ObserveView_new.tsx';

const lines = fs.readFileSync(targetFile, 'utf8').split('\n');
const newCode = fs.readFileSync(sourceFile, 'utf8');

// Lines to remove: 2540 to 2625 (1-based)
// Indices: 2539 to 2625 (exclusive of end index in slice) -> 0..2538 + newCode + 2625..end

const startIdx = 2539;
const endIdx = 2625;

const newLines = [
    ...lines.slice(0, startIdx),
    newCode,
    ...lines.slice(endIdx)
];

fs.writeFileSync(targetFile, newLines.join('\n'), 'utf8');

console.log("Successfully spliced new ObserveView code.");
