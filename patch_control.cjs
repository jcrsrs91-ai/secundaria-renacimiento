const fs = require('fs');

let file = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');

// 1. Add state
file = file.replace(
  "const [statusFilter, setStatusFilter] = useState('Activo');",
  `const [statusFilter, setStatusFilter] = useState('Activo');\n  const [cycleFilter, setCycleFilter] = useState('Todos');`
);

// 2. Update matches logic
file = file.replace(
  "const matchesStatus = statusFilter === 'Todos' || a.status === statusFilter;",
  `const matchesStatus = statusFilter === 'Todos' || a.status === statusFilter;\n    const matchesCycle = cycleFilter === 'Todos' || a.cicloEscolar === cycleFilter;`
);

// 3. Update return statement in filter
file = file.replace(
  "return matchesSearch && matchesGrade && matchesGroup && matchesShift && matchesStatus;",
  "return matchesSearch && matchesGrade && matchesGroup && matchesShift && matchesStatus && matchesCycle;"
);

// 4. Add UI element
file = file.replace(
  /<\/select>\s*<\/div>\s*<div className="w-full md:w-auto self-end flex gap-2">/,
  `</select>
            </div>
            <div className="w-full md:w-32">
              <label className="block text-xs font-medium text-slate-500 mb-1">Ciclo Escolar</label>
              <select className="w-full p-2 border rounded-lg text-sm bg-white" value={cycleFilter} onChange={e => setCycleFilter(e.target.value)}>
                <option value="Todos">Todos</option>
                <option value="2024-2025">2024-2025</option>
                <option value="2025-2026">2025-2026</option>
                <option value="2026-2027">2026-2027</option>
                <option value="2027-2028">2027-2028</option>
                <option value="2028-2029">2028-2029</option>
              </select>
            </div>
            <div className="w-full md:w-auto self-end flex gap-2">`
);

fs.writeFileSync('src/pages/dashboard/ControlEscolar.jsx', file);
console.log('ControlEscolar updated.');
