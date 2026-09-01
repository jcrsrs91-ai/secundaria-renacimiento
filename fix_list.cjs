const fs = require('fs');

// ListaAsistenciaPrint.jsx
let code = fs.readFileSync('src/components/ListaAsistenciaPrint.jsx', 'utf8');
code = code.replace(
  `import React from 'react';`,
  `import React from 'react';\nimport { useGlobalConfig } from '../hooks/useGlobalConfig';`
);
code = code.replace(
  `export default function ListaAsistenciaPrint({ students, grado, grupo, mes, paperSize }) {\n  if (!students || students.length === 0) return null;`,
  `export default function ListaAsistenciaPrint({ students, grado, grupo, mes, paperSize }) {\n  const { config } = useGlobalConfig();\n  if (!students || students.length === 0) return null;`
);
code = code.replace(
  `export default function ListaAsistenciaPrint({ students, grado, grupo, mes, paperSize }) {\r\n  if (!students || students.length === 0) return null;`,
  `export default function ListaAsistenciaPrint({ students, grado, grupo, mes, paperSize }) {\r\n  const { config } = useGlobalConfig();\r\n  if (!students || students.length === 0) return null;`
);
code = code.replace(
  `<span className="underline decoration-slate-400">2025 - 2026</span>`,
  `<span className="underline decoration-slate-400">{config?.cicloEscolarActual || '2025 - 2026'}</span>`
);
fs.writeFileSync('src/components/ListaAsistenciaPrint.jsx', code);

// DesempenoAlcanzadoPrint.jsx
let code2 = fs.readFileSync('src/components/DesempenoAlcanzadoPrint.jsx', 'utf8');
code2 = code2.replace(
  `<p className="text-xl font-black text-indigo-600 print:text-sm">2025 - 2026</p>`,
  `<p className="text-xl font-black text-indigo-600 print:text-sm">{config?.cicloEscolarActual || '2025 - 2026'}</p>`
);
fs.writeFileSync('src/components/DesempenoAlcanzadoPrint.jsx', code2);

// ImpresionDocumentos.jsx
let code3 = fs.readFileSync('src/pages/dashboard/ImpresionDocumentos.jsx', 'utf8');
code3 = code3.replace(
  /Ciclo Escolar 2025-2026/g,
  `Ciclo Escolar {config?.cicloEscolarActual || '2025-2026'}`
);
fs.writeFileSync('src/pages/dashboard/ImpresionDocumentos.jsx', code3);

console.log("Done");
