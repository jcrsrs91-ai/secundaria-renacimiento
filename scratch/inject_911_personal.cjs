const fs = require('fs');

let content = fs.readFileSync('src/pages/public/PreInscripcion.jsx', 'utf8');

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
  /defaultValue=\{studentData\?\.fechaNacimiento\}\s*\/>\r?\n\s*<\/div>/,
  `defaultValue={studentData?.fechaNacimiento} />\n${newInfoPersonal}`
);

fs.writeFileSync('src/pages/public/PreInscripcion.jsx', content, 'utf8');
console.log('Added 911 fields to PreInscripcion Personal');
