const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');

const oldEditItem = `                      <input type="text" list="ubicaciones-list" value={editingItem.ubicacion || ''} onChange={e => setEditingItem({...editingItem, ubicacion: e.target.value})} className="w-full p-2 border rounded text-sm" />`;

const newEditItem = `                      {(() => {
                        const isKnown = uniqueUbicaciones.includes(editingItem.ubicacion);
                        const isCustom = !isKnown && editingItem.ubicacion !== '' && editingItem.ubicacion !== undefined && editingItem.ubicacion !== '---NUEVA---';
                        return (
                          <div className="space-y-2">
                            <select 
                              className="w-full p-2 border rounded text-sm"
                              value={isKnown ? editingItem.ubicacion : (editingItem.ubicacion === '---NUEVA---' || isCustom ? '---NUEVA---' : '')}
                              onChange={e => setEditingItem({...editingItem, ubicacion: e.target.value})}
                            >
                              <option value="">Selecciona una ubicación...</option>
                              {uniqueUbicaciones.map(ub => (
                                <option key={ub} value={ub}>{ub}</option>
                              ))}
                              <option value="---NUEVA---">➕ Agregar nueva área...</option>
                            </select>
                            {(editingItem.ubicacion === '---NUEVA---' || isCustom) && (
                              <input 
                                type="text" 
                                placeholder="Escribe el nombre de la nueva área..." 
                                value={editingItem.ubicacion === '---NUEVA---' ? '' : (editingItem.ubicacion || '')}
                                onChange={e => setEditingItem({...editingItem, ubicacion: e.target.value})}
                                className="w-full p-2 border rounded text-sm border-indigo-400 focus:ring-1 focus:ring-indigo-500 bg-indigo-50"
                                autoFocus
                              />
                            )}
                          </div>
                        );
                      })()}`;

code = code.replace(oldEditItem, newEditItem);

const oldResguardoItem = `                                <input type="text" list="ubicaciones-list" placeholder="Ubicación" className="w-full rounded-md border-slate-300 text-sm" value={art.ubicacion || ''} onChange={(e) => { const newArts = [...formData.articulos]; newArts[idx].ubicacion = e.target.value; setFormData({...formData, articulos: newArts}); }} />`;

const newResguardoItem = `                                {(() => {
                                  const isKnown = uniqueUbicaciones.includes(art.ubicacion);
                                  const isCustom = !isKnown && art.ubicacion !== '' && art.ubicacion !== undefined && art.ubicacion !== '---NUEVA---';
                                  return (
                                    <div className="space-y-1">
                                      <select 
                                        className="w-full rounded-md border-slate-300 text-sm py-1"
                                        value={isKnown ? art.ubicacion : (art.ubicacion === '---NUEVA---' || isCustom ? '---NUEVA---' : '')}
                                        onChange={(e) => { const newArts = [...formData.articulos]; newArts[idx].ubicacion = e.target.value; setFormData({...formData, articulos: newArts}); }}
                                      >
                                        <option value="">Ubicación...</option>
                                        {uniqueUbicaciones.map(ub => <option key={ub} value={ub}>{ub}</option>)}
                                        <option value="---NUEVA---">➕ Nueva...</option>
                                      </select>
                                      {(art.ubicacion === '---NUEVA---' || isCustom) && (
                                        <input 
                                          type="text" 
                                          placeholder="Nombre del área..." 
                                          value={art.ubicacion === '---NUEVA---' ? '' : (art.ubicacion || '')}
                                          onChange={(e) => { const newArts = [...formData.articulos]; newArts[idx].ubicacion = e.target.value; setFormData({...formData, articulos: newArts}); }}
                                          className="w-full p-1 border rounded text-sm border-indigo-400 bg-indigo-50"
                                          autoFocus
                                        />
                                      )}
                                    </div>
                                  );
                                })()}`;

code = code.replace(oldResguardoItem, newResguardoItem);

fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', code);
console.log('UI updated.');
