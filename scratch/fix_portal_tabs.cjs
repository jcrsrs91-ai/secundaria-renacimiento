const fs = require('fs');

const path = 'src/pages/dashboard/PortalTutores.jsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(
  "const [activeTab, setActiveTab] = useState('matutino');",
  "const [activeShiftTab, setActiveShiftTab] = useState('matutino');"
);

c = c.replace(
  "noticias.filter(a => !a.turno || a.turno === 'ambos' || a.turno === activeTab)",
  "noticias.filter(a => !a.turno || a.turno === 'ambos' || a.turno === activeShiftTab)"
);

c = c.replace(
  "noticias.filter(a => !a.turno || a.turno === 'ambos' || a.turno === activeTab)",
  "noticias.filter(a => !a.turno || a.turno === 'ambos' || a.turno === activeShiftTab)"
);

c = c.replace(
  `onClick={() => setActiveTab('matutino')}
                className={\`flex-1 py-1.5 text-xs font-bold rounded-md transition-all duration-300 \${activeTab === 'matutino' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}`,
  `onClick={() => setActiveShiftTab('matutino')}
                className={\`flex-1 py-1.5 text-xs font-bold rounded-md transition-all duration-300 \${activeShiftTab === 'matutino' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}`
);

c = c.replace(
  `onClick={() => setActiveTab('vespertino')}
                className={\`flex-1 py-1.5 text-xs font-bold rounded-md transition-all duration-300 \${activeTab === 'vespertino' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}`,
  `onClick={() => setActiveShiftTab('vespertino')}
                className={\`flex-1 py-1.5 text-xs font-bold rounded-md transition-all duration-300 \${activeShiftTab === 'vespertino' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}`
);

fs.writeFileSync(path, c);
