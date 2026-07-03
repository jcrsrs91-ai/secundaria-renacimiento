const fs = require('fs');

let code = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');

const editStart = '{editingResguardo.articulos.map((art, idx) => (';
const editEnd = '                  </div>\n                </div>\n              <div className="flex justify-end';
const editEndAlt = '                  </div>\r\n                </div>\r\n              <div className="flex justify-end';

const formStart = '{formData.articulos.map((art, idx) => (';
const formEnd = '                  </div>\n                </div>\n\n              {modalOpen === ' + "'recepcion'";
const formEndAlt = '                  </div>\r\n                </div>\r\n\r\n              {modalOpen === ' + "'recepcion'";

const replaceBetween = (str, startStr, endStrs, replacement) => {
    const startIndex = str.indexOf(startStr);
    if (startIndex === -1) return str;
    
    let endIndex = -1;
    let matchingEndStr = '';
    for (const endStr of endStrs) {
        const afterStart = str.slice(startIndex + startStr.length);
        const idx = afterStart.indexOf(endStr);
        if (idx !== -1) {
            endIndex = idx;
            matchingEndStr = endStr;
            break;
        }
    }
    
    if (endIndex === -1) return str;
    
    const absoluteEndIndex = startIndex + startStr.length + endIndex;
    
    return str.substring(0, startIndex) + replacement + str.substring(absoluteEndIndex);
};

const newEditMap = `{editingResguardo.articulos.map((art, idx) => (
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

const newFormMap = `{formData.articulos.map((art, idx) => (
                      <div key={idx} className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="flex gap-2 items-center">
                          <div className="w-16">
                            <input type="number" placeholder="Cant" className="w-full rounded-md border-slate-300 text-sm" value={art.cantidad || ''} onChange={(e) => {
                              const newArts = [...formData.articulos];
                              newArts[idx].cantidad = e.target.value;
                              setFormData({...formData, articulos: newArts});
                            }} />
                          </div>
                          <div className="flex-1">
                            <input type="text" placeholder="Nombre/Concepto del artículo" className="w-full rounded-md border-slate-300 text-sm font-bold" value={art.descripcion || art.articulo || ''} onChange={(e) => {
                              const newArts = [...formData.articulos];
                              newArts[idx].descripcion = e.target.value;
                              setFormData({...formData, articulos: newArts});
                            }} />
                          </div>
                          
                          {modalOpen === 'recepcion' && (
                            <div className="w-1/4">
                              <input type="text" placeholder="Código Inic. (Ej: 1-A-1)" className="w-full rounded-md border-slate-300 text-sm font-bold text-indigo-600" value={art.codigo || ''} onChange={(e) => {
                                const newArts = [...formData.articulos];
                                newArts[idx].codigo = e.target.value;
                                setFormData({...formData, articulos: newArts});
                              }} title="El sistema generará los siguientes folios de forma consecutiva automáticamente." />
                            </div>
                          )}
                          {(modalOpen === 'resguardo' || modalOpen === 'baja') && (
                            <div className="w-1/4">
                              <input type="text" placeholder="Código Inventario" className="w-full rounded-md border-slate-300 text-sm" value={art.codigo || art.inventario || ''} onChange={(e) => {
                                const newArts = [...formData.articulos];
                                newArts[idx].codigo = e.target.value;
                                setFormData({...formData, articulos: newArts});
                              }} />
                            </div>
                          )}
                          
                          {modalOpen !== 'baja' && (
                            <button type="button" onClick={() => {
                              const newArts = formData.articulos.filter((_, i) => i !== idx);
                              setFormData({...formData, articulos: newArts.length ? newArts : [{}]});
                            }} className="p-2 text-slate-400 hover:text-red-500">
                              <X className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                        <div className="flex gap-2 items-center">
                           <div className="flex-1">
                              <input type="text" placeholder="Marca" className="w-full rounded-md border-slate-300 text-sm" value={art.marca || ''} onChange={(e) => {
                                const newArts = [...formData.articulos];
                                newArts[idx].marca = e.target.value;
                                setFormData({...formData, articulos: newArts});
                              }} />
                           </div>
                           <div className="flex-1">
                              <input type="text" placeholder="Modelo" className="w-full rounded-md border-slate-300 text-sm" value={art.modelo || ''} onChange={(e) => {
                                const newArts = [...formData.articulos];
                                newArts[idx].modelo = e.target.value;
                                setFormData({...formData, articulos: newArts});
                              }} />
                           </div>
                           <div className="flex-1">
                              <input type="text" placeholder="No. Serie" className="w-full rounded-md border-slate-300 text-sm" value={art.serie || ''} onChange={(e) => {
                                const newArts = [...formData.articulos];
                                newArts[idx].serie = e.target.value;
                                setFormData({...formData, articulos: newArts});
                              }} />
                           </div>
                           {modalOpen === 'baja' ? (
                             <div className="w-1/4">
                               <input type="text" placeholder="Ubicación" className="w-full rounded-md border-slate-300 text-sm" value={art.ubicacion || ''} onChange={(e) => {
                                 const newArts = [...formData.articulos];
                                 newArts[idx].ubicacion = e.target.value;
                                 setFormData({...formData, articulos: newArts});
                               }} />
                             </div>
                           ) : (
                             <div className="w-32">
                                <select 
                                  className="w-full rounded-md border border-slate-300 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 p-2" 
                                  value={art.estado || 'Bueno'} 
                                  onChange={(e) => {
                                    const newArts = [...formData.articulos];
                                    newArts[idx].estado = e.target.value;
                                    setFormData({...formData, articulos: newArts});
                                  }}
                                >
                                  <option value="Bueno">Bueno</option>
                                  <option value="Nuevo">Nuevo</option>
                                  <option value="Regular">Regular</option>
                                  <option value="Malo">Malo</option>
                                </select>
                             </div>
                           )}
                           <div className="flex-1">
                              <input type="text" placeholder="Observaciones" className="w-full rounded-md border-slate-300 text-sm" value={art.observaciones || ''} onChange={(e) => {
                                const newArts = [...formData.articulos];
                                newArts[idx].observaciones = e.target.value;
                                setFormData({...formData, articulos: newArts});
                              }} />
                           </div>
                        </div>
                      </div>
                    ))}
`;

let len = code.length;
code = replaceBetween(code, editStart, [editEnd, editEndAlt], newEditMap);
if (code.length !== len) {
    console.log("Updated editingResguardo");
} else {
    console.log("FAILED editingResguardo");
}

len = code.length;
code = replaceBetween(code, formStart, [formEnd, formEndAlt], newFormMap);
if (code.length !== len) {
    console.log("Updated formData");
} else {
    console.log("FAILED formData");
}

fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', code);
