const fs = require('fs');

let content = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');

const f911Btn = `\n          <button onClick={() => setActiveTab('estadistica911')} className={\`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm \${activeTab === 'estadistica911' ? 'bg-indigo-600 text-white shadow-indigo-200 ring-2 ring-indigo-600 ring-offset-1' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'}\`}>
            Estadística 911
          </button>`;

if (!content.includes("Estadística 911")) {
  content = content.replace(
    /Control de Becas\r?\n\s*<\/button>/,
    `Control de Becas\n          </button>${f911Btn}`
  );
}

const renderF911 = `\n        {activeTab === 'estadistica911' && <Formato911 activos={activos} />}`;
if (!content.includes("<Formato911")) {
  content = content.replace(
    /\{activeTab === 'becas' && <BecasReport activos=\{activos\} \/>\}/,
    `{activeTab === 'becas' && <BecasReport activos={activos} />}${renderF911}`
  );
}

fs.writeFileSync('src/pages/dashboard/ControlEscolar.jsx', content, 'utf8');
console.log('Tab injected successfully with regex.');
