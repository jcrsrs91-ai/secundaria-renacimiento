const fs = require('fs');

let c = fs.readFileSync('src/components/ExpedienteModal.jsx', 'utf8');

const targetStr = `                  {(String(student.tieneBeca || '').toUpperCase().trim().startsWith('S') || (student.nombreBeca && String(student.nombreBeca).trim() !== '' && String(student.nombreBeca).toUpperCase().trim() !== 'NO')) 
                    ? \`S\\u00cd - \${student.nombreBeca ? String(student.nombreBeca).toUpperCase().trim() : 'PROGRAMA NO ESPECIFICADO'}\` 
                    : 'NO CUENTA CON BECA'}`;

const newStr = `                  {(String(student.tieneBeca || '').toUpperCase().trim().startsWith('S') || (student.nombreBeca && String(student.nombreBeca).trim() !== '' && String(student.nombreBeca).toUpperCase().trim() !== 'NO')) 
                    ? \`S\\u00cd - \${student.origenBeca ? String(student.origenBeca).toUpperCase() : 'BECA RITA CETINA (FEDERAL)'} (\${student.nombreBeca ? String(student.nombreBeca).toUpperCase().trim() : ''})\` 
                    : 'NO CUENTA CON BECA'}`;

c = c.replace(targetStr, newStr);

const extraFields = `
          <div className="mb-6 bg-slate-50 border border-slate-200 p-4 rounded-lg flex gap-8">
             <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Atención USAER</p>
                <p className={\`text-sm font-bold \${student.usaer === 'SÍ' ? 'text-indigo-700' : 'text-slate-700'}\`}>
                  {student.usaer === 'SÍ' ? 'SÍ RECIBE ATENCIÓN' : 'NO RECIBE ATENCIÓN'}
                </p>
             </div>
             <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Primaria de Procedencia</p>
                <p className="text-sm font-bold text-slate-700">
                  {student.tipoPrimaria ? String(student.tipoPrimaria).toUpperCase() : 'PRIMARIA GENERAL'}
                </p>
             </div>
          </div>
`;

c = c.replace('          {errorMsg && (', extraFields + '          {errorMsg && (');

fs.writeFileSync('src/components/ExpedienteModal.jsx', c, 'utf8');
console.log('Fixed ExpedienteModal!');
