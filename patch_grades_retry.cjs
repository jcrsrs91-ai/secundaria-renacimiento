const fs = require('fs');

let file = fs.readFileSync('src/components/HojaDeVida.jsx', 'utf8');

const targetIndex = file.indexOf('            </div>\\n          )}\\n        </div>');
// Wait, regex is safer.
const parts = file.split('            </div>\r\n          )}\r\n        </div>');
if (parts.length === 1) {
    const partsLF = file.split('            </div>\n          )}\n        </div>');
    if (partsLF.length === 1) {
        console.log("NOT FOUND!");
        process.exit(1);
    }
}

const replacement = `            </div>

              {/* 6. Boleta de Calificaciones (Solo Lectura) */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mt-6">
                <div className="flex items-center mb-6 border-b pb-3">
                  <h4 className="font-bold text-xl text-slate-800">Historial Académico y Calificaciones</h4>
                </div>

                {/* Ciclo Actual */}
                <div className="mb-8">
                  <h5 className="font-bold text-lg text-slate-700 mb-4 bg-slate-100 p-2 rounded">Ciclo Actual ({student.grado})</h5>
                  {(() => {
                    const materias = materiasPorGrado[student.grado] || [];
                    if (materias.length === 0) return <p className="text-sm text-slate-500">No hay materias configuradas para este grado.</p>;
                    
                    const califs = student.calificaciones || {};
                    let sumT1 = 0, sumT2 = 0, sumT3 = 0;
                    let countT1 = 0, countT2 = 0, countT3 = 0;
                    let hasReprobada = false;

                    // First pass to check reprobadas
                    materias.forEach(mat => {
                      const t1 = califs['T1']?.[mat.id];
                      const t2 = califs['T2']?.[mat.id];
                      const t3 = califs['T3']?.[mat.id];
                      if (t1 !== undefined && Number(t1) < 6) hasReprobada = true;
                      if (t2 !== undefined && Number(t2) < 6) hasReprobada = true;
                      if (t3 !== undefined && Number(t3) < 6) hasReprobada = true;
                    });

                    const renderCell = (val) => {
                      if (val === undefined || val === null || val === '') return '-';
                      const num = Number(val);
                      return <span className={num < 6 ? 'text-rose-600 font-bold bg-rose-50 px-2 py-1 rounded' : ''}>{num.toFixed(1)}</span>;
                    };

                    return (
                      <>
                        {hasReprobada && (
                          <div className="mb-4 bg-rose-100 text-rose-800 p-3 rounded-lg text-sm font-semibold flex items-center border border-rose-200">
                            <span className="mr-2 text-xl">⚠️</span> Este alumno tiene calificaciones reprobadas (menores a 6.0) en el ciclo actual.
                          </div>
                        )}
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50">
                                <th className="border p-3 font-semibold text-slate-600">Materia</th>
                                <th className="border p-3 text-center font-semibold text-slate-600 w-24">T1</th>
                                <th className="border p-3 text-center font-semibold text-slate-600 w-24">T2</th>
                                <th className="border p-3 text-center font-semibold text-slate-600 w-24">T3</th>
                                <th className="border p-3 text-center font-bold text-slate-700 w-24 bg-slate-100">Final</th>
                              </tr>
                            </thead>
                            <tbody>
                              {materias.map(mat => {
                                const t1 = califs['T1']?.[mat.id];
                                const t2 = califs['T2']?.[mat.id];
                                const t3 = califs['T3']?.[mat.id];
                                
                                if (t1 !== undefined) { sumT1 += Number(t1); countT1++; }
                                if (t2 !== undefined) { sumT2 += Number(t2); countT2++; }
                                if (t3 !== undefined) { sumT3 += Number(t3); countT3++; }

                                let promedioFinal = '-';
                                let numProm = 0;
                                let countProm = 0;
                                if (t1 !== undefined) { numProm += Number(t1); countProm++; }
                                if (t2 !== undefined) { numProm += Number(t2); countProm++; }
                                if (t3 !== undefined) { numProm += Number(t3); countProm++; }
                                
                                if (countProm > 0) {
                                  promedioFinal = (numProm / countProm).toFixed(1);
                                }

                                return (
                                  <tr key={mat.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="border p-3 text-slate-700 font-medium">{mat.name}</td>
                                    <td className="border p-3 text-center">{renderCell(t1)}</td>
                                    <td className="border p-3 text-center">{renderCell(t2)}</td>
                                    <td className="border p-3 text-center">{renderCell(t3)}</td>
                                    <td className="border p-3 text-center bg-slate-50">{renderCell(promedioFinal !== '-' ? promedioFinal : undefined)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot>
                              <tr className="bg-slate-100 font-bold">
                                <td className="border p-3 text-right">PROMEDIO GENERAL</td>
                                <td className="border p-3 text-center text-primary-700">{countT1 > 0 ? renderCell((sumT1 / countT1)) : '-'}</td>
                                <td className="border p-3 text-center text-primary-700">{countT2 > 0 ? renderCell((sumT2 / countT2)) : '-'}</td>
                                <td className="border p-3 text-center text-primary-700">{countT3 > 0 ? renderCell((sumT3 / countT3)) : '-'}</td>
                                <td className="border p-3 text-center text-emerald-700 bg-emerald-50">
                                  {countT1 > 0 || countT2 > 0 || countT3 > 0 ? renderCell(((sumT1 + sumT2 + sumT3) / (countT1 + countT2 + countT3))) : '-'}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Historial Años Anteriores */}
                {['1er Grado', '2do Grado', '3er Grado'].map(gradoKey => {
                  if (gradoKey === student.grado) return null; // Ya se muestra arriba
                  if (student.grado === '1er Grado') return null;
                  if (student.grado === '2do Grado' && gradoKey === '3er Grado') return null;
                  
                  const materias = materiasPorGrado[gradoKey] || [];
                  if (materias.length === 0) return null;
                  const hist = student.historial?.[gradoKey] || {};
                  
                  // Verificar si tiene al menos una calificacion
                  const hasAnyGrade = materias.some(mat => hist[mat.id]?.t1 || hist[mat.id]?.t2 || hist[mat.id]?.t3);
                  if (!hasAnyGrade) return null;

                  return (
                    <div key={gradoKey} className="mb-8">
                      <h5 className="font-bold text-lg text-slate-700 mb-4 bg-slate-50 border p-2 rounded">Kárdex Anterior ({gradoKey})</h5>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50">
                              <th className="border p-2 font-semibold text-slate-600">Materia</th>
                              <th className="border p-2 text-center font-semibold text-slate-600 w-20">T1</th>
                              <th className="border p-2 text-center font-semibold text-slate-600 w-20">T2</th>
                              <th className="border p-2 text-center font-semibold text-slate-600 w-20">T3</th>
                              <th className="border p-2 text-center font-bold text-slate-700 w-20 bg-slate-100">Final</th>
                            </tr>
                          </thead>
                          <tbody>
                            {materias.map(mat => {
                              const t1 = hist[mat.id]?.t1;
                              const t2 = hist[mat.id]?.t2;
                              const t3 = hist[mat.id]?.t3;
                              
                              let numProm = 0;
                              let countProm = 0;
                              if (t1 !== undefined && t1 !== '') { numProm += Number(t1); countProm++; }
                              if (t2 !== undefined && t2 !== '') { numProm += Number(t2); countProm++; }
                              if (t3 !== undefined && t3 !== '') { numProm += Number(t3); countProm++; }
                              
                              const promedioFinal = countProm > 0 ? (numProm / countProm).toFixed(1) : '-';

                              const renderCell = (val) => {
                                if (val === undefined || val === null || val === '') return '-';
                                const num = Number(val);
                                return <span className={num < 6 ? 'text-rose-600 font-bold bg-rose-50 px-1 rounded' : ''}>{num.toFixed(1)}</span>;
                              };

                              return (
                                <tr key={mat.id} className="hover:bg-slate-50">
                                  <td className="border p-2 text-slate-700">{mat.name}</td>
                                  <td className="border p-2 text-center">{renderCell(t1)}</td>
                                  <td className="border p-2 text-center">{renderCell(t2)}</td>
                                  <td className="border p-2 text-center">{renderCell(t3)}</td>
                                  <td className="border p-2 text-center bg-slate-50 font-medium">{renderCell(promedioFinal !== '-' ? promedioFinal : undefined)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>`;

const finalFile = file.replace(/            <\/div>\r?\n          \)}\r?\n        <\/div>/, replacement);

fs.writeFileSync('src/components/HojaDeVida.jsx', finalFile);
console.log('HojaDeVida properly patched.');
