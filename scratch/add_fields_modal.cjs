const fs = require('fs');

function modifyFile(filepath) {
    let c = fs.readFileSync(filepath, 'utf8');

    // 1. Usaer and Primaria
    // Find where Beca is. It's around line 230.
    const becaOld = `<div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">¿Cuenta con Beca?</label>
              <select name="tieneBeca" value={formData.tieneBeca} onChange={e => setFormData({...formData, tieneBeca: e.target.value === 'true'})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white">
                <option value="false">NO</option>
                <option value="true">SÍ</option>
              </select>
            </div>
            {formData.tieneBeca && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre de la Beca</label>
                <input type="text" name="nombreBeca" value={formData.nombreBeca || ''} onChange={handleChange} placeholder="Ej. Beca Benito Juárez" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
            )}`;

    const becaNew = `<div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">¿Cuenta con Beca?</label>
              <select name="tieneBeca" value={formData.tieneBeca} onChange={e => setFormData({...formData, tieneBeca: e.target.value === 'true'})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white">
                <option value="false">NO</option>
                <option value="true">SÍ</option>
              </select>
            </div>
            {formData.tieneBeca && (
              <>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Origen de la Beca</label>
                <select name="origenBeca" value={formData.origenBeca || 'Beca Rita Cetina (Federal)'} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white">
                  <option>Beca Rita Cetina (Federal)</option>
                  <option>Otra beca federal</option>
                  <option>Beca estatal</option>
                  <option>Beca municipal</option>
                  <option>Beca de fundaciones y asociaciones civiles</option>
                  <option>Beca particular</option>
                  <option>Beca de la propia escuela</option>
                  <option>Otra / No especificada</option>
                </select>
              </div>
              {(formData.origenBeca === 'Otra beca federal' || formData.origenBeca === 'Otra / No especificada' || !formData.origenBeca) && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Especificar Beca</label>
                  <input type="text" name="nombreBeca" value={formData.nombreBeca || ''} onChange={handleChange} placeholder="Nombre de la beca" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
              )}
              </>
            )}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">USAER</label>
              <select name="usaer" value={formData.usaer || 'NO'} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white">
                <option>NO</option>
                <option>SÍ</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Primaria de procedencia</label>
              <select name="tipoPrimaria" value={formData.tipoPrimaria || 'Primaria General'} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white">
                <option>Primaria General</option>
                <option>Primaria Indígena</option>
                <option>Cursos Comunitarios (CONAFE)</option>
                <option>Primaria Particular</option>
                <option>Otra</option>
              </select>
            </div>`;

    c = c.replace(becaOld, becaNew);

    fs.writeFileSync(filepath, c, 'utf8');
}

modifyFile('src/components/AddStudentModal.jsx');
console.log('Modified AddStudentModal');
