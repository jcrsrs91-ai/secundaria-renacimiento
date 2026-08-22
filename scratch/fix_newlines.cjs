const fs = require('fs');
let c = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');
c = c.replace(/\\n/g, '\n');
fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', c);
