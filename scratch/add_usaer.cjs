const fs = require('fs');
let c = fs.readFileSync('src/pages/public/PreInscripcion.jsx', 'utf8');

const usaerTargetRegex = /(TDAH\)<\/option>\s*<\/select>)/;
const usaerHtml = `
                            </div>
                            <div>
                              <label className="block text-sm font-medium">¿Recibe atención de USAER?</label>
                              <select name="usaer" className="mt-1 block w-full rounded-md p-2 border" defaultValue={studentData?.usaer || 'NO'}>
                                <option>NO</option>
                                <option>SÍ</option>
                              </select>`;

if (!c.includes('name="usaer"')) {
  c = c.replace(usaerTargetRegex, "$1" + usaerHtml);
}

fs.writeFileSync('src/pages/public/PreInscripcion.jsx', c, 'utf8');
