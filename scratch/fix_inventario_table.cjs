const fs = require('fs');
const path = 'src/pages/dashboard/Contraloria.jsx';
let c = fs.readFileSync(path, 'utf8');

const inventarioTableHeaders = `<th className="px-6 py-3 text-left w-12">`;
const indexOfInventario = c.indexOf(inventarioTableHeaders);

if (indexOfInventario !== -1) {
    const tbodyStart = c.indexOf('<tbody', indexOfInventario);
    const tbodyEnd = c.indexOf('</tbody>', tbodyStart) + 8;
    
    const newTbody = `              <tbody className="divide-y divide-slate-200">
                {filteredInventario.length > 0 ? filteredInventario.map(item => (
                  <tr key={item.id} className={selectedItems.includes(item.id) ? 'bg-indigo-50/50' : 'hover:bg-slate-50 transition-colors'}>
                    <td className="px-6 py-4 text-left w-12">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => toggleSelectItem(item.id)}
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-600">{item.codigo || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-slate-800 font-medium">{item.articulo || item.descripcion || 'Sin nombre'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.marca || 'N/A'} {item.modelo ? \`(\${item.modelo})\` : ''}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.serie || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium border border-slate-200">
                        {item.ubicacion || 'Sin ubicar'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-800">{item.cantidad || 0}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={\`px-2 py-1 rounded text-xs font-bold \${item.estadoFisico === 'Nuevo' || item.estado === 'Nuevo' ? 'bg-emerald-100 text-emerald-700' : item.estadoFisico === 'Malo' || item.estado === 'Malo' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}\`}>
                        {item.estadoFisico || item.estado || 'Bueno'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right space-x-2">
                        <button 
                          onClick={() => { setEditingItem(item); setModalOpen('editItem'); }}
                          className="text-primary-600 hover:text-primary-800 font-medium text-xs"
                        >
                          Editar
                        </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="9" className="px-6 py-8 text-center text-slate-500 italic">No se encontraron artículos en el inventario que coincidan con la búsqueda.</td>
                  </tr>
                )}
              </tbody>`;
              
    c = c.substring(0, tbodyStart) + newTbody + c.substring(tbodyEnd);
    fs.writeFileSync(path, c);
    console.log("Inventario tbody fixed successfully.");
} else {
    console.log("Could not find inventario table.");
}
