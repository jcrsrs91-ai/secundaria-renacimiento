const fs = require('fs');
const path = 'src/components/Formato911.jsx';
let c = fs.readFileSync(path, 'utf8');

const calcCode = `
  const calculosReprobados = useMemo(() => {
    // V9: Reprobaron durante el ciclo escolar
    // V10: Se regularizaron
    // V11: Continúan como irregulares
    const rows9 = Array(3).fill(null).map(() => Array(8).fill(0));
    const rows10 = Array(3).fill(null).map(() => Array(8).fill(0));
    const rows11 = Array(3).fill(null).map(() => Array(8).fill(0));

    // Combine all students that need to be checked
    // Current Activos (1er, 2do, 3er) + Egresados
    if (!materiasPorGrado) return { rows9, rows10, rows11 };
    
    // We check ALL rawActivos, but filter them manually
    rawActivos.forEach(a => {
      // Must match shiftFilter if not Ambos
      if (shiftFilter !== 'Ambos' && a.turno !== shiftFilter) return;
      if (a.status !== 'Activo' && a.status !== 'Egresado') return;

      let targetGrade = null;
      let rowIndex = -1;

      // 1o row = Current 2do, or repeaters of 1er
      if ((a.grado === '2do Grado' || a.grado?.includes('2do Grado')) || 
          (a.grado?.includes('1er') && a.repetidor === 'SÍ')) {
        targetGrade = '1er Grado';
        rowIndex = 0;
      }
      // 2o row = Current 3er, or repeaters of 2do
      else if ((a.grado === '3er Grado' || a.grado?.includes('3er Grado')) || 
               (a.grado?.includes('2do') && a.repetidor === 'SÍ')) {
        targetGrade = '2do Grado';
        rowIndex = 1;
      }
      // 3o row = Egresados, or repeaters of 3er
      else if ((a.status === 'Egresado') || 
               (a.grado?.includes('3er') && a.repetidor === 'SÍ')) {
        targetGrade = '3er Grado';
        rowIndex = 2;
      }

      if (rowIndex !== -1 && a.calificaciones) {
         const materias = materiasPorGrado[targetGrade];
         if (materias) {
            let numFailed = 0;
            let numReg = 0;

            for (let mat of materias) {
              const t1 = parseFloat(a.calificaciones?.['t1']?.[mat.id]);
              const t2 = parseFloat(a.calificaciones?.['t2']?.[mat.id]);
              const t3 = parseFloat(a.calificaciones?.['t3']?.[mat.id]);
              
              const extraScore = a.regularizacion?.[mat.id]?.calificacion;
              const hasReg = extraScore !== undefined && parseFloat(extraScore) >= 6;

              if (!isNaN(t1) && !isNaN(t2) && !isNaN(t3)) {
                 const avg = (t1 + t2 + t3) / 3;
                 // It only counts as failing if average is less than 6
                 if (avg < 6) {
                    numFailed++;
                    if (hasReg) numReg++;
                 }
              }
            }

            if (numFailed > 0) {
               const isHombre = a.genero === 'Hombre';
               const isIndigena = a.lenguaIndigena === 'SÍ' || a.lenguaIndigena === 'SÃ ';
               const isExtranjero = a.nacionalidad === 'EXTRANJERA';
               
               let colDiscapacidad = -1;
               if (a.discapacidad && a.discapacidad !== 'Ninguna' && a.discapacidad !== 'NO') {
                 let d = a.discapacidad;
                 let esTrastorno = d.includes('Trastorno') || d.includes('TDAH');
                 let esSobresaliente = d.includes('Aptitudes sobresalientes');
                 let esOtra = d.includes('Otras');

                 if (!esTrastorno && !esSobresaliente && !esOtra) colDiscapacidad = 4; // Discapacidad
                 else if (esTrastorno) colDiscapacidad = 5; // Trastorno
                 else if (esSobresaliente) colDiscapacidad = 6; // Aptitudes
                 else if (esOtra) colDiscapacidad = 7; // Otras
               }

               const addToRows = (rowsArray) => {
                  if (isHombre) rowsArray[rowIndex][0]++;
                  else rowsArray[rowIndex][1]++;
                  rowsArray[rowIndex][2]++; // Total
                  if (isIndigena) rowsArray[rowIndex][3]++;
                  if (isExtranjero) rowsArray[rowIndex][4]++; // Wait! Col 4 is Extranjero. But what about Discapacidad? 
                  // Let's check table cols: Hombres, Mujeres, Total, Indígenas, Extranjeros, Discapacidad, Trastorno, Apt, Otras
                  // 0: Hombres, 1: Mujeres, 2: Total, 3: Indigena, 4: Extranjero, 5: Discapacidad, 6: Trastorno, 7: Apt, 8: Otras.
               };

               // Oops! Let's redefine colDiscapacidad correctly:
               colDiscapacidad = -1;
               if (a.discapacidad && a.discapacidad !== 'Ninguna' && a.discapacidad !== 'NO') {
                 let d = a.discapacidad;
                 let esTrastorno = d.includes('Trastorno') || d.includes('TDAH');
                 let esSobresaliente = d.includes('Aptitudes sobresalientes');
                 let esOtra = d.includes('Otras');

                 if (!esTrastorno && !esSobresaliente && !esOtra) colDiscapacidad = 5;
                 else if (esTrastorno) colDiscapacidad = 6;
                 else if (esSobresaliente) colDiscapacidad = 7;
                 else if (esOtra) colDiscapacidad = 8;
               }

               const addToRowsCorrected = (rowsArray) => {
                  if (isHombre) rowsArray[rowIndex][0]++;
                  else rowsArray[rowIndex][1]++;
                  rowsArray[rowIndex][2]++;
                  if (isIndigena) rowsArray[rowIndex][3]++;
                  if (isExtranjero) rowsArray[rowIndex][4]++;
                  if (colDiscapacidad !== -1) rowsArray[rowIndex][colDiscapacidad]++;
               };

               // Add to Pregunta 9
               addToRowsCorrected(rows9);

               if (numReg === numFailed) {
                  // Passed ALL failed subjects => Pregunta 10
                  addToRowsCorrected(rows10);
               } else {
                  // Continues irregular => Pregunta 11
                  addToRowsCorrected(rows11);
               }
            }
         }
      }
    });

    return { rows9, rows10, rows11 };
  }, [rawActivos, shiftFilter, materiasPorGrado]);
`;

// Insert the code
c = c.replace('  const calculosV8 = useMemo(() => {', calcCode + '\n  const calculosV8 = useMemo(() => {');
c = c.replace('calculosV7, calculosV8]);', 'calculosV7, calculosV8, calculosReprobados]);');

// Replace Pregunta 9 table
const p9Old = `{['1o.', '2o.', '3o.', 'Total'].map((g, i) => (
                    <tr key={i} className={g === 'Total' ? 'font-bold bg-slate-50' : ''}>
                      <td className="border border-slate-300 p-2">{g}</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                    </tr>
                  ))}`;

const p9New = `{['1o.', '2o.', '3o.', 'Total'].map((g, i) => {
                    const rowData = i < 3 ? calculosReprobados.rows9[i] : calculosReprobados.rows9.reduce((acc, row) => acc.map((v, j) => v + row[j]), Array(9).fill(0));
                    return (
                    <tr key={i} className={g === 'Total' ? 'font-bold bg-emerald-50 text-emerald-900' : ''}>
                      <td className="border border-slate-300 p-2">{g}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[0]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[1]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-200 font-bold">{rowData[2]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[3]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[4]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[5]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[6]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[7]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[8]}</td>
                    </tr>
                  )
                  })}`;

// Also replace Pregunta 10 and 11
const p10New = p9New.replace(/rows9/g, 'rows10');
const p11New = p9New.replace(/rows9/g, 'rows11');

// Replace table 9
c = c.replace(p9Old, p9New);
// Replace table 10 (it uses the exact same old string)
c = c.replace(p9Old, p10New);
// Replace table 11 (it uses the exact same old string)
c = c.replace(p9Old, p11New);

fs.writeFileSync(path, c, 'utf8');
console.log('Added 9,10,11 calculations');
