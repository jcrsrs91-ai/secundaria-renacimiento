const fs = require('fs');
const path = 'src/pages/dashboard/AvisosEscolares.jsx';
let c = fs.readFileSync(path, 'utf8');

const targetStr = `              </div>
              <div className="pt-4 flex justify-end space-x-3">`;

const replaceStr = `              </div>
              <div className="pt-2 border-t border-slate-100 mt-2">
                <label className="block text-sm font-medium text-slate-700 mb-2 mt-4">Adjuntar Flyer o Imagen (Opcional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                {editingAviso?.imageUrl && !imageFile && (
                  <p className="mt-2 text-xs text-slate-400">El aviso actual ya tiene una imagen adjunta. Si subes una nueva, se reemplazará la anterior.</p>
                )}
              </div>
              <div className="pt-4 flex justify-end space-x-3 mt-4">`;

c = c.replace(targetStr, replaceStr);

fs.writeFileSync(path, c);
