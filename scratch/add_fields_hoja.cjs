const fs = require('fs');

function addFieldsHoja(filePath) {
  let c = fs.readFileSync(filePath, 'utf8');

  // Add Habla Espanol after nombreLenguaIndigena
  const spanTargetRegex = /(<input type="text" name="nombreLenguaIndigena".*?\/>\s*<\/div>)/;
  const spanHtml = `
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">¿Además habla español?</label>
              <select name="hablaEspanol" className="w-full border-b border-slate-300 focus:border-blue-500 outline-none pb-1 font-medium text-slate-800" defaultValue={student?.hablaEspanol || 'SÍ'}>
                <option>SÍ</option>
                <option>NO</option>
              </select>
            </div>`;
  if (!c.includes('name="hablaEspanol"')) {
    c = c.replace(spanTargetRegex, "$1" + spanHtml);
  }

  // Add USAER after discapacidad
  const usaerTargetRegex = /(TDAH\)<\/option>\s*<\/select>\s*<\/div>)/;
  const usaerHtml = `
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">USAER</label>
              <select name="usaer" className="w-full border-b border-slate-300 focus:border-blue-500 outline-none pb-1 font-medium text-slate-800" defaultValue={student?.usaer || 'NO'}>
                <option>NO</option>
                <option>SÍ</option>
              </select>
            </div>`;
  if (!c.includes('name="usaer"')) {
    c = c.replace(usaerTargetRegex, "$1" + usaerHtml);
  }

  fs.writeFileSync(filePath, c, 'utf8');
}

addFieldsHoja('src/components/HojaDeVida.jsx');
