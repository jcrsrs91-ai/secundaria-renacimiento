const fs = require('fs');
let c = fs.readFileSync('src/components/CajaLockScreen.jsx', 'utf8');
c = c.replace(/\\`/g, '`').replace(/\\\$/g, '$');
fs.writeFileSync('src/components/CajaLockScreen.jsx', c);
