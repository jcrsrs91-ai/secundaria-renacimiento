const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');

const targetStr = `                           <div className="flex-1">
                              <input type="text" placeholder="Observaciones" className="w-full rounded-md border-slate-300 text-sm" value={art.observaciones || ''} onChange={(e) => {
                                const newArts = [...formData.articulos];
                                newArts[idx].observaciones = e.target.value;
                                setFormData({...formData, articulos: newArts});
                              }} />
                           </div>
                        </div>
                      </div>
                    ))}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">`;

const replacementStr = `                           <div className="flex-1">
                              <input type="text" placeholder="Observaciones" className="w-full rounded-md border-slate-300 text-sm" value={art.observaciones || ''} onChange={(e) => {
                                const newArts = [...formData.articulos];
                                newArts[idx].observaciones = e.target.value;
                                setFormData({...formData, articulos: newArts});
                              }} />
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, replacementStr);
    fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', code);
    console.log('Fixed missing divs!');
} else {
    console.log('Target string for missing divs not found again!');
}
