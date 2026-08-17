const fs = require('fs');

const path = 'src/pages/public/Landing.jsx';
let c = fs.readFileSync(path, 'utf8');

// 1. Add state for activeTab
c = c.replace(
  "const [loadingNews, setLoadingNews] = useState(true);",
  "const [loadingNews, setLoadingNews] = useState(true);\n  const [activeTab, setActiveTab] = useState('matutino');"
);

// 2. Filter news in the render
c = c.replace(
  "noticias.map((aviso) =>",
  "noticias.filter(a => !a.turno || a.turno === 'ambos' || a.turno === activeTab).map((aviso) =>"
);

// Fix the "noticias.length === 0" to filter logic
c = c.replace(
  "} : noticias.length === 0 ?",
  "} : noticias.filter(a => !a.turno || a.turno === 'ambos' || a.turno === activeTab).length === 0 ?"
);

// 3. Add the Tabs UI inside the panel header
const panelHeaderOld = `<div className="bg-sky-600/90 px-6 py-4 flex items-center justify-between border-b border-white/10 shrink-0">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Megaphone className="w-5 h-5" /> Muro de Avisos
                </h2>
              </div>`;

const panelHeaderNew = `<div className="bg-sky-600/90 px-6 py-4 flex flex-col gap-4 border-b border-white/10 shrink-0">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Megaphone className="w-5 h-5" /> Muro de Avisos
                </h2>
                <div className="flex bg-slate-900/40 p-1 rounded-lg">
                  <button 
                    onClick={() => setActiveTab('matutino')}
                    className={\`flex-1 py-1.5 text-xs sm:text-sm font-bold rounded-md transition-all duration-300 \${activeTab === 'matutino' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-white/5'}\`}
                  >
                    ☀️ Matutino
                  </button>
                  <button 
                    onClick={() => setActiveTab('vespertino')}
                    className={\`flex-1 py-1.5 text-xs sm:text-sm font-bold rounded-md transition-all duration-300 \${activeTab === 'vespertino' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-white/5'}\`}
                  >
                    🌙 Vespertino
                  </button>
                </div>
              </div>`;

c = c.replace(panelHeaderOld, panelHeaderNew);

// 4. Update the "Último Aviso" top banner if it was present, but it was removed earlier. No need.

fs.writeFileSync(path, c);
