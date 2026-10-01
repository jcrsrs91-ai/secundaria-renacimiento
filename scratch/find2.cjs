const fs = require('fs');
const lines = fs.readFileSync('src/pages/dashboard/Inventario.jsx', 'utf8').split('\n');
let found = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("activeTab === 'resguardos'") && lines[i].includes("&&")) {
        found = i;
        break;
    }
}

if (found !== -1) {
    console.log(lines.slice(found + 20, found + 80).join('\n'));
} else {
    console.log("NOT FOUND");
}
