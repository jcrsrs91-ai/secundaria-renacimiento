const fs = require('fs');
let c = fs.readFileSync('src/pages/public/PreInscripcion.jsx', 'utf8');

c = c.replace(
  'const currentCurp = data.curp ? data.curp.toUpperCase() : studentData.curp;',
  `if (data.tieneBeca === 'No') { data.nombreBeca = ''; }
      const currentCurp = data.curp ? data.curp.toUpperCase() : studentData.curp;`
);

fs.writeFileSync('src/pages/public/PreInscripcion.jsx', c);
console.log("Fixed edge case");
