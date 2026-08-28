const fs = require('fs');

let file = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');

// 1. Add globalShiftFilter state
if (!file.includes('const [globalShiftFilter, setGlobalShiftFilter] = useState')) {
    file = file.replace(
        "const [shiftFilter, setShiftFilter] = useState('Todos');",
        "const [globalShiftFilter, setGlobalShiftFilter] = useState('Todos');"
    );
}

// 2. Rename state variables to _raw
file = file.replace(/const \[activos, setActivos\] = useState\(\[\]\);/g, "const [_rawActivos, setActivos] = useState([]);");
file = file.replace(/const \[directorio, setDirectorio\] = useState\(\[\]\);/g, "const [_rawDirectorio, setDirectorio] = useState([]);");

// 3. Inject useMemo
const injection = `
  const activos = useMemo(() => _rawActivos.filter(a => globalShiftFilter === 'Todos' || a.turno === globalShiftFilter), [_rawActivos, globalShiftFilter]);
  const directorio = useMemo(() => _rawDirectorio.filter(a => globalShiftFilter === 'Todos' || a.turno === globalShiftFilter), [_rawDirectorio, globalShiftFilter]);
`;
if (!file.includes('const activos = useMemo')) {
    file = file.replace("const [loading, setLoading] = useState(true);", "const [loading, setLoading] = useState(true);" + injection);
}

// 4. Change the table's filter to use globalShiftFilter
file = file.replace(/const matchesShift = shiftFilter === 'Todos' \|\| a\.turno === shiftFilter;/g, "const matchesShift = globalShiftFilter === 'Todos' || a.turno === globalShiftFilter;");

// 5. Remove the Turno filter dropdown from the table
file = file.replace(/<div className="w-full md:w-32">\s*<label className="block text-xs font-medium text-slate-500 mb-1">Turno<\/label>\s*<select className="w-full p-2 border rounded-lg text-sm bg-white" value=\{shiftFilter\} onChange=\{e => setShiftFilter\(e.target.value\)\}>\s*<option value="Todos">Ambos<\/option>\s*<option value="Matutino">Matutino<\/option>\s*<option value="Vespertino">Vespertino<\/option>\s*<\/select>\s*<\/div>/, "");

// 6. Add the Global filter to the header
const headerUI = `<div className="flex gap-2 flex-wrap justify-end">`;
const newHeaderUI = `<div className="flex gap-2 flex-wrap justify-end items-center">
            <div className="flex items-center bg-white rounded-lg border border-slate-300 p-1 mr-2 shadow-sm">
              <span className="text-xs font-medium text-slate-500 px-2">Turno:</span>
              <select className="bg-transparent border-none text-sm font-bold text-slate-700 outline-none cursor-pointer" value={globalShiftFilter} onChange={e => setGlobalShiftFilter(e.target.value)}>
                <option value="Todos">Ambos (Global)</option>
                <option value="Matutino">Matutino</option>
                <option value="Vespertino">Vespertino</option>
              </select>
            </div>`;

if (!file.includes('Turno:</span>')) {
    file = file.replace(headerUI, newHeaderUI);
}

fs.writeFileSync('src/pages/dashboard/ControlEscolar.jsx', file);
console.log('Patched ControlEscolar.jsx beautifully');
