const fs = require('fs');
let c = fs.readFileSync('src/components/MatriculaGruposPrint.jsx', 'utf8');

c = c.replace(
  "const grado = a.grado || '1er Grado';",
  "let grado = a.grado || '1er Grado';\n      if (grado.includes('1er')) grado = '1er Grado';\n      else if (grado.includes('2do')) grado = '2do Grado';\n      else if (grado.includes('3er') || grado.includes('3ro')) grado = '3er Grado';"
);

fs.writeFileSync('src/components/MatriculaGruposPrint.jsx', c, 'utf8');
