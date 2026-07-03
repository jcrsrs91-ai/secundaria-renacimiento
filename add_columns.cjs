const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');

const oldThead = `<th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Artículo</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Ubicación</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Cantidad</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Acciones</th>`;

const newThead = `<th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Artículo</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Marca / Modelo</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">No. Serie</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Ubicación</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Cantidad</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Acciones</th>`;

const oldTbody = `<td className="px-6 py-4 text-sm text-slate-600">
                        <div className="font-semibold text-slate-800">{item.articulo}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {[item.marca, item.modelo, item.serie && \`S/N: \${item.serie}\`].filter(Boolean).join(' • ')}
                        </div>
                        {item.observaciones && <div className="text-[10px] italic text-slate-400 mt-0.5 text-justify leading-tight">{item.observaciones}</div>}
                      </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{item.ubicacion}</td>`;

const newTbody = `<td className="px-6 py-4 text-sm text-slate-600">
                        <div className="font-semibold text-slate-800">{item.articulo}</div>
                        {item.observaciones && <div className="text-[10px] italic text-slate-400 mt-0.5 text-justify leading-tight">{item.observaciones}</div>}
                      </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                        <div className="text-slate-800">{item.marca || '-'}</div>
                        {item.modelo && <div className="text-[11px] text-slate-500">{item.modelo}</div>}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-mono text-xs">{item.serie || '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{item.ubicacion}</td>`;

// Also update the colspan when it's empty
const oldEmpty = `<td colSpan="7" className="px-6 py-10 text-center text-slate-500">No hay artículos registrados en el inventario que coincidan con los filtros.</td>`;
const newEmpty = `<td colSpan="9" className="px-6 py-10 text-center text-slate-500">No hay artículos registrados en el inventario que coincidan con los filtros.</td>`;

code = code.replace(oldThead, newThead);
code = code.replace(oldTbody, newTbody);
code = code.replace(oldEmpty, newEmpty);

fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', code);
console.log('Update Complete.');
