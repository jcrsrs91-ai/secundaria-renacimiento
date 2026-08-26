const fs = require('fs');
const glob = require('glob'); // wait, node glob is not built-in, but I can just do a loop

const files = [
  'src/components/AprovechamientoPrint.jsx',
  'src/components/AprobacionPrint.jsx',
  'src/components/DesempenoAlcanzadoPrint.jsx',
  'src/components/EficienciaTerminalPrint.jsx',
  'src/components/DesertoresPrint.jsx',
];

const getGradoBaseStr = `
  const getGradoBase = (g) => {
    if (g?.includes('1er')) return '1er Grado';
    if (g?.includes('2do')) return '2do Grado';
    if (g?.includes('3er')) return '3er Grado';
    return null;
  };
`;

files.forEach(f => {
  if (fs.existsSync(f)) {
    let file = fs.readFileSync(f, 'utf8');

    if (!file.includes('const getGradoBase =')) {
        // inject getGradoBase
        file = file.replace(/const \{ config \} = useGlobalConfig\(\);/, 'const { config } = useGlobalConfig();\n' + getGradoBaseStr);
    }
    
    // replace a.grado === grado
    file = file.replace(/a\.grado === grado/g, "getGradoBase(a.grado) === grado");
    file = file.replace(/s\.grado === grado/g, "getGradoBase(s.grado) === grado");
    file = file.replace(/keysByGrado\[s\.grado\]/g, "keysByGrado[getGradoBase(s.grado)]");
    file = file.replace(/keysByGrado\[a\.grado\]/g, "keysByGrado[getGradoBase(a.grado)]");
    file = file.replace(/gradoKeys\.forEach\(/g, "(gradoKeys || []).forEach(");
    
    fs.writeFileSync(f, file);
    console.log('Fixed ' + f);
  }
});
