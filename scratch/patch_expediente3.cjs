const fs = require('fs');
let file = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');

file = file.replace(/(<button onClick=\{\(\) => openModal\('hoja', ([^)]+)\)\}[\s\S]*?Expediente[\s\S]*?<\/button>)/g, 
  "$1\n                        <button onClick={() => setSelectedExpediente($2)} className=\"text-purple-600 hover:text-purple-800 font-medium text-sm inline-flex items-center ml-4\">\n                          <FolderOpen className=\"w-4 h-4 mr-1\" /> Docs Digitales\n                        </button>");

fs.writeFileSync('src/pages/dashboard/ControlEscolar.jsx', file);
console.log('Patched buttons 3');
