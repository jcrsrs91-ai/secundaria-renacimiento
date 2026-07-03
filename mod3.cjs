const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');
let lines = code.split('\n');

const chunk = `                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre / Concepto</label>
                    <input type="text" value={editingItem.articulo || editingItem.descripcion || ''} onChange={e => setEditingItem({...editingItem, articulo: e.target.value})} className="w-full p-2 border rounded" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Marca</label>
                      <input type="text" value={editingItem.marca || ''} onChange={e => setEditingItem({...editingItem, marca: e.target.value})} className="w-full p-2 border rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Modelo</label>
                      <input type="text" value={editingItem.modelo || ''} onChange={e => setEditingItem({...editingItem, modelo: e.target.value})} className="w-full p-2 border rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">No. Serie</label>
                      <input type="text" value={editingItem.serie || ''} onChange={e => setEditingItem({...editingItem, serie: e.target.value})} className="w-full p-2 border rounded" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad</label>
                      <input type="number" value={editingItem.cantidad || 1} onChange={e => setEditingItem({...editingItem, cantidad: e.target.value})} className="w-full p-2 border rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Estado Físico</label>
                      <select 
                        value={editingItem.estado || 'Bueno'} 
                        onChange={e => setEditingItem({...editingItem, estado: e.target.value})} 
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="Nuevo">Nuevo</option>
                        <option value="Bueno">Bueno</option>
                        <option value="Regular">Regular</option>
                        <option value="Malo">Malo</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones</label>
                    <textarea rows="2" value={editingItem.observaciones || ''} onChange={e => setEditingItem({...editingItem, observaciones: e.target.value})} className="w-full p-2 border rounded" placeholder="Daños visibles, características, etc."></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ubicación Actual</label>
                    <input type="text" value={editingItem.ubicacion || ''} onChange={e => setEditingItem({...editingItem, ubicacion: e.target.value})} className="w-full p-2 border rounded" />
                  </div>`;

// Replace chunk from 1630 to 1656
lines.splice(1629, 1656 - 1630 + 1, chunk);

fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', lines.join('\n'));
console.log('Edit modal updated successfully.');
