const fs = require('fs');
let c = fs.readFileSync('src/components/HojaDeVida.jsx', 'utf8');

const regex = /(Aptitudes Sobresalientes<\/option>\s*<\/select>\s*<\/div>)/;
const usaerHtml = `
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">USAER</label>
              <select name="usaer" className="w-full border-b border-slate-300 focus:border-blue-500 outline-none pb-1 font-medium text-slate-800" defaultValue={student?.usaer || 'NO'}>
                <option>NO</option>
                <option>SÍ</option>
              </select>
            </div>`;

if (!c.includes('name="usaer"')) {
  c = c.replace(regex, "$1" + usaerHtml);
}

fs.writeFileSync('src/components/HojaDeVida.jsx', c, 'utf8');
