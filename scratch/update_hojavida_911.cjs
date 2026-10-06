const fs = require('fs');
let content = fs.readFileSync('src/components/HojaDeVida.jsx', 'utf8');

// --- 1. EDIT MODE ---

// Add Nacionalidad & Lengua to Edit Mode (Personal Info)
const editPersonalInfo = `                      <div>
                        <label className="block text-xs font-medium text-slate-500">Fecha de Nacimiento</label>
                        <input type="date" name="fechaNacimiento" defaultValue={student.fechaNacimiento} className="mt-1 w-full p-2 border rounded" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500">Nacionalidad</label>
                        <select name="nacionalidad" defaultValue={student.nacionalidad || 'MEXICANA'} className="mt-1 w-full p-2 border rounded">
                          <option value="MEXICANA">Mexicana</option>
                          <option value="EXTRANJERA">Extranjera</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500">Lengua Indígena</label>
                        <select name="lenguaIndigena" defaultValue={student.lenguaIndigena || 'NO'} className="mt-1 w-full p-2 border rounded">
                          <option value="NO">NO</option>
                          <option value="SÍ">SÍ</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500">¿Cuál lengua?</label>
                        <input type="text" name="nombreLenguaIndigena" defaultValue={student.nombreLenguaIndigena} placeholder="Si aplica..." className="mt-1 w-full p-2 border rounded" />
                      </div>`;

content = content.replace(
  /<div>\s*<label[^>]+>Fecha de Nacimiento<\/label>\s*<input type="date"[^>]+>\s*<\/div>/,
  editPersonalInfo
);

// Add Discapacidad to Edit Mode (Salud)
const editSalud = `                      <div>
                        <label className="block text-xs font-medium text-slate-500">Discapacidad (911)</label>
                        <select name="discapacidad" defaultValue={student.discapacidad || 'Ninguna'} className="mt-1 w-full p-2 border rounded">
                          <option>Ninguna</option>
                          <option>Ceguera</option>
                          <option>Baja visión</option>
                          <option>Sordera</option>
                          <option>Hipoacusia</option>
                          <option>Sordoceguera</option>
                          <option>Discapacidad motriz</option>
                          <option>Discapacidad intelectual</option>
                          <option>Discapacidad psicosocial</option>
                          <option>Discapacidad múltiple</option>
                          <option>Trastorno del Espectro Autista (TEA)</option>
                          <option>Trastorno por Déficit de Atención (TDAH)</option>
                          <option>Aptitudes Sobresalientes</option>
                        </select>
                      </div>`;

content = content.replace(
  /<div className="md:col-span-2">\s*<label[^>]+>Alergias<\/label>/,
  `${editSalud}\n                      <div className="md:col-span-2">\n                        <label className="block text-xs font-medium text-slate-500">Alergias</label>`
);


// --- 2. READ-ONLY MODE ---

// Add Nacionalidad & Lengua to Read-Only Mode
const readPersonalInfo = `                      <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Fecha Nacimiento</span><span className="font-bold text-slate-700">{student.fechaNacimiento}</span></div>
                      <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Nacionalidad</span><span className="font-bold text-slate-700">{student.nacionalidad || 'MEXICANA'}</span></div>
                      <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Lengua Indígena</span><span className="font-bold text-slate-700">{student.lenguaIndigena === 'SÍ' ? \`SÍ (\${student.nombreLenguaIndigena || 'Especificada'})\` : 'NO'}</span></div>`;

content = content.replace(
  /<div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Fecha Nacimiento<\/span><span className="font-bold text-slate-700">\{student\.fechaNacimiento\}<\/span><\/div>/,
  readPersonalInfo
);

// Add Discapacidad to Read-Only Mode (Ficha Médica)
// We need to find the specific block for Ficha Médica inside read-only mode.
// We can just find Usa Lentes and inject it after.
const readSalud = `                      <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Usa Lentes</span><span className="font-bold text-slate-700">{student.lentes || 'NO'}</span></div>
                      <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Discapacidad (911)</span><span className="font-bold text-slate-700">{student.discapacidad || 'Ninguna'}</span></div>`;

content = content.replace(
  /<div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Usa Lentes<\/span><span className="font-bold text-slate-700">\{student\.lentes \|\| 'NO'\}<\/span><\/div>/,
  readSalud
);


fs.writeFileSync('src/components/HojaDeVida.jsx', content, 'utf8');
console.log('Updated HojaDeVida successfully.');
