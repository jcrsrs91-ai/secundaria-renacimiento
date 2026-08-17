const fs = require('fs');

const path = 'src/pages/public/PublicAvisos.jsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(
  "const [loading, setLoading] = useState(true);",
  "const [loading, setLoading] = useState(true);\n  const [activeTab, setActiveTab] = useState('matutino');"
);

c = c.replace(
  "avisos.map((aviso)",
  "avisos.filter(a => !a.turno || a.turno === 'ambos' || a.turno === activeTab).map((aviso)"
);

c = c.replace(
  "} : avisos.length === 0 ?",
  "} : avisos.filter(a => !a.turno || a.turno === 'ambos' || a.turno === activeTab).length === 0 ?"
);

const headerOld = `<p className="text-lg text-slate-500 mt-2 font-medium">Mantente informado de todos los avisos y noticias de la institucin.</p>
          </div>
        </div>`;

const headerNew = `<p className="text-lg text-slate-500 mt-2 font-medium">Mantente informado de todos los avisos y noticias de la institucin.</p>
          </div>
        </div>
        
        <div className="flex bg-slate-200 p-1.5 rounded-xl max-w-sm mx-auto mb-10 shadow-sm">
          <button 
            onClick={() => setActiveTab('matutino')}
            className={\`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-300 \${activeTab === 'matutino' ? 'bg-white text-sky-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}\`}
          >
            ☀️ Turno Matutino
          </button>
          <button 
            onClick={() => setActiveTab('vespertino')}
            className={\`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-300 \${activeTab === 'vespertino' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}\`}
          >
            🌙 Turno Vespertino
          </button>
        </div>`;

c = c.replace(headerOld, headerNew);

fs.writeFileSync(path, c);
