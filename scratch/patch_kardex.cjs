const fs = require('fs');
let file = fs.readFileSync('src/components/KardexPrint.jsx', 'utf8');

// 1. Change getHistorialMateria so that it does NOT overwrite the value with regularizacion
// But wait, if it doesn't overwrite it, then the overall average is wrong.
// If the user wants the Kárdex to KEEP the 5, how does the average calculate?
// In KardexPrint.jsx:
//     const finalMat = Math.floor((sum / c + 0.00001) * 10) / 10;
// We can return `originalValor: finalMat` and `valor: (hasReg ? regValor : finalMat)`!

let patchHistorialMateria = `
        let sum = 0, c = 0;
        if (!isNaN(t1)) { sum += t1; c++; }
        if (!isNaN(t2)) { sum += t2; c++; }
        if (!isNaN(t3)) { sum += t3; c++; }
        
        const finalMat = Math.floor((sum / c + 0.00001) * 10) / 10;
        
        // Modificado para mantener el original en Kárdex
        if (student.regularizacion && student.regularizacion[materiaId]) {
          return {
            valor: parseFloat(student.regularizacion[materiaId].calificacion), // para promedios
            originalValor: finalMat, // para mostrar en tabla
            isRegularizacion: true,
            fecha: student.regularizacion[materiaId].fecha,
            periodo: student.regularizacion[materiaId].periodo,
            t1: isNaN(t1) ? '-' : t1,
            t2: isNaN(t2) ? '-' : t2,
            t3: isNaN(t3) ? '-' : t3
          };
        }

        return {
          valor: finalMat,
          originalValor: finalMat,
          isRegularizacion: false,
          fecha: null,
          isReprobada: finalMat < 6,
          t1: isNaN(t1) ? '-' : t1,
          t2: isNaN(t2) ? '-' : t2,
          t3: isNaN(t3) ? '-' : t3
        };
`;

// Replace everything from `if (student.regularizacion && student.regularizacion[materiaId]) {` down to `return { valor: finalMat, ... } }` inside `getHistorialMateria`.
// Let's use regex to replace it.
const regexHistorial1 = /if \(student\.regularizacion && student\.regularizacion\[materiaId\]\) \{[\s\S]*?isReprobada: finalMat < 6,[\s\S]*?t3: isNaN\(t3\) \? '-' : t3\s*\};\s*\}/;

file = file.replace(regexHistorial1, patchHistorialMateria);

// Also we need to patch `getCalificacionFinal` fallback inside `KardexPrint` (it uses `getCalificacionFinal` from utils).
// But `getCalificacionFinal` in utils already does something similar. We can just map it when returned.
// Let's patch `getCalificacionFinal` in utils too, or just wrap it here.
file = file.replace('return getCalificacionFinal(student, materiaId);', `
    const fallback = getCalificacionFinal(student, materiaId);
    if (fallback.isRegularizacion) {
      // Re-calculate original
      const t1 = parseFloat(student.calificaciones?.['t1']?.[materiaId]);
      const t2 = parseFloat(student.calificaciones?.['t2']?.[materiaId]);
      const t3 = parseFloat(student.calificaciones?.['t3']?.[materiaId]);
      let sum = 0, c = 0;
      if (!isNaN(t1)) { sum += t1; c++; }
      if (!isNaN(t2)) { sum += t2; c++; }
      if (!isNaN(t3)) { sum += t3; c++; }
      const finalMat = c > 0 ? Math.floor((sum / c + 0.00001) * 10) / 10 : '-';
      fallback.originalValor = finalMat;
      fallback.periodo = student.regularizacion[materiaId].periodo;
    } else {
      fallback.originalValor = fallback.valor;
    }
    return fallback;
`);

// Now, update the display in the table:
// <td className="border border-slate-400 px-1 py-[1px] text-center font-bold leading-tight">
//   {item.hist ? item.hist.valor : '-'}
// </td>
file = file.replace(
  `{item.hist ? item.hist.valor : '-'}`,
  `{item.hist ? (item.hist.originalValor !== undefined ? item.hist.originalValor : item.hist.valor) : '-'}`
);

// We need to compute `extraordinariosArray` for the new table.
// Find: `const dateStr = today.toLocaleDateString`
// Add the array generation before it.
const extraArrayCode = `
  const extraordinariosArray = [];
  if (student.regularizacion) {
    Object.keys(student.regularizacion).forEach(matId => {
      // Find subject name
      let matName = matId;
      for (const grado in materiasPorGrado) {
        const found = materiasPorGrado[grado].find(m => m.id === matId);
        if (found) matName = found.name;
      }
      extraordinariosArray.push({
        materia: matName,
        calificacion: student.regularizacion[matId].calificacion,
        fecha: student.regularizacion[matId].fecha,
        periodo: student.regularizacion[matId].periodo || '---'
      });
    });
  }
`;
file = file.replace(`const today = new Date();`, extraArrayCode + `\n  const today = new Date();`);

// Change `student.extraordinarios` to `extraordinariosArray` in the template
file = file.replace(/student\.extraordinarios/g, 'extraordinariosArray');

fs.writeFileSync('src/components/KardexPrint.jsx', file);
console.log('Patched KardexPrint.jsx');
