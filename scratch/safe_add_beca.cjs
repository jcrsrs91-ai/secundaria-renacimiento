const fs = require('fs');

let content = fs.readFileSync('src/components/HojaDeVida.jsx', 'utf8');
const lines = content.split(/\r?\n/);

const newLines = `                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div><p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Grado</p><p className="font-bold text-slate-800 text-lg">{student.grado}</p></div>
                      <div><p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Grupo</p><p className="font-bold text-primary-700 text-lg">{student.grupo || 'Por Asignar'}</p></div>
                      <div><p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Turno</p><p className="font-bold text-slate-800 text-lg">{student.turno || '-'}</p></div>
                      <div><p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Taller</p><p className="font-bold text-slate-800 text-sm mt-1">{student.taller || '-'}</p></div>
                      <div>
                         <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Beca</p>
                         <p className={\`font-bold text-sm mt-1 \${(String(student.tieneBeca || '').toUpperCase().trim().startsWith('S') || (student.nombreBeca && String(student.nombreBeca).trim() !== '' && String(student.nombreBeca).toUpperCase().trim() !== 'NO')) ? 'text-emerald-600' : 'text-slate-500'}\`}>
                            {(String(student.tieneBeca || '').toUpperCase().trim().startsWith('S') || (student.nombreBeca && String(student.nombreBeca).trim() !== '' && String(student.nombreBeca).toUpperCase().trim() !== 'NO')) 
                              ? student.nombreBeca ? String(student.nombreBeca).toUpperCase() : 'SÍ' 
                              : 'NO'}
                         </p>
                      </div>
                    </div>`;

let startIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('className="grid grid-cols-2 sm:grid-cols-4 gap-4')) {
    startIdx = i;
    break;
  }
}

if (startIdx !== -1) {
  lines.splice(startIdx, 6, newLines);
  fs.writeFileSync('src/components/HojaDeVida.jsx', lines.join('\n'), 'utf8');
  console.log('Replaced successfully');
} else {
  console.log('Not found');
}
