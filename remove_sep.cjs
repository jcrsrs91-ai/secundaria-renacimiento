const fs = require('fs');
const files = [
  'src/components/Calificaciones.jsx',
  'src/pages/dashboard/ControlEscolar.jsx',
  'src/pages/dashboard/Contraloria.jsx',
  'src/pages/dashboard/Inventario.jsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Replace \uFEFFsep=,\n with \uFEFF
  content = content.replace(/\\uFEFFsep=,\\n/g, '\\uFEFF');
  // Replace BOM + " sep=,\\n\ with BOM + 
 content = content.replace(/BOM \+ \sep=,\\n\ \+ /g, 'BOM + ');

 fs.writeFileSync(file, content);
 console.log('Fixed', file);
});