const fs = require('fs');
let c = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');

const missingIcons = ['TrendingUp', 'TrendingDown', 'BarChart as BarChartIcon', 'FileSpreadsheet', 'PieChart as PieChartIcon'];

for (const icon of missingIcons) {
  if (!c.includes(icon)) {
    c = c.replace("from 'lucide-react';", `, ${icon} } from 'lucide-react';`);
  }
}

// Fix impure function warning
c = c.replace('new Date(p.pagoFecha || Date.now())', 'new Date(p.pagoFecha || new Date())');

c = c.replace(/,\s*,/g, ',');
c = c.replace(/\{\s*,/g, '{');
c = c.replace(/,\s*\}/g, '}');

fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', c);
console.log("Restored specific missing icons!");
