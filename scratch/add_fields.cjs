const fs = require('fs');

function modifyFile(filepath) {
    let c = fs.readFileSync(filepath, 'utf8');

    // 1. USAER + Primaria
    // Look for Lengua Indigena in PreInscripcion to place it near it, or just place it in Academicos section.
    // In ExpedienteModal it's similar.

    // Let's do string replacement for Becas first
    const becaOld = `                        <div>
                          <label className="block text-sm font-medium">¿Cuenta con alguna beca?</label>
                          <select name="tieneBeca" className="mt-1 block w-full rounded-md shadow-sm p-2 border" required defaultValue={studentData?.tieneBeca || 'NO'} onChange={(e) => {
                            const input = document.getElementById('nombreBecaContainer');
                            if(input) input.style.display = e.target.value !== 'NO' ? 'block' : 'none';
                          }}>
                            <option>NO</option><option>SÍ</option>
                          </select>
                        </div>
                          <div>
                            <label className="block text-sm font-medium">Discapacidad o Condición</label>`;

    const becaNew = `                        <div>
                          <label className="block text-sm font-medium">¿Cuenta con alguna beca?</label>
                          <select name="tieneBeca" className="mt-1 block w-full rounded-md shadow-sm p-2 border" required defaultValue={studentData?.tieneBeca || 'NO'} onChange={(e) => {
                            const becaFields = document.getElementById('origenBecaContainer');
                            if(becaFields) becaFields.style.display = e.target.value !== 'NO' ? 'block' : 'none';
                          }}>
                            <option>NO</option><option>SÍ</option>
                          </select>
                        </div>
                          <div>
                            <label className="block text-sm font-medium">Discapacidad o Condición</label>`;

    c = c.replace(becaOld, becaNew);

    const becaNameOld = `                        <div id="nombreBecaContainer" style={{display: studentData?.tieneBeca && studentData?.tieneBeca !== 'NO' ? 'block' : 'none'}}>
                          <label className="block text-sm font-medium">Nombre de la Beca</label>
                          <input type="text" name="nombreBeca" className="mt-1 block w-full rounded-md shadow-sm p-2 border" defaultValue={studentData?.nombreBeca} />
                        </div>`;

    const becaNameNew = `                        <div id="origenBecaContainer" style={{display: studentData?.tieneBeca && studentData?.tieneBeca !== 'NO' ? 'block' : 'none'}} className="col-span-1 sm:col-span-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium">Origen de la Beca</label>
                              <select name="origenBeca" className="mt-1 block w-full rounded-md shadow-sm p-2 border" defaultValue={studentData?.origenBeca || 'Beca Rita Cetina (Federal)'} onChange={(e) => {
                                 const input = document.getElementById('nombreBecaContainer');
                                 if (input) input.style.display = (e.target.value === 'Otra beca federal' || e.target.value === 'Otra / No especificada') ? 'block' : 'none';
                              }}>
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
                            <div id="nombreBecaContainer" style={{display: (studentData?.origenBeca === 'Otra beca federal' || studentData?.origenBeca === 'Otra / No especificada') ? 'block' : 'none'}}>
                              <label className="block text-sm font-medium">Especificar el nombre de la beca</label>
                              <input type="text" name="nombreBeca" className="mt-1 block w-full rounded-md shadow-sm p-2 border" defaultValue={studentData?.nombreBeca} />
                            </div>
                          </div>
                        </div>`;

    c = c.replace(becaNameOld, becaNameNew);

    // USAER and Tipo Primaria -> Add near "Discapacidad" or "Tutor"
    // Let's add it right after Discapacidad
    const discOld = `</select>
                          </div>
                        <div id="origenBecaContainer"`;

    const discNew = `</select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium">¿Recibe atención de USAER?</label>
                            <select name="usaer" className="mt-1 block w-full rounded-md shadow-sm p-2 border" defaultValue={studentData?.usaer || 'NO'}>
                              <option>NO</option><option>SÍ</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium">Tipo de Primaria de procedencia</label>
                            <select name="tipoPrimaria" className="mt-1 block w-full rounded-md shadow-sm p-2 border" defaultValue={studentData?.tipoPrimaria || 'Primaria General'}>
                              <option>Primaria General</option>
                              <option>Primaria Indígena</option>
                              <option>Cursos Comunitarios (CONAFE)</option>
                              <option>Primaria Particular</option>
                              <option>Otra</option>
                            </select>
                          </div>
                        <div id="origenBecaContainer"`;

    c = c.replace(discOld, discNew);

    fs.writeFileSync(filepath, c, 'utf8');
}

modifyFile('src/pages/public/PreInscripcion.jsx');
console.log('Modified PreInscripcion');
