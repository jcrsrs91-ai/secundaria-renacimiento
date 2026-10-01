const fs = require('fs');
const file = 'src/pages/dashboard/Inventario.jsx';
let txt = fs.readFileSync(file, 'utf8');

txt = txt.replace(
    'searchIncludes(r.resguardante, resguardoSearch) ||',
    'searchIncludes(r.resguardante || r.nombreResguardante, resguardoSearch) ||'
);

txt = txt.replace(
    '<td className="px-6 py-4 text-sm text-slate-600 font-bold">{r.resguardante || \'Desconocido\'}</td>',
    '<td className="px-6 py-4 text-sm text-slate-600 font-bold">{r.resguardante || r.nombreResguardante || \'Desconocido\'}</td>'
);

txt = txt.replace(
    '<td className="px-6 py-4 text-sm text-slate-600">{r.area || r.cargo || \'N/A\'}</td>',
    '<td className="px-6 py-4 text-sm text-slate-600">{r.area || r.areaResguardante || r.cargo || \'N/A\'}</td>'
);

fs.writeFileSync(file, txt, 'utf8');
console.log('Fixed properties');
