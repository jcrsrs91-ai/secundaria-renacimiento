const fs = require('fs');
const files = [
  'src/components/Calificaciones.jsx',
  'src/pages/dashboard/ControlEscolar.jsx',
  'src/pages/dashboard/Contraloria.jsx',
  'src/pages/dashboard/Inventario.jsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // We want to remove " sep=,\\n\ from the Blob constructions ONLY.
 // We can do this safely by looking for the specific strings we just added:
 // 1. \\\uFEFFsep=,\\n\ -> \\\uFEFF\
 // 2. \sep=,\\n\ + BOM -> BOM
 // 3. BOM + \sep=,\\n\ -> BOM + \\ (or just BOM)

 content = content.replace(/\\\uFEFFsep=,\\n\ \+/g, '\\\uFEFF\ +');
 content = content.replace(/BOM \+ \sep=,\\n\ \+/g, 'BOM +');

 fs.writeFileSync(file, content);
 console.log('Fixed', file);
});