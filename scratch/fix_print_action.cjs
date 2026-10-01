const fs = require('fs');
const file = 'src/pages/dashboard/Inventario.jsx';
let txt = fs.readFileSync(file, 'utf8');

txt = txt.replace(
    'setPrintMode("resguardo"); }} className="ml-4',
    'setPrintMode("resguardo"); setTimeout(() => window.print(), 500); }} className="ml-4'
);

fs.writeFileSync(file, txt, 'utf8');
console.log('Fixed print button action');
