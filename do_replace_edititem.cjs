const fs = require('fs');

let code = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');
const lines = code.split(/\r?\n/);

const newEditItemLines = `            {modalOpen === 'editItem' && editingItem ? (
              <form onSubmit={handleSaveEdit}>
                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Código de Inventario</label>
                      <input type="text" value={editingItem.codigo || ''} onChange={e => setEditingItem({...editingItem, codigo: e.target.value})} className="w-full p-2 border rounded font-mono text-sm bg-slate-50" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nombre / Concepto del artículo</label>
                      <input type="text" value={editingItem.articulo || editingItem.descripcion || ''} onChange={e => setEditingItem({...editingItem, articulo: e.target.value, descripcion: e.target.value})} className="w-full p-2 border rounded text-sm" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Marca</label>
                      <input type="text" value={editingItem.marca || ''} onChange={e => setEditingItem({...editingItem, marca: e.target.value})} className="w-full p-2 border rounded text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Modelo</label>
                      <input type="text" value={editingItem.modelo || ''} onChange={e => setEditingItem({...editingItem, modelo: e.target.value})} className="w-full p-2 border rounded text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">No. Serie</label>
                      <input type="text" value={editingItem.serie || ''} onChange={e => setEditingItem({...editingItem, serie: e.target.value})} className="w-full p-2 border rounded text-sm" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad</label>
                      <input type="number" value={editingItem.cantidad || ''} onChange={e => setEditingItem({...editingItem, cantidad: e.target.value})} className="w-full p-2 border rounded text-sm" />
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
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Ubicación Actual</label>
                      <input type="text" value={editingItem.ubicacion || ''} onChange={e => setEditingItem({...editingItem, ubicacion: e.target.value})} className="w-full p-2 border rounded text-sm" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones</label>
                    <input type="text" value={editingItem.observaciones || ''} onChange={e => setEditingItem({...editingItem, observaciones: e.target.value})} className="w-full p-2 border rounded text-sm" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button type="button" onClick={() => { setModalOpen(null); setEditingItem(null); }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancelar</button>
                  <button type="submit" className="px-6 py-2 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 shadow-sm">Guardar Cambios</button>
                </div>
              </form>`.split('\n');

let newLines = [];
let i = 0;
while (i < lines.length) {
    if (i === 1612) {
        newLines.push(...newEditItemLines);
        i = 1651 + 1;
    } else {
        newLines.push(lines[i]);
        i++;
    }
}

fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', newLines.join('\n'));
console.log('Successfully written via exact array indices for editItem');
