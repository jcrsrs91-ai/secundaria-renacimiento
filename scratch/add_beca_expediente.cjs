const fs = require('fs');

let content = fs.readFileSync('src/components/ExpedienteModal.jsx', 'utf8');

// 1. Add Award icon
content = content.replace(
  "import { X, ExternalLink, Download, AlertTriangle } from 'lucide-react';",
  "import { X, ExternalLink, Download, AlertTriangle, Award } from 'lucide-react';"
);

// 2. Add Scholarship Info block before the documents list
const becaLogic = `
          {errorMsg && (
`;

const becaUI = `
          <div className="mb-6 bg-slate-50 border border-slate-200 p-4 rounded-lg flex items-center gap-4">
             <div className={\`p-3 rounded-full \${(String(student.tieneBeca || '').toUpperCase().trim().startsWith('S') || (student.nombreBeca && String(student.nombreBeca).trim() !== '' && String(student.nombreBeca).toUpperCase().trim() !== 'NO')) ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}\`}>
               <Award size={24} />
             </div>
             <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Estatus de Beca</p>
                <p className={\`text-sm font-bold \${(String(student.tieneBeca || '').toUpperCase().trim().startsWith('S') || (student.nombreBeca && String(student.nombreBeca).trim() !== '' && String(student.nombreBeca).toUpperCase().trim() !== 'NO')) ? 'text-emerald-700' : 'text-slate-700'}\`}>
                  {(String(student.tieneBeca || '').toUpperCase().trim().startsWith('S') || (student.nombreBeca && String(student.nombreBeca).trim() !== '' && String(student.nombreBeca).toUpperCase().trim() !== 'NO')) 
                    ? \`SÍ - \${student.nombreBeca ? String(student.nombreBeca).toUpperCase().trim() : 'PROGRAMA NO ESPECIFICADO'}\` 
                    : 'NO CUENTA CON BECA'}
                </p>
             </div>
          </div>

          {errorMsg && (
`;

content = content.replace(becaLogic, becaUI);

fs.writeFileSync('src/components/ExpedienteModal.jsx', content, 'utf8');
console.log('Added Becas info to ExpedienteModal');
