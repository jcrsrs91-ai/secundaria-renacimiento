const fs = require('fs');
const path = 'src/components/CredencialPrint.jsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(/Ãº/g, 'ú');
c = c.replace(/Ã³/g, 'ó');
c = c.replace(/Ã¡/g, 'á');
c = c.replace(/Ã\x81/g, 'Á');
c = c.replace(/Ã©/g, 'é');
c = c.replace(/Ã­/g, 'í');
c = c.replace(/Ã±/g, 'ñ');
c = c.replace(/Ã\x8D/g, 'Í');
c = c.replace(/Â¡/g, '¡');
c = c.replace(/Â¿/g, '¿');
c = c.replace(/Â°/g, '°');

fs.writeFileSync(path, c, 'utf8');
console.log('Fixed CredencialPrint');
