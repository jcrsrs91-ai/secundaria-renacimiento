const fs = require('fs');
let file = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');
let lines = file.split('\n');
let newLines = [];
let found = 0;
for (let line of lines) {
    if (line.includes('const [globalShiftFilter, setGlobalShiftFilter] = useState')) {
        found++;
        if (found === 2) {
            continue; // Skip the second one!
        }
    }
    newLines.push(line);
}
fs.writeFileSync('src/pages/dashboard/ControlEscolar.jsx', newLines.join('\n'));
console.log('Removed duplicate variable declaration');
