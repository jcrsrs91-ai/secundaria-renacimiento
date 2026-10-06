const fs = require('fs');

let content = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');

// Add Import
if (!content.includes('import Formato911 from')) {
  content = content.replace(
    "import BecasReport from '../../components/BecasReport';",
    "import BecasReport from '../../components/BecasReport';\nimport Formato911 from '../../components/Formato911';"
  );
}

// Add FileText to lucide-react if missing
if (!content.includes('FileText,')) {
  content = content.replace(
    /import \{([^}]+)\} from 'lucide-react';/,
    (match, p1) => `import {${p1}, FileText } from 'lucide-react';`
  );
}

// Add Tab Button
const becasTab = `<button
            onClick={() => setActiveTab('becas')}
            className={\`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 \${activeTab === 'becas' ? 'border-primary-600 text-primary-700 bg-primary-50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}\`}
          >
            <Award size={18} />
            Control de Becas
          </button>`;

const f911Tab = `          <button
            onClick={() => setActiveTab('estadistica911')}
            className={\`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 \${activeTab === 'estadistica911' ? 'border-primary-600 text-primary-700 bg-primary-50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}\`}
          >
            <FileText size={18} />
            Estadística 911
          </button>`;

if (!content.includes("Estadística 911")) {
  content = content.replace(becasTab, `${becasTab}\n${f911Tab}`);
}

// Render component in tab view
const renderBecas = `{activeTab === 'becas' && <BecasReport activos={activos} />}`;
const renderF911 = `{activeTab === 'estadistica911' && <Formato911 activos={activos} />}`;

if (!content.includes("Formato911 activos")) {
  content = content.replace(renderBecas, `${renderBecas}\n        ${renderF911}`);
}

fs.writeFileSync('src/pages/dashboard/ControlEscolar.jsx', content, 'utf8');
console.log('Injected Formato911 into ControlEscolar');
