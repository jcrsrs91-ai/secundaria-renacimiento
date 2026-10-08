const fs = require('fs');

let content = fs.readFileSync('src/components/Formato911.jsx', 'utf8');

// The algorithm for Section V.1
const algorithm = `
  const calculosV1 = useMemo(() => {
    // Inicializar estructura V.1
    const v1 = {
      '1': { NvoHombres: Array(8).fill(0), RepHombres: Array(8).fill(0), NvoMujeres: Array(8).fill(0), RepMujeres: Array(8).fill(0), grupos: new Set() },
      '2': { NvoHombres: Array(8).fill(0), RepHombres: Array(8).fill(0), NvoMujeres: Array(8).fill(0), RepMujeres: Array(8).fill(0), grupos: new Set() },
      '3': { NvoHombres: Array(8).fill(0), RepHombres: Array(8).fill(0), NvoMujeres: Array(8).fill(0), RepMujeres: Array(8).fill(0), grupos: new Set() }
    };

    activos.forEach(a => {
      // Calcular edad al 1 de septiembre de 2026
      let edadIndex = -1;
      if (a.fechaNacimiento) {
        const fn = new Date(a.fechaNacimiento + 'T12:00:00Z');
        const sep1 = new Date('2026-09-01T12:00:00Z');
        let edad = sep1.getFullYear() - fn.getFullYear();
        const m = sep1.getMonth() - fn.getMonth();
        if (m < 0 || (m === 0 && sep1.getDate() < fn.getDate())) {
          edad--;
        }
        
        if (edad < 12) edadIndex = 0;
        else if (edad === 12) edadIndex = 1;
        else if (edad === 13) edadIndex = 2;
        else if (edad === 14) edadIndex = 3;
        else if (edad === 15) edadIndex = 4;
        else if (edad === 16) edadIndex = 5;
        else if (edad === 17) edadIndex = 6;
        else edadIndex = 7;
      }

      const g = a.grado === '1er Grado' ? '1' : a.grado === '2do Grado' ? '2' : '3';
      const isRep = a.repetidor === 'SÍ';
      const isHombre = a.genero === 'Hombre';

      if (a.grupo) v1[g].grupos.add(a.grupo);

      if (edadIndex !== -1) {
        if (isHombre && !isRep) v1[g].NvoHombres[edadIndex]++;
        if (isHombre && isRep) v1[g].RepHombres[edadIndex]++;
        if (!isHombre && !isRep) v1[g].NvoMujeres[edadIndex]++;
        if (!isHombre && isRep) v1[g].RepMujeres[edadIndex]++;
      }
    });

    return v1;
  }, [activos]);
`;

content = content.replace(
  /\/\/ En la Fase 2, aquí irán todas las lógicas matemáticas para procesar "activos"/,
  algorithm
);


// Replace the Section V.1 map rendering logic.
// Original map:
/*
  {[
    { label: "1° Hombres Nvo.", g: '1' }, { label: "1° Hombres Rep.", g: '1' },
    { label: "1° Mujeres Nvo.", g: '1' }, { label: "1° Mujeres Rep.", g: '1' },
    { label: "Subtotal 1°", g: '1', sub: true },
...
*/

// I will write a regex to replace the specific tbody for Section V.1.
// We need to inject the React variables instead of `0`.

const rowRenderer = `
                  {[
                    { label: "1° Hombres Nvo.", g: '1', key: 'NvoHombres' }, 
                    { label: "1° Hombres Rep.", g: '1', key: 'RepHombres' },
                    { label: "1° Mujeres Nvo.", g: '1', key: 'NvoMujeres' }, 
                    { label: "1° Mujeres Rep.", g: '1', key: 'RepMujeres' },
                    { label: "Subtotal 1°", g: '1', sub: true },
                    { label: "2° Hombres Nvo.", g: '2', key: 'NvoHombres' }, 
                    { label: "2° Hombres Rep.", g: '2', key: 'RepHombres' },
                    { label: "2° Mujeres Nvo.", g: '2', key: 'NvoMujeres' }, 
                    { label: "2° Mujeres Rep.", g: '2', key: 'RepMujeres' },
                    { label: "Subtotal 2°", g: '2', sub: true },
                    { label: "3° Hombres Nvo.", g: '3', key: 'NvoHombres' }, 
                    { label: "3° Hombres Rep.", g: '3', key: 'RepHombres' },
                    { label: "3° Mujeres Nvo.", g: '3', key: 'NvoMujeres' }, 
                    { label: "3° Mujeres Rep.", g: '3', key: 'RepMujeres' },
                    { label: "Subtotal 3°", g: '3', sub: true },
                    { label: "Total", sub: true, isGlobalTotal: true }
                  ].map((row, i) => {
                    const renderCells = () => {
                      if (row.isGlobalTotal) {
                         const totals = Array(8).fill(0);
                         let tGrupos = 0;
                         ['1','2','3'].forEach(g => {
                            tGrupos += calculosV1[g].grupos.size;
                            for (let idx=0; idx<8; idx++) {
                              totals[idx] += calculosV1[g].NvoHombres[idx] + calculosV1[g].RepHombres[idx] + calculosV1[g].NvoMujeres[idx] + calculosV1[g].RepMujeres[idx];
                            }
                         });
                         const grandTotal = totals.reduce((a,b)=>a+b,0);
                         return (
                           <>
                             {totals.map((v, idx) => <td key={idx} className="border border-slate-300 p-2 font-bold">{v}</td>)}
                             <td className="border border-slate-300 p-2 bg-slate-100 font-bold">{grandTotal}</td>
                             <td className="border border-slate-300 p-2 font-bold">{tGrupos}</td>
                           </>
                         )
                      }

                      if (row.sub) {
                        const subArr = Array(8).fill(0);
                        let sumTotal = 0;
                        for (let idx=0; idx<8; idx++) {
                          subArr[idx] = calculosV1[row.g].NvoHombres[idx] + calculosV1[row.g].RepHombres[idx] + calculosV1[row.g].NvoMujeres[idx] + calculosV1[row.g].RepMujeres[idx];
                          sumTotal += subArr[idx];
                        }
                        return (
                          <>
                            {subArr.map((v, idx) => <td key={idx} className="border border-slate-300 p-2">{v}</td>)}
                            <td className="border border-slate-300 p-2 bg-slate-100">{sumTotal}</td>
                            <td className="border border-slate-300 p-2">{calculosV1[row.g].grupos.size}</td>
                          </>
                        )
                      }
                      
                      // Normal row
                      const arr = calculosV1[row.g][row.key];
                      const rowTotal = arr.reduce((a,b)=>a+b, 0);
                      return (
                        <>
                          {arr.map((v, idx) => <td key={idx} className="border border-slate-300 p-2">{v}</td>)}
                          <td className="border border-slate-300 p-2 bg-slate-100">{rowTotal}</td>
                          <td className="border border-slate-300 p-2 bg-slate-200"></td>
                        </>
                      )
                    };

                    return (
                      <tr key={i} className={row.sub ? 'font-bold bg-slate-50' : ''}>
                        <td className="border border-slate-300 p-2 text-left">{row.label}</td>
                        {renderCells()}
                      </tr>
                    );
                  })}
`;

content = content.replace(
  /\{\[\s*\{\s*label:\s*"1 Hombres Nvo\."[\s\S]*?\}\)\}\s*<\/tbody>/,
  rowRenderer + '\n                </tbody>'
);

// We need to fix the encoding issue for the degrees. Because I use regex, let's match safely.
content = content.replace(
  /\{\[\s*\{\s*label:\s*["']1[^\s]* Hombres Nvo\.["'][\s\S]*?\}\)\}\s*<\/tbody>/,
  rowRenderer + '\n                </tbody>'
);


// To fix the TableGrid dependency, we change `[shiftFilter]` to `[shiftFilter, calculosV1]` so the table re-renders when data changes!
content = content.replace(
  /\], \[shiftFilter\]\); return TableGrid;/,
  `], [shiftFilter, calculosV1]); return TableGrid;`
);

fs.writeFileSync('src/components/Formato911.jsx', content, 'utf8');
console.log('Algorithm for Section V.1 injected!');
