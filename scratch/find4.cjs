const fs = require('fs');
const lines = fs.readFileSync('src/pages/dashboard/Inventario.jsx', 'utf8').split('\n');
let start = -1;
for(let i=0; i<lines.length; i++) {
  if (lines[i].includes("modalOpen === 'editResguardo' && editingResguardo ? (")) {
    start = i;
    break;
  }
}
console.log(lines.slice(start + 80, start + 120).join('\n'));
