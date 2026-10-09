const fs = require('fs');
let c = fs.readFileSync('src/components/ActaRecepcionPrint.jsx', 'utf8');
c = c.replace(/\\\`/g, '`');
c = c.replace(/\\\$/g, '$');
fs.writeFileSync('src/components/ActaRecepcionPrint.jsx', c, 'utf8');
console.log('Fixed escaping');
