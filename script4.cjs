const fs = require('fs');
let code = fs.readFileSync('src/components/MatriculaGruposPrint.jsx', 'utf8');

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

fs.writeFileSync('src/components/MatriculaGruposPrint.jsx', code);