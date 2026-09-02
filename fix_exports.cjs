const fs = require('fs');
const files = [
  'src/components/Calificaciones.jsx',
  'src/pages/dashboard/ControlEscolar.jsx',
  'src/pages/dashboard/Contraloria.jsx',
  'src/pages/dashboard/Inventario.jsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Fix Calificaciones.jsx (sep=,\n\uFEFF -> \uFEFFsep=,\n) and add toUpperCase
  content = content.replace(/" sep=,\\n\\uFEFF\ \+ Papa\.unparse\(([^)]+)\)/g, '\\\uFEFFsep=,\\n\ + Papa.unparse().toUpperCase()');

 // Fix Contraloria and Inventario (line 524, 474)
 content = content.replace(/new Blob\(\[\sep=,\\n\\uFEFF\ \+ csv\]/g, 'new Blob([\\\uFEFFsep=,\\n\ + csv.toUpperCase()]');

 // Fix ControlEscolar (line 846), Contraloria (line 1653), Inventario (line 1605)
 // [\sep=,\\n\ + BOM + csv] -> [BOM + \sep=,\\n\ + csv.toUpperCase()]
 content = content.replace(/new Blob\(\[\sep=,\\n\ \+ BOM \+ csv\]/g, 'new Blob([BOM + \sep=,\\n\ + csv.toUpperCase()]');

 // Fix ControlEscolar template
 // const blob = new Blob([BOM + csvContent],
 // csvContent is a string. Let's just uppercase the string assignment.
 // Actually, we can just do [BOM + csvContent.toUpperCase()]
 if (file.includes('ControlEscolar.jsx')) {
 content = content.replace(/new Blob\(\[BOM \+ csvContent\]/g, 'new Blob([BOM + csvContent.toUpperCase()]');
 }

 // Also in Contraloria and Inventario, csv might be generated via Papa.unparse and NOT uppercased yet.
 // The Blob replacement handles csv.toUpperCase()! So we are good.

 fs.writeFileSync(file, content);
 console.log('Fixed', file);
});