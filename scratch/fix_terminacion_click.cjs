const fs = require('fs');
let file = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');

file = file.replace(
  /onClick=\{\(\) => \{ setConstanciaType\('terminacion_tramite'\); setPrintMode\('constancia'\); closeModal\(\); \}\}/,
  "onClick={() => { executePrintConstancia('terminacion_tramite'); closeModal(); }}"
);

fs.writeFileSync('src/pages/dashboard/ControlEscolar.jsx', file);
console.log('Fixed button click');
