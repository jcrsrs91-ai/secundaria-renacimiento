const fs = require('fs');

const path = 'src/pages/dashboard/AvisosEscolares.jsx';
let c = fs.readFileSync(path, 'utf8');

// 1. Add state for `turno`
c = c.replace(
  "const [isActive, setIsActive] = useState(true);",
  "const [isActive, setIsActive] = useState(true);\n  const [turno, setTurno] = useState('ambos');"
);

// 2. Add `turno` to openModal
c = c.replace(
  `      setType(aviso.type);
      setIsActive(aviso.isActive !== false);`,
  `      setType(aviso.type);
      setIsActive(aviso.isActive !== false);
      setTurno(aviso.turno || 'ambos');`
);

c = c.replace(
  `      setType('info');
      setIsActive(true);
    }`,
  `      setType('info');
      setIsActive(true);
      setTurno('ambos');
    }`
);

// 3. Add `turno` to dataToUpdate and addDoc
c = c.replace(
  `          isActive,
          updatedAt: serverTimestamp()
        };`,
  `          isActive,
          turno,
          updatedAt: serverTimestamp()
        };`
);

c = c.replace(
  `          isActive,
          imageUrl,
          createdAt: serverTimestamp()`,
  `          isActive,
          turno,
          imageUrl,
          createdAt: serverTimestamp()`
);

// 4. Add Turno select in the form
const formSection = `<label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>`;
const newFormSection = `<label className="block text-sm font-medium text-slate-700 mb-1">Turno</label>
                  <select
                    value={turno}
                    onChange={(e) => setTurno(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 mb-4"
                  >
                    <option value="ambos">Ambos Turnos</option>
                    <option value="matutino">Turno Matutino</option>
                    <option value="vespertino">Turno Vespertino</option>
                  </select>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>`;
c = c.replace(formSection, newFormSection);

// 5. Add indicator in the list view
const listIndicator = `{aviso.isActive !== false ? 'Visible' : 'Oculto'}
                    </span>`;
const newListIndicator = `{aviso.isActive !== false ? 'Visible' : 'Oculto'}
                    </span>
                    {aviso.turno && aviso.turno !== 'ambos' && (
                      <span className={\`px-2.5 py-0.5 rounded-full text-xs font-medium border \${aviso.turno === 'matutino' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-purple-50 text-purple-700 border-purple-200'}\`}>
                        {aviso.turno === 'matutino' ? '☀️ Matutino' : '🌙 Vespertino'}
                      </span>
                    )}`;
c = c.replace(listIndicator, newListIndicator);

fs.writeFileSync(path, c);
