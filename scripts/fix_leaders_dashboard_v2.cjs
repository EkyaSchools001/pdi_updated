
const fs = require('fs');

const targetFile = 'c:\\Users\\HP\\Desktop\\ekya\\school-growth-hub-main\\src\\pages\\LeaderDashboard.tsx';
const sourceFile = 'c:\\Users\\HP\\Desktop\\ekya\\school-growth-hub-main\\src\\pages\\ObserveView_new.tsx';

let content = fs.readFileSync(targetFile, 'utf8');
const newComponent = fs.readFileSync(sourceFile, 'utf8');

// Find start of ObserveView
const startMarker = 'function ObserveView({ setObservations, setTeam, team, observations }: {';
const endMarker = 'function AssignGoalView({ setGoals }: { setGoals: React.Dispatch<React.SetStateAction<any[]>> }) {';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx === -1) {
    console.error("Could not find start marker");
    process.exit(1);
}

if (endIdx === -1) {
    console.error("Could not find end marker");
    process.exit(1);
}

// Replace everything between start and end with new component
const newContent = content.substring(0, startIdx) + newComponent + '\n\n' + content.substring(endIdx);

fs.writeFileSync(targetFile, newContent, 'utf8');

console.log(`Successfully replaced ObserveView. Replaced ${endIdx - startIdx} chars with ${newComponent.length} chars.`);
