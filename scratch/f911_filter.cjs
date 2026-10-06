const fs = require('fs');

// 1. ControlEscolar.jsx
let ce = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');
ce = ce.replace(
  '<Formato911 activos={activos} />',
  '<Formato911 rawActivos={_rawActivos} />'
);
fs.writeFileSync('src/pages/dashboard/ControlEscolar.jsx', ce, 'utf8');

// 2. Formato911.jsx
let f911 = fs.readFileSync('src/components/Formato911.jsx', 'utf8');

const newProps = `import { useState, useMemo } from 'react';\nimport { FileText, Download, Filter } from 'lucide-react';\n\nexport default function Formato911({ rawActivos }) {
  const [shiftFilter, setShiftFilter] = useState('Ambos');

  const activos = useMemo(() => {
    if (!rawActivos) return [];
    if (shiftFilter === 'Ambos') return rawActivos;
    return rawActivos.filter(a => a.turno === shiftFilter);
  }, [rawActivos, shiftFilter]);`;

f911 = f911.replace(
  /import \{ FileText, Download \} from 'lucide-react';\s*export default function Formato911\(\{ activos \}\) \{/,
  newProps
);

const newHeader = `      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <FileText className="w-7 h-7 text-emerald-600" />
            Estadística 911 (Secundaria 911.5)
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Formatos oficiales para captura. Selecciona el turno a consultar.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-4 items-center">
          <div className="flex items-center bg-white rounded-lg border border-slate-300 p-1 shadow-sm">
             <Filter className="w-4 h-4 text-slate-400 mx-2" />
             <span className="text-xs font-medium text-slate-500 pr-2 border-r border-slate-200">Turno de Reporte:</span>
             <select 
               className="bg-transparent border-none text-sm font-bold text-slate-700 outline-none cursor-pointer pl-2 pr-4 py-1"
               value={shiftFilter}
               onChange={e => setShiftFilter(e.target.value)}
             >
                <option value="Ambos">Global (Ambos Turnos)</option>
                <option value="Matutino">Matutino</option>
                <option value="Vespertino">Vespertino</option>
             </select>
          </div>
          <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
            <Download className="w-4 h-4" /> Imprimir Formatos
          </button>
        </div>
      </div>`;

f911 = f911.replace(
  /<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-slate-200 pb-4">[\s\S]*?<\/button>\s*<\/div>\s*<\/div>/,
  newHeader
);

fs.writeFileSync('src/components/Formato911.jsx', f911, 'utf8');
console.log('F911 modified successfully with internal filter logic.');
