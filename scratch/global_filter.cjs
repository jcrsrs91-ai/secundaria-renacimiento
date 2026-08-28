const fs = require('fs');

let file = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');

// 1. Add globalShiftFilter state
if (!file.includes('const [globalShiftFilter, setGlobalShiftFilter] = useState')) {
    file = file.replace(
        "const [shiftFilter, setShiftFilter] = useState('Todos');",
        "const [globalShiftFilter, setGlobalShiftFilter] = useState('Todos');\n  const [shiftFilter, setShiftFilter] = useState('Todos'); // Keeping this if needed, but we will remove it from the UI"
    );
}

// 2. Change how `activos` and `directorio` are set in onSnapshot? 
// No, the best way is to keep allData in state, and compute `activos` and `directorio`.
// But rewriting the onSnapshot logic is huge.
// Let's just create `filteredActivosGlobal` and `filteredDirectorioGlobal` where they are used.

const regexStats = /const stats = useMemo\(\(\) => \{[\s\S]*?\}, \[activos\]\);/;
const matchStats = file.match(regexStats);
if (matchStats) {
    console.log("Found stats useMemo");
}

// Let's do string replacement for the print components.
const printRegex = /(<(AprovechamientoPrint|MatriculaPrint|MatriculaGruposPrint|AprobacionPrint|EficienciaTerminalPrint|DesempenoAlcanzadoPrint|DesertoresPrint)\s+[^>]*\/?>(?:\s*<\/\2>)?)/g;

// To do this reliably, let's redefine the variables passed to them inline, or at the top of the component render.
const renderStart = "return (\n    <div className=\"h-full flex flex-col relative print:bg-white\">";
const newVars = `
  const filteredActivosGlobal = activos.filter(a => globalShiftFilter === 'Todos' || a.turno === globalShiftFilter);
  const filteredDirectorioGlobal = directorio.filter(a => globalShiftFilter === 'Todos' || a.turno === globalShiftFilter);
`;

if (!file.includes('filteredActivosGlobal')) {
    file = file.replace(renderStart, newVars + renderStart);
}

// Now replace in the render block:
file = file.replace(/<AprovechamientoPrint activos=\{activos\}/g, "<AprovechamientoPrint activos={filteredActivosGlobal}");
file = file.replace(/<MatriculaPrint alumnos=\{directorio\}/g, "<MatriculaPrint alumnos={filteredDirectorioGlobal}");
file = file.replace(/<MatriculaGruposPrint alumnos=\{directorio\}/g, "<MatriculaGruposPrint alumnos={filteredDirectorioGlobal}");
file = file.replace(/<AprobacionPrint activos=\{activos\}/g, "<AprobacionPrint activos={filteredActivosGlobal}");
file = file.replace(/<EficienciaTerminalPrint activos=\{directorio\.filter\(s => s\.status === 'Activo' \|\| s\.status === 'Egresado'\)\}/g, "<EficienciaTerminalPrint activos={filteredDirectorioGlobal.filter(s => s.status === 'Activo' || s.status === 'Egresado')}");
file = file.replace(/bajas=\{directorio\.filter\(s => s\.status === 'Baja'\)\}/g, "bajas={filteredDirectorioGlobal.filter(s => s.status === 'Baja')}");
file = file.replace(/<DesempenoAlcanzadoPrint activos=\{activos\}/g, "<DesempenoAlcanzadoPrint activos={filteredActivosGlobal}");

// Now update `stats` useMemo to depend on globalShiftFilter
file = file.replace(/const stats = useMemo\(\(\) => \{/g, `const stats = useMemo(() => {
    const dataToUse = activos.filter(a => globalShiftFilter === 'Todos' || a.turno === globalShiftFilter);`);
file = file.replace(/activos\.forEach/g, "dataToUse.forEach");
file = file.replace(/}, \[activos\]\);/g, "}, [activos, globalShiftFilter]);");

// Change the table's `filteredDirectorio` to use `globalShiftFilter` INSTEAD of `shiftFilter`
file = file.replace(/const matchesShift = shiftFilter === 'Todos' \|\| a\.turno === shiftFilter;/g, "const matchesShift = globalShiftFilter === 'Todos' || a.turno === globalShiftFilter;");

// Remove the `Turno` filter dropdown from the table
file = file.replace(/<div className="w-full md:w-32">\s*<label className="block text-xs font-medium text-slate-500 mb-1">Turno<\/label>\s*<select className="w-full p-2 border rounded-lg text-sm bg-white" value=\{shiftFilter\} onChange=\{e => setShiftFilter\(e.target.value\)\}>\s*<option value="Todos">Ambos<\/option>\s*<option value="Matutino">Matutino<\/option>\s*<option value="Vespertino">Vespertino<\/option>\s*<\/select>\s*<\/div>/, "");


// Add the Global filter to the header
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
console.log('Patched ControlEscolar.jsx globally');
