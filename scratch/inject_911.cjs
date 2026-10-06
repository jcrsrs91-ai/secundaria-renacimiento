const fs = require('fs');

let content = fs.readFileSync('src/pages/public/PreInscripcion.jsx', 'utf8');

// 1. Add Nacionalidad and Lengua Indígena after fechaNacimiento
const newInfoPersonal = `                          </div>
                          <div>
                            <label className="block text-sm font-medium">Nacionalidad (País de Nacimiento)</label>
                            <select name="nacionalidad" className="mt-1 block w-full rounded-md p-2 border" defaultValue={studentData?.nacionalidad || 'MEXICANA'}>
                              <option value="MEXICANA">Mexicana</option>
                              <option value="EXTRANJERA">Extranjera</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium">¿Habla alguna Lengua Indígena?</label>
                            <select name="lenguaIndigena" className="mt-1 block w-full rounded-md p-2 border" defaultValue={studentData?.lenguaIndigena || 'NO'} onChange={(e) => {
                               const input = document.getElementById('nombreLenguaContainer');
                               if (e.target.value === 'SÍ') {
                                 input.style.display = 'block';
                               } else {
                                 input.style.display = 'none';
                               }
                            }}>
                              <option>NO</option>
                              <option>SÍ</option>
                            </select>
                          </div>
                          <div id="nombreLenguaContainer" style={{display: studentData?.lenguaIndigena === 'SÍ' ? 'block' : 'none'}}>
                            <label className="block text-sm font-medium">¿Cuál lengua indígena?</label>
                            <input type="text" name="nombreLenguaIndigena" className="mt-1 block w-full rounded-md p-2 border" defaultValue={studentData?.nombreLenguaIndigena} placeholder="Ej. Náhuatl, Maya..." />
                          </div>`;

content = content.replace(
  'defaultValue={studentData?.fechaNacimiento} />\n                          </div>',
  `defaultValue={studentData?.fechaNacimiento} />\n${newInfoPersonal}`
);

// 2. Add Discapacidad after Usa lentes?
const newSalud = `                          <div>
                            <label className="block text-sm font-medium">Discapacidad o Condición</label>
                            <select name="discapacidad" className="mt-1 block w-full rounded-md shadow-sm p-2 border" defaultValue={studentData?.discapacidad || 'Ninguna'}>
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
  '<option>NO</option><option>S\\u00cd</option>\n                            </select>\n                          </div>',
  `<option>NO</option><option>S\\u00cd</option>\n                            </select>\n                          </div>\n${newSalud}`
);
content = content.replace(
  '<option>NO</option><option>SÍ</option>\n                            </select>\n                          </div>',
  `<option>NO</option><option>SÍ</option>\n                            </select>\n                          </div>\n${newSalud}`
);
// Handle possible encoding of SÍ in the file.
content = content.replace(
  /<option>NO<\/option><option>S.?<\/option>\r?\n\s*<\/select>\r?\n\s*<\/div>/,
  `$&
${newSalud}`
);

fs.writeFileSync('src/pages/public/PreInscripcion.jsx', content, 'utf8');
console.log('Added 911 fields to PreInscripcion');
