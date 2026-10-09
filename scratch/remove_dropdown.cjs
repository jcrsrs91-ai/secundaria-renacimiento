const fs = require('fs');
let c = fs.readFileSync('src/components/Formato911.jsx', 'utf8');

const sIdx = c.indexOf('<div className="flex items-center bg-white rounded-lg border border-slate-300 p-1 shadow-sm">');
const eIdx = c.indexOf('</div>', sIdx) + 6;

if (sIdx !== -1) {
  c = c.substring(0, sIdx) + c.substring(eIdx);
} else {
  console.log("Could not find dropdown div");
}

fs.writeFileSync('src/components/Formato911.jsx', c, 'utf8');
