const fs = require('fs');
let c = fs.readFileSync('src/components/Formato911.jsx', 'utf8');

c = c.replace(
  'V. ALUMNADO Y GRUPOS POR EDAD</h3>',
  'V. ALUMNADO Y GRUPOS POR EDAD (Debug Activos: {activos.length}) (Debug Raw: {rawActivos.length})</h3>'
);

fs.writeFileSync('src/components/Formato911.jsx', c, 'utf8');
