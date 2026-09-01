const fs = require('fs');
let code3 = fs.readFileSync('src/pages/dashboard/ImpresionDocumentos.jsx', 'utf8');
code3 = code3.replace(
  /Ciclo Escolar 2025-2026/g,
  'Ciclo Escolar {config?.cicloEscolarActual || \'2025-2026\'}'
);
fs.writeFileSync('src/pages/dashboard/ImpresionDocumentos.jsx', code3);