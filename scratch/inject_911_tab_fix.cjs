const fs = require('fs');

let content = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');

// The correct replacement string
const becasMatch = `<button onClick={() => setActiveTab('becas')} className={\`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm \${activeTab === 'becas' ? 'bg-emerald-600 text-white shadow-emerald-200 ring-2 ring-emerald-600 ring-offset-1' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'}\`}>
            Control de Becas
          </button>`;

const f911Btn = `<button onClick={() => setActiveTab('estadistica911')} className={\`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm \${activeTab === 'estadistica911' ? 'bg-indigo-600 text-white shadow-indigo-200 ring-2 ring-indigo-600 ring-offset-1' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'}\`}>
            Estadística 911
          </button>`;

if (content.includes(becasMatch) && !content.includes("Estadística 911")) {
  content = content.replace(becasMatch, `${becasMatch}\n          ${f911Btn}`);
}

const renderBecasMatch = `{activeTab === 'becas' && <BecasReport activos={activos} />}`;
const renderF911 = `{activeTab === 'estadistica911' && <Formato911 activos={activos} />}`;

if (content.includes(renderBecasMatch) && !content.includes(renderF911)) {
  content = content.replace(renderBecasMatch, `${renderBecasMatch}\n        ${renderF911}`);
}

fs.writeFileSync('src/pages/dashboard/ControlEscolar.jsx', content, 'utf8');
console.log('Tab injected successfully.');
