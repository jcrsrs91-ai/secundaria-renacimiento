const fs = require('fs');

const path = 'src/pages/dashboard/PortalTutores.jsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(
  "const [loadingAvisos, setLoadingAvisos] = useState(true);",
  "const [loadingAvisos, setLoadingAvisos] = useState(true);\n  const [activeTab, setActiveTab] = useState('matutino');"
);

c = c.replace(
  "noticias.map(n =>",
  "noticias.filter(a => !a.turno || a.turno === 'ambos' || a.turno === activeTab).map(n =>"
);

c = c.replace(
  "} : noticias.length === 0 ?",
  "} : noticias.filter(a => !a.turno || a.turno === 'ambos' || a.turno === activeTab).length === 0 ?"
);

const headerOld = `<h2 className="text-xl font-bold text-slate-800 flex items-center">
              <Newspaper className="w-4 h-4 mr-2" /> Muro de Noticias
            </h2>
          </div>
          <div className="p-6 space-y-4">`;

const headerNew = `<h2 className="text-xl font-bold text-slate-800 flex items-center">
              <Newspaper className="w-4 h-4 mr-2" /> Muro de Noticias
            </h2>
          </div>
          <div className="px-6 pt-4">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setActiveTab('matutino')}
                className={\`flex-1 py-1.5 text-xs font-bold rounded-md transition-all duration-300 \${activeTab === 'matutino' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}
              >
                ☀️ Matutino
              </button>
              <button 
                onClick={() => setActiveTab('vespertino')}
                className={\`flex-1 py-1.5 text-xs font-bold rounded-md transition-all duration-300 \${activeTab === 'vespertino' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}
              >
                🌙 Vespertino
              </button>
            </div>
          </div>
          <div className="p-6 space-y-4">`;

c = c.replace(headerOld, headerNew);

fs.writeFileSync(path, c);
