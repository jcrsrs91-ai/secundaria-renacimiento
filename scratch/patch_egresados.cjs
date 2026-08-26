const fs = require('fs');

// Patch RegularizacionPrint.jsx
let regFile = fs.readFileSync('src/components/RegularizacionPrint.jsx', 'utf8');

const newAdeudosLogic = `
  const adeudosData = useMemo(() => {
    const list = [];
    activos.forEach(student => {
      const adeudos = [];
      const regularizadas = [];

      // Check all 3 grades to find any failed subject in historial or current system
      const gradosAChecar = ['1er Grado', '2do Grado', '3er Grado'];
      
      gradosAChecar.forEach(gradoKey => {
        const materias = materiasPorGrado[gradoKey] || [];
        materias.forEach(mat => {
          let hasGrade = false;
          let finalMat = 0;
          
          // Check historial first
          if (student.historial && student.historial[gradoKey] && student.historial[gradoKey][mat.id]) {
            const hist = student.historial[gradoKey][mat.id];
            const t1 = parseFloat(hist.t1);
            const t2 = parseFloat(hist.t2);
            const t3 = parseFloat(hist.t3);
            if (!isNaN(t1) || !isNaN(t2) || !isNaN(t3)) {
              let sum = 0, c = 0;
              if (!isNaN(t1)) { sum += t1; c++; }
              if (!isNaN(t2)) { sum += t2; c++; }
              if (!isNaN(t3)) { sum += t3; c++; }
              finalMat = Math.floor((sum / c + 0.00001) * 10) / 10;
              hasGrade = true;
            }
          }
          
          // If not in historial, check active calificaciones (only if student is in this grade, or if the grade exists)
          if (!hasGrade && student.calificaciones) {
            const t1 = parseFloat(student.calificaciones?.['t1']?.[mat.id]);
            const t2 = parseFloat(student.calificaciones?.['t2']?.[mat.id]);
            const t3 = parseFloat(student.calificaciones?.['t3']?.[mat.id]);
            if (!isNaN(t1) || !isNaN(t2) || !isNaN(t3)) {
              let sum = 0, c = 0;
              if (!isNaN(t1)) { sum += t1; c++; }
              if (!isNaN(t2)) { sum += t2; c++; }
              if (!isNaN(t3)) { sum += t3; c++; }
              finalMat = Math.floor((sum / c + 0.00001) * 10) / 10;
              hasGrade = true;
            }
          }

          if (hasGrade) {
            const isReprobada = finalMat < 6;
            const reg = student.regularizacion?.[mat.id];
            
            if (reg) {
              regularizadas.push({ ...mat, finalGrade: reg.calificacion, fecha: reg.fecha, isHistoric: true });
            } else if (isReprobada) {
              adeudos.push({ ...mat, finalGrade: finalMat });
            }
          }
        });
      });

      const adeudosAnteriores = student.adeudosAnteriores || [];
      adeudosAnteriores.forEach(histMat => {
         // avoid duplicates if we already found it
         if (!adeudos.find(m => m.id === histMat.id) && !regularizadas.find(m => m.id === histMat.id)) {
           const reg = student.regularizacion?.[histMat.id];
           if (reg) {
              regularizadas.push({ ...histMat, finalGrade: reg.calificacion, fecha: reg.fecha, isHistoric: true });
           } else {
              adeudos.push({ ...histMat, isHistoric: true });
           }
         }
      });

      if (adeudos.length > 0 || regularizadas.length > 0) {
        list.push({ student, adeudos, regularizadas });
      }
    });
`;

const regexAdeudos = /const adeudosData = useMemo\(\(\) => \{[\s\S]*?if \(adeudos\.length > 0 \|\| regularizadas\.length > 0\) \{[\s\S]*?\}\s*\}\);\s*/;

regFile = regFile.replace(regexAdeudos, newAdeudosLogic);

fs.writeFileSync('src/components/RegularizacionPrint.jsx', regFile);

// Patch ControlEscolar.jsx
let ceFile = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');
ceFile = ceFile.replace(/<RegularizacionPrint \s*activos=\{activos\}/g, "<RegularizacionPrint \n            activos={directorio}");
fs.writeFileSync('src/pages/dashboard/ControlEscolar.jsx', ceFile);

console.log('Patched correctly');
