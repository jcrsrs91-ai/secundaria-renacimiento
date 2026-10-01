const fs = require('fs');
const txt = fs.readFileSync('src/pages/dashboard/Inventario.jsx', 'utf8');
const lines = txt.split('\n');
const idx = lines.findIndex(l => l.includes("actionType === 'print'"));
console.log(lines.slice(idx, idx + 10).join('\n'));
