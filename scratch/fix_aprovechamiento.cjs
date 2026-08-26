const fs = require('fs');

let file = fs.readFileSync('src/components/AprovechamientoPrint.jsx', 'utf8');

// Add getGradoBase
const getGradoBaseStr = `
  const getGradoBase = (g) => {
    if (g?.includes('1er')) return '1er Grado';
    if (g?.includes('2do')) return '2do Grado';
    if (g?.includes('3er')) return '3er Grado';
    return null;
  };
`;
file = file.replace(/const getMateriaLabel = /, getGradoBaseStr + '\n  const getMateriaLabel = ');

// Replace exact checks
file = file.replace(/a\.grado === grado/g, "getGradoBase(a.grado) === grado");
file = file.replace(/keysByGrado\[s\.grado\]/g, "keysByGrado[getGradoBase(s.grado)]");
file = file.replace(/keysByGrado\[grado\]/g, "(keysByGrado[grado] || [])");

// Protect foreach
file = file.replace(/gradoKeys\.forEach\(/g, "(gradoKeys || []).forEach(");

fs.writeFileSync('src/components/AprovechamientoPrint.jsx', file);
console.log('Fixed AprovechamientoPrint');
