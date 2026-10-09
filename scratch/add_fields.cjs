const fs = require('fs');

function addFields(filePath) {
  let c = fs.readFileSync(filePath, 'utf8');

  // Add Habla Espanol after nombreLenguaIndigena
  const spanTarget = '<input type="text" name="nombreLenguaIndigena" className="mt-1 block w-full rounded-md p-2 border" defaultValue={studentData?.nombreLenguaIndigena} placeholder="Ej. NÃ¡huatl, Maya..." />';
  const spanHtml = `
                            </div>
                            <div>
                              <label className="block text-sm font-medium">¿Además de la lengua indígena, habla español?</label>
                              <select name="hablaEspanol" className="mt-1 block w-full rounded-md p-2 border" defaultValue={studentData?.hablaEspanol || 'SÍ'}>
                                <option>SÍ</option>
                                <option>NO</option>
                              </select>`;
  if (!c.includes('name="hablaEspanol"')) {
    c = c.replace(spanTarget, spanTarget + spanHtml);
  }

  // Add USAER after discapacidad
  const usaerTarget = '<option>Trastorno por DÃ©ficit de AtenciÃ³n (TDAH)</option>\n                              </select>';
  const usaerHtml = `
                            </div>
                            <div>
                              <label className="block text-sm font-medium">¿Recibe atención de USAER?</label>
                              <select name="usaer" className="mt-1 block w-full rounded-md p-2 border" defaultValue={studentData?.usaer || 'NO'}>
                                <option>NO</option>
                                <option>SÍ</option>
                              </select>`;
  if (!c.includes('name="usaer"')) {
    c = c.replace(usaerTarget, usaerTarget + usaerHtml);
  }

  fs.writeFileSync(filePath, c, 'utf8');
}

addFields('src/pages/public/PreInscripcion.jsx');
