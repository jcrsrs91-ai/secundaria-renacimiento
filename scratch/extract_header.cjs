const fs = require('fs');
let c = fs.readFileSync('src/components/Formato911.jsx', 'utf8');

const regexGrid = /(const TableGrid = useMemo\(\(\) => \(\s*<div className="bg-white p-6 rounded-lg shadow-sm w-full h-full" ref=\{containerRef\}>\s*)<div className="flex justify-between items-center mb-6">[\s\S]*?<\/button>\s*<\/div>/;

c = c.replace(regexGrid, "$1");

const regexReturn = /(return\s*)TableGrid;/;

const newReturn = `$1(
    <>
      <div className="flex justify-between items-center mb-4 bg-white p-4 rounded-lg shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Estadística 911</h2>
          <p className="text-sm text-slate-500">Formato de captura de datos</p>
        </div>
        <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50">
          {isSaving ? 'Guardando...' : 'Guardar Datos'}
        </button>
      </div>
      {TableGrid}
    </>
  );`;

c = c.replace(regexReturn, newReturn);

fs.writeFileSync('src/components/Formato911.jsx', c, 'utf8');
