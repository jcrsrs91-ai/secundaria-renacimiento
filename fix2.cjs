const fs = require('fs');

let code2 = fs.readFileSync('src/components/DesempenoAlcanzadoPrint.jsx', 'utf8');
code2 = code2.replace(
  `import React, { useMemo } from 'react';`,
  `import React, { useMemo } from 'react';\nimport { useGlobalConfig } from '../hooks/useGlobalConfig';`
);
code2 = code2.replace(
  `export default function DesempenoAlcanzadoPrint({ activos = [], materiasPorGrado, onClose }) {\r\n`,
  `export default function DesempenoAlcanzadoPrint({ activos = [], materiasPorGrado, onClose }) {\r\n  const { config } = useGlobalConfig();\r\n`
);
code2 = code2.replace(
  `export default function DesempenoAlcanzadoPrint({ activos = [], materiasPorGrado, onClose }) {\n`,
  `export default function DesempenoAlcanzadoPrint({ activos = [], materiasPorGrado, onClose }) {\n  const { config } = useGlobalConfig();\n`
);
fs.writeFileSync('src/components/DesempenoAlcanzadoPrint.jsx', code2);

let code3 = fs.readFileSync('src/pages/dashboard/ImpresionDocumentos.jsx', 'utf8');
if (!code3.includes('useGlobalConfig')) {
  code3 = code3.replace(
    `import React, { useState, useMemo, useRef } from 'react';`,
    `import React, { useState, useMemo, useRef } from 'react';\nimport { useGlobalConfig } from '../../hooks/useGlobalConfig';`
  );
}
if (!code3.includes('const { config } = useGlobalConfig();')) {
  code3 = code3.replace(
    `export default function ImpresionDocumentos({ students = [], onUpdate }) {`,
    `export default function ImpresionDocumentos({ students = [], onUpdate }) {\n  const { config } = useGlobalConfig();`
  );
}
fs.writeFileSync('src/pages/dashboard/ImpresionDocumentos.jsx', code3);

console.log("Done");
