const fs = require('fs');
let c = fs.readFileSync('src/components/Formato911.jsx', 'utf8');

const oldMapStart = `{[
                  { label: "1° Hombres Nvo.", g: '1' }, { label: "1° Hombres Rep.", g: '1' },`;

const oldMapEnd = `                  </tr>
                ))}`;

const startIndex = c.indexOf(oldMapStart);
const endIndex = c.indexOf(oldMapEnd, startIndex) + oldMapEnd.length;

if (startIndex === -1 || c.indexOf(oldMapEnd, startIndex) === -1) {
  console.log("Could not find the map to replace!");
  process.exit(1);
}

const newMap = `{[
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
                })}`;

c = c.substring(0, startIndex) + newMap + c.substring(endIndex);
fs.writeFileSync('src/components/Formato911.jsx', c, 'utf8');
console.log('Map Replaced!');
