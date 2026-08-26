const fs = require('fs');
let file = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');

// The replacement should happen where openModal('hoja', a) is found.
// Actually, `openModal('hoja', a)` is found in `activeTab === 'activos'` and `activeTab === 'directorio'` and `activeTab === 'pendientes'`.
const newBtn = `<button onClick={() => setSelectedExpediente(a)} className="text-purple-600 hover:text-purple-800 font-medium text-sm inline-flex items-center ml-4">
                          <FolderOpen className="w-4 h-4 mr-1" /> Docs Digitales
                        </button>`;

// Let's do a global replace for all tables that have "Expediente".
file = file.replace(/(<button onClick=\{\(\) => openModal\('hoja', (.*?)\)\}.*?Expediente\s*<\/button>)/g, "$1\n                        <button onClick={() => setSelectedExpediente($2)} className=\"text-purple-600 hover:text-purple-800 font-medium text-sm inline-flex items-center ml-4\">\n                          <FolderOpen className=\"w-4 h-4 mr-1\" /> Docs Digitales\n                        </button>");

fs.writeFileSync('src/pages/dashboard/ControlEscolar.jsx', file);
console.log('Patched buttons');
