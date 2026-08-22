const fs = require('fs');

let c = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');

// Replace the tbody of the Gastos tab
const targetTbody = `<tbody className="divide-y divide-slate-200">
                {filteredPagos.map(p => (
                  <tr key={p.id}>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{p.folio}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600 font-bold">{p.alumno}</div>
                      <div className="text-xs text-slate-500">{p.grado !== 'N/A' ? \`\${p.grado} - Grupo \${p.grupo}\` : 'Sin grado/grupo asignado'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{p.concepto}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">{p.monto}</td>
                    <td className="px-6 py-4 text-sm">
                      {p.estado === 'Pagado' ? (
                        <span className="text-emerald-600 flex items-center font-bold">
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Pagado el {p.fecha}
                        </span>
                      ) : (`;
                      
// I will just use regex to replace everything between `activeTab === 'gastos'`'s `<tbody>` and `</tbody>`.
const regex = /(<thead className="bg-slate-50">[\s\S]*?<\/thead>\s*)<tbody[\s\S]*?<\/tbody>/;
const replacement = `$1<tbody className="divide-y divide-slate-200">
                {gastos.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-8 text-slate-500">No hay egresos registrados en este turno.</td></tr>
                ) : gastos.map(g => (
                  <tr key={g.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-mono text-slate-600">{g.id.substring(0, 8).toUpperCase()}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-800">{g.concepto}</div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-800 mt-1">
                        {g.categoria}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-rose-600 font-mono">-$ {parseFloat(g.monto).toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{g.registradoPor}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-700">{cajaTurno?.turno || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{new Date(g.fecha).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>`;
              
c = c.replace(regex, replacement);
fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', c);
console.log('Fixed Gastos table');
