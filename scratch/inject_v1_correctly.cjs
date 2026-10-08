const fs = require('fs');
let c = fs.readFileSync('src/components/Formato911.jsx', 'utf8');

const anchor = 'V. ALUMNADO Y GRUPOS POR EDAD';
const anchorIdx = c.indexOf(anchor);

const sIdx = c.indexOf('<div className="overflow-x-auto">', anchorIdx);
const eIdx = c.indexOf('</div>', sIdx) + 6;

if (sIdx === -1 || eIdx === -1) {
  console.log("Could not find div");
  process.exit(1);
}

const newDiv = `<div className="overflow-x-auto">
              <table className="w-full text-xs text-center border-collapse border border-slate-300 min-w-[900px]">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-300 p-2">Grado / Sexo</th>
                    <th className="border border-slate-300 p-2">Menos 12</th>
                    <th className="border border-slate-300 p-2">12 años</th>
                    <th className="border border-slate-300 p-2">13 años</th>
                    <th className="border border-slate-300 p-2">14 años</th>
                    <th className="border border-slate-300 p-2">15 años</th>
                    <th className="border border-slate-300 p-2">16 años</th>
                    <th className="border border-slate-300 p-2">17 años</th>
                    <th className="border border-slate-300 p-2">18 o más</th>
                    <th className="border border-slate-300 p-2 bg-slate-100">Total</th>
                    <th className="border border-slate-300 p-2">Grupos</th>
                  </tr>
                </thead>
                <tbody>
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
                           <React.Fragment>
                             {totals.map((v, idx) => <td key={idx} className="border border-slate-300 p-2 font-bold">{v}</td>)}
                             <td className="border border-slate-300 p-2 bg-slate-100 font-bold">{grandTotal}</td>
                             <td className="border border-slate-300 p-2 font-bold">{tGrupos}</td>
                           </React.Fragment>
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
                          <React.Fragment>
                            {subArr.map((v, idx) => <td key={idx} className="border border-slate-300 p-2 font-bold">{v}</td>)}
                            <td className="border border-slate-300 p-2 bg-slate-100 font-bold">{sumTotal}</td>
                            <td className="border border-slate-300 p-2 font-bold">{calculosV1[row.g].grupos.size}</td>
                          </React.Fragment>
                        )
                      }
                      
                      // Normal row
                      const arr = calculosV1[row.g][row.key];
                      const rowTotal = arr.reduce((a,b)=>a+b, 0);
                      return (
                        <React.Fragment>
                          {arr.map((v, idx) => <td key={idx} className="border border-slate-300 p-2">{v}</td>)}
                          <td className="border border-slate-300 p-2 bg-slate-100">{rowTotal}</td>
                          <td className="border border-slate-300 p-2 bg-slate-200"></td>
                        </React.Fragment>
                      )
                    };

                    return (
                      <tr key={i} className={row.sub ? 'font-bold bg-slate-50' : ''}>
                        <td className="border border-slate-300 p-2 text-left">{row.label}</td>
                        {renderCells()}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>`;

c = c.substring(0, sIdx) + newDiv + c.substring(eIdx);
fs.writeFileSync('src/components/Formato911.jsx', c, 'utf8');
console.log('V1 INJECTED SAFELY!');
