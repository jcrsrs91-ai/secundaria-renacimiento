const fs = require('fs');

function modifyFile(filepath) {
    let c = fs.readFileSync(filepath, 'utf8');

    const becaOld = `          <div className="mb-6 bg-slate-50 border border-slate-200 p-4 rounded-lg flex items-center gap-4">
             <div className={\`p-3 rounded-full \${(String(student.tieneBeca || '').toUpperCase().trim().startsWith('S') || (student.nombreBeca && String(student.nombreBeca).trim() !== '' && String(student.nombreBeca).toUpperCase().trim() !== 'NO')) ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}\`}>
               <Award size={24} />
             </div>
             <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Estatus de Beca</p>
                <p className={\`text-sm font-bold \${(String(student.tieneBeca || '').toUpperCase().trim().startsWith('S') || (student.nombreBeca && String(student.nombreBeca).trim() !== '' && String(student.nombreBeca).toUpperCase().trim() !== 'NO')) ? 'text-emerald-700' : 'text-slate-700'}\`}>
                  {(String(student.tieneBeca || '').toUpperCase().trim().startsWith('S') || (student.nombreBeca && String(student.nombreBeca).trim() !== '' && String(student.nombreBeca).toUpperCase().trim() !== 'NO')) 
                    ? \`S\\u00cd - \${student.origenBeca ? String(student.origenBeca).toUpperCase() : 'PROGRAMA FEDERAL'} (\${student.nombreBeca ? String(student.nombreBeca).toUpperCase().trim() : 'NO ESPECIFICADO'})\` 
                    : 'NO CUENTA CON BECA'}
                </p>
             </div>
          </div>`;

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

    // Replace the old block. Wait, the old block has exactly `S\u00cd - ${student.nombreBeca ...`. Let's just find and replace using regex.
    c = c.replace(/\{\(String\(student\.tieneBeca \|\| ''\)\.toUpperCase\(\)\.trim\(\)\.startsWith\('S'\)[\s\S]*?\}<\/p>/m, 
      `{(String(student.tieneBeca || '').toUpperCase().trim().startsWith('S') || (student.nombreBeca && String(student.nombreBeca).trim() !== '' && String(student.nombreBeca).toUpperCase().trim() !== 'NO')) 
                    ? \`S\\u00cd - \${student.origenBeca ? String(student.origenBeca).toUpperCase() : 'BECA RITA CETINA'} (\${student.nombreBeca ? String(student.nombreBeca).toUpperCase().trim() : ''})\` 
                    : 'NO CUENTA CON BECA'}
                </p>`);

    c = c.replace('          {errorMsg && (', extraFields + '\n          {errorMsg && (');

    fs.writeFileSync(filepath, c, 'utf8');
}

modifyFile('src/components/ExpedienteModal.jsx');
console.log('Modified ExpedienteModal');
