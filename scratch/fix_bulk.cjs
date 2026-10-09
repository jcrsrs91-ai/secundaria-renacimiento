const fs = require('fs');

let c = fs.readFileSync('src/pages/dashboard/Inventario.jsx', 'utf8');

c = c.replace(
  "if ((type === 'baja' || type === 'resguardo') && selectedItems.length > 0) {",
  "if ((type === 'baja' || type === 'resguardo' || type === 'recepcion') && selectedItems.length > 0) {"
);

const btnResguardo = `<button onClick={() => openModal('resguardo')} className="flex items-center px-4 py-2 bg-indigo-100 text-indigo-800 rounded-lg text-sm font-medium hover:bg-indigo-200 shadow-sm transition-colors border border-indigo-200 mr-1">
                      <FileText className="w-4 h-4 mr-2" /> Generar Resguardo
                    </button>`;

const btnAlta = `<button onClick={() => openModal('recepcion')} className="flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium hover:bg-blue-200 shadow-sm transition-colors border border-blue-200 mr-1">
                      <FileText className="w-4 h-4 mr-2" /> Generar Alta
                    </button>
                    ` + btnResguardo;

c = c.replace(btnResguardo, btnAlta);

fs.writeFileSync('src/pages/dashboard/Inventario.jsx', c, 'utf8');
console.log('Added Generar Alta bulk action');
