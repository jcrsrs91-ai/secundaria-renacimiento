const fs = require('fs');

let c = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');

// 1. Fix the Pagos / Ingresos table (lines ~1630)
const pagosTableFind = `<td className="px-6 py-4 text-sm">
                      <span className="text-emerald-600 flex items-center font-bold bg-emerald-50 w-max px-2 py-1 rounded-md">
                        <CheckCircle2 className="w-4 h-4 mr-1" /> 
                        Pagado: {p.pagoFecha?.toDate ? p.pagoFecha.toDate().toLocaleDateString() : new Date(p.pagoFecha || Date.now()).toLocaleDateString()}
                      </span>
                    </td>`;

const pagosTableReplace = `<td className="px-6 py-4 text-sm">
                      {p.tipoIngreso === 'manual' || p.estado === 'Pagado' ? (
                        <span className="text-emerald-600 flex items-center font-bold bg-emerald-50 w-max px-2 py-1 rounded-md">
                          <CheckCircle2 className="w-4 h-4 mr-1" /> 
                          {p.tipoIngreso === 'manual' ? 'Pagado: ' + new Date(p.pagoFecha || Date.now()).toLocaleDateString() : 'Pagado el ' + p.fecha}
                        </span>
                      ) : (
                        <button 
                          onClick={() => registrarCobro(p.id)}
                          className="px-3 py-1 bg-primary-600 text-white rounded-md text-xs font-bold hover:bg-primary-700 shadow-sm"
                        >
                          Registrar Cobro
                        </button>
                      )}
                    </td>`;

c = c.replace(pagosTableFind, pagosTableReplace);

// 2. Fix the Gastos table
const gastosTbodyFind = `<tbody className="divide-y divide-slate-200">
                {pagosRecientes.map(p => (
                  <tr key={p.id}>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{p.folio}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-bold">{p.alumno}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{p.concepto}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">{p.monto}</td>
                    <td className="px-6 py-4 text-sm">
                      {p.estado === 'Pagado' ? (
                        <span className="text-emerald-600 flex items-center font-bold">
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Pagado el {p.fecha}
                        </span>
                      ) : (
                        <button 
                          onClick={() => registrarCobro(p.id)}
                          className="px-3 py-1 bg-primary-600 text-white rounded-md text-xs font-bold hover:bg-primary-700 shadow-sm"
                        >
                          Registrar Cobro
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>`;

const gastosTbodyReplace = `<tbody className="divide-y divide-slate-200">
                {gastos.map((g, i) => (
                  <tr key={g.id || i} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{g.id ? g.id.slice(0,6).toUpperCase() : 'GST-'+i}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">{g.concepto}</td>
                    <td className="px-6 py-4 text-sm font-bold text-rose-600">\${Number(g.monto).toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{g.responsable || 'Admin'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{g.turno || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{g.fecha ? new Date(g.fecha).toLocaleDateString() : new Date().toLocaleDateString()}</td>
                  </tr>
                ))}
                {gastos.length === 0 && (
                  <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">No hay gastos registrados.</td></tr>
                )}
              </tbody>`;

c = c.replace(gastosTbodyFind, gastosTbodyReplace);

fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', c);
console.log('Tables fixed!');
