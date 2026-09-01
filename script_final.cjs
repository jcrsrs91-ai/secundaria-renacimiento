const fs = require('fs');
let code = fs.readFileSync('src/components/MatriculaGruposPrint.jsx', 'utf8');

code = code.replace(
  `import React, { useMemo } from 'react';`,
  `import React, { useMemo, useState } from 'react';`
);

code = code.replace(
  `const { config } = useGlobalConfig();`,
  `const { config } = useGlobalConfig();\n  const [selectedGrado, setSelectedGrado] = useState('Todos');`
);

code = code.replace(
  `const chartData = useMemo(() => {\r\n    const data = [];\r\n    ['1er Grado', '2do Grado', '3er Grado'].forEach((grado, gIndex) => {`,
  `const chartData = useMemo(() => {\r\n    const data = [];\r\n    const gradosToProcess = selectedGrado === 'Todos' ? ['1er Grado', '2do Grado', '3er Grado'] : [selectedGrado];\r\n    gradosToProcess.forEach((grado, gIndex) => {\r\n      const gPrefix = grado === '1er Grado' ? 1 : grado === '2do Grado' ? 2 : 3;`
);
code = code.replace(
  `const chartData = useMemo(() => {\n    const data = [];\n    ['1er Grado', '2do Grado', '3er Grado'].forEach((grado, gIndex) => {`,
  `const chartData = useMemo(() => {\n    const data = [];\n    const gradosToProcess = selectedGrado === 'Todos' ? ['1er Grado', '2do Grado', '3er Grado'] : [selectedGrado];\n    gradosToProcess.forEach((grado, gIndex) => {\n      const gPrefix = grado === '1er Grado' ? 1 : grado === '2do Grado' ? 2 : 3;`
);

code = code.replace(
  `const gPrefix = gIndex + 1;`,
  ``
);

code = code.replace(
  `  }, [matriculaData]);`,
  `  }, [matriculaData, selectedGrado]);`
);

code = code.replace(
  `const pieData = useMemo(() => {\r\n    return [\r\n      { name: 'Hombres', value: matriculaData.global.existencia.h },\r\n      { name: 'Mujeres', value: matriculaData.global.existencia.m },\r\n    ];\r\n  }, [matriculaData]);`,
  `const pieData = useMemo(() => {\n    if (selectedGrado === 'Todos') {\n      return [\n        { name: 'Hombres', value: matriculaData.global.existencia.h },\n        { name: 'Mujeres', value: matriculaData.global.existencia.m },\n      ];\n    } else {\n      return [\n        { name: 'Hombres', value: matriculaData[selectedGrado].existencia.h },\n        { name: 'Mujeres', value: matriculaData[selectedGrado].existencia.m },\n      ];\n    }\n  }, [matriculaData, selectedGrado]);`
);
code = code.replace(
  `const pieData = useMemo(() => {\n    return [\n      { name: 'Hombres', value: matriculaData.global.existencia.h },\n      { name: 'Mujeres', value: matriculaData.global.existencia.m },\n    ];\n  }, [matriculaData]);`,
  `const pieData = useMemo(() => {\n    if (selectedGrado === 'Todos') {\n      return [\n        { name: 'Hombres', value: matriculaData.global.existencia.h },\n        { name: 'Mujeres', value: matriculaData.global.existencia.m },\n      ];\n    } else {\n      return [\n        { name: 'Hombres', value: matriculaData[selectedGrado].existencia.h },\n        { name: 'Mujeres', value: matriculaData[selectedGrado].existencia.m },\n      ];\n    }\n  }, [matriculaData, selectedGrado]);`
);

code = code.replace(
  `{/* Controles de Impresión */}\r\n      <div className="flex justify-center mb-8 gap-4 print:hidden no-print">\r\n        <button onClick={() => window.print()}`,
  `{/* Controles de Impresión */}\r\n      <div className="flex justify-center items-center mb-8 gap-4 print:hidden no-print">\r\n        <select \n          value={selectedGrado} \n          onChange={(e) => setSelectedGrado(e.target.value)}\n          className="p-2.5 rounded-lg border border-slate-300 font-medium bg-white text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500"\n        >\n          <option value="Todos">Todos los Grados</option>\n          <option value="1er Grado">1er Grado</option>\n          <option value="2do Grado">2do Grado</option>\n          <option value="3er Grado">3er Grado</option>\n        </select>\n        <button onClick={() => window.print()}`
);
code = code.replace(
  `{/* Controles de Impresión */}\n      <div className="flex justify-center mb-8 gap-4 print:hidden no-print">\n        <button onClick={() => window.print()}`,
  `{/* Controles de Impresión */}\n      <div className="flex justify-center items-center mb-8 gap-4 print:hidden no-print">\n        <select \n          value={selectedGrado} \n          onChange={(e) => setSelectedGrado(e.target.value)}\n          className="p-2.5 rounded-lg border border-slate-300 font-medium bg-white text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500"\n        >\n          <option value="Todos">Todos los Grados</option>\n          <option value="1er Grado">1er Grado</option>\n          <option value="2do Grado">2do Grado</option>\n          <option value="3er Grado">3er Grado</option>\n        </select>\n        <button onClick={() => window.print()}`
);


code = code.replace(
  `zoom: 0.75;`,
  `zoom: \${selectedGrado === 'Todos' ? '0.75' : '1.0'};`
);

code = code.replace(
  `{matriculaData.global.existencia.t}`,
  `{selectedGrado === 'Todos' ? matriculaData.global.existencia.t : matriculaData[selectedGrado].existencia.t}`
);

code = code.replace(
  `{matriculaData['1er Grado-Matutino'].existencia.t + matriculaData['2do Grado-Matutino'].existencia.t + matriculaData['3er Grado-Matutino'].existencia.t}`,
  `{selectedGrado === 'Todos' ? matriculaData['1er Grado-Matutino'].existencia.t + matriculaData['2do Grado-Matutino'].existencia.t + matriculaData['3er Grado-Matutino'].existencia.t : (matriculaData[selectedGrado + '-Matutino'] ? matriculaData[selectedGrado + '-Matutino'].existencia.t : 0)}`
);

code = code.replace(
  `{matriculaData['1er Grado-Vespertino'].existencia.t + matriculaData['2do Grado-Vespertino'].existencia.t + matriculaData['3er Grado-Vespertino'].existencia.t}`,
  `{selectedGrado === 'Todos' ? matriculaData['1er Grado-Vespertino'].existencia.t + matriculaData['2do Grado-Vespertino'].existencia.t + matriculaData['3er Grado-Vespertino'].existencia.t : (matriculaData[selectedGrado + '-Vespertino'] ? matriculaData[selectedGrado + '-Vespertino'].existencia.t : 0)}`
);

code = code.replace(
  `{calcDesercion(matriculaData.global.bajas.t, matriculaData.global.inicial.t, matriculaData.global.altas.t)}`,
  `{selectedGrado === 'Todos' ? calcDesercion(matriculaData.global.bajas.t, matriculaData.global.inicial.t, matriculaData.global.altas.t) : calcDesercion(matriculaData[selectedGrado].bajas.t, matriculaData[selectedGrado].inicial.t, matriculaData[selectedGrado].altas.t)}`
);

code = code.replace(
  `Proporción por Género (Global)`,
  `Proporción por Género ({selectedGrado === 'Todos' ? 'Global' : selectedGrado})`
);

code = code.replace(
  `{/* PRIMER GRADO */}\r\n              <tr>`,
  `{/* PRIMER GRADO */}\r\n              {(selectedGrado === 'Todos' || selectedGrado === '1er Grado') && (\r\n                <>\r\n                  <tr>`
);
code = code.replace(
  `{/* PRIMER GRADO */}\n              <tr>`,
  `{/* PRIMER GRADO */}\n              {(selectedGrado === 'Todos' || selectedGrado === '1er Grado') && (\n                <>\n                  <tr>`
);
code = code.replace(
  `{renderRow('TOTALES 1ER GRADO', '1er Grado', true)}`,
  `{renderRow('TOTALES 1ER GRADO', '1er Grado', true)}\r\n                </>\r\n              )}`
);

code = code.replace(
  `{/* SEGUNDO GRADO */}\r\n              <tr>`,
  `{/* SEGUNDO GRADO */}\r\n              {(selectedGrado === 'Todos' || selectedGrado === '2do Grado') && (\r\n                <>\r\n                  <tr>`
);
code = code.replace(
  `{/* SEGUNDO GRADO */}\n              <tr>`,
  `{/* SEGUNDO GRADO */}\n              {(selectedGrado === 'Todos' || selectedGrado === '2do Grado') && (\n                <>\n                  <tr>`
);
code = code.replace(
  `{renderRow('TOTALES 2DO GRADO', '2do Grado', true)}`,
  `{renderRow('TOTALES 2DO GRADO', '2do Grado', true)}\r\n                </>\r\n              )}`
);

code = code.replace(
  `{/* TERCER GRADO */}\r\n              <tr>`,
  `{/* TERCER GRADO */}\r\n              {(selectedGrado === 'Todos' || selectedGrado === '3er Grado') && (\r\n                <>\r\n                  <tr>`
);
code = code.replace(
  `{/* TERCER GRADO */}\n              <tr>`,
  `{/* TERCER GRADO */}\n              {(selectedGrado === 'Todos' || selectedGrado === '3er Grado') && (\n                <>\n                  <tr>`
);
code = code.replace(
  `{renderRow('TOTALES 3ER GRADO', '3er Grado', true)}`,
  `{renderRow('TOTALES 3ER GRADO', '3er Grado', true)}\r\n                </>\r\n              )}`
);

code = code.replace(
  `{/* TOTAL GLOBAL */}\r\n              <tr>`,
  `{/* TOTAL GLOBAL */}\r\n              {selectedGrado === 'Todos' && (\r\n              <tr>`
);
code = code.replace(
  `{/* TOTAL GLOBAL */}\n              <tr>`,
  `{/* TOTAL GLOBAL */}\n              {selectedGrado === 'Todos' && (\n              <tr>`
);
code = code.replace(
  `>{calcDesercion(matriculaData.global.bajas.t, matriculaData.global.inicial.t, matriculaData.global.altas.t)}</td>\r\n              </tr>\r\n            </tbody>`,
  `>{calcDesercion(matriculaData.global.bajas.t, matriculaData.global.inicial.t, matriculaData.global.altas.t)}</td>\r\n              </tr>\r\n              )}\r\n            </tbody>`
);
code = code.replace(
  `>{calcDesercion(matriculaData.global.bajas.t, matriculaData.global.inicial.t, matriculaData.global.altas.t)}</td>\n              </tr>\n            </tbody>`,
  `>{calcDesercion(matriculaData.global.bajas.t, matriculaData.global.inicial.t, matriculaData.global.altas.t)}</td>\n              </tr>\n              )}\n            </tbody>`
);

fs.writeFileSync('src/components/MatriculaGruposPrint.jsx', code);
