const fs = require('fs');

let code = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');

const newEditMap = `                    {editingResguardo.articulos.map((art, idx) => (
                      <div key={idx} className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="flex gap-2 items-center">
                          <div className="w-16">
                            <input type="number" placeholder="Cant" className="w-full rounded-md border-slate-300 text-sm" value={art.cantidad || ''} onChange={(e) => {
                              const newArts = [...editingResguardo.articulos];
                              newArts[idx].cantidad = e.target.value;
                              setEditingResguardo({...editingResguardo, articulos: newArts});
                            }} />
                          </div>
                          <div className="flex-1">
                            <input type="text" placeholder="Nombre/Concepto del artículo" className="w-full rounded-md border-slate-300 text-sm font-bold" value={art.descripcion || art.articulo || ''} onChange={(e) => {
                              const newArts = [...editingResguardo.articulos];
                              newArts[idx].descripcion = e.target.value;
                              setEditingResguardo({...editingResguardo, articulos: newArts});
                            }} />
                          </div>
                          <div className="w-1/4">
                            <input type="text" placeholder="Código Inventario" className="w-full rounded-md border-slate-300 text-sm" value={art.codigo || art.inventario || ''} onChange={(e) => {
                              const newArts = [...editingResguardo.articulos];
                              newArts[idx].codigo = e.target.value;
                              setEditingResguardo({...editingResguardo, articulos: newArts});
                            }} />
                          </div>
                          <button type="button" onClick={() => {
                            const newArts = editingResguardo.articulos.filter((_, i) => i !== idx);
                            setEditingResguardo({...editingResguardo, articulos: newArts.length ? newArts : [{}]});
                          }} className="p-2 text-slate-400 hover:text-red-500">
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="flex gap-2 items-center">
                           <div className="flex-1">
                              <input type="text" placeholder="Marca" className="w-full rounded-md border-slate-300 text-sm" value={art.marca || ''} onChange={(e) => {
                                const newArts = [...editingResguardo.articulos];
                                newArts[idx].marca = e.target.value;
                                setEditingResguardo({...editingResguardo, articulos: newArts});
                              }} />
                           </div>
                           <div className="flex-1">
                              <input type="text" placeholder="Modelo" className="w-full rounded-md border-slate-300 text-sm" value={art.modelo || ''} onChange={(e) => {
                                const newArts = [...editingResguardo.articulos];
                                newArts[idx].modelo = e.target.value;
                                setEditingResguardo({...editingResguardo, articulos: newArts});
                              }} />
                           </div>
                           <div className="flex-1">
                              <input type="text" placeholder="No. Serie" className="w-full rounded-md border-slate-300 text-sm" value={art.serie || ''} onChange={(e) => {
                                const newArts = [...editingResguardo.articulos];
                                newArts[idx].serie = e.target.value;
                                setEditingResguardo({...editingResguardo, articulos: newArts});
                              }} />
                           </div>
                           <div className="w-32">
                              <select 
                                className="w-full rounded-md border border-slate-300 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 p-2" 
                                value={art.estado || 'Bueno'} 
                                onChange={(e) => {
                                  const newArts = [...editingResguardo.articulos];
                                  newArts[idx].estado = e.target.value;
                                  setEditingResguardo({...editingResguardo, articulos: newArts});
                                }}
                              >
                                <option value="Bueno">Bueno</option>
                                <option value="Nuevo">Nuevo</option>
                                <option value="Regular">Regular</option>
                                <option value="Malo">Malo</option>
                              </select>
                           </div>
                           <div className="flex-1">
                              <input type="text" placeholder="Observaciones" className="w-full rounded-md border-slate-300 text-sm" value={art.observaciones || ''} onChange={(e) => {
                                const newArts = [...editingResguardo.articulos];
                                newArts[idx].observaciones = e.target.value;
                                setEditingResguardo({...editingResguardo, articulos: newArts});
                              }} />
                           </div>
                        </div>
                      </div>
                    ))}
`;

const lines = code.split(/\\r?\\n/);
lines.splice(1685, 1732 - 1686 + 1, newEditMap);
code = lines.join('\\n');
fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', code);
console.log('Successfully updated editingResguardo array');
