const fs = require('fs');
let file = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');

// Find the Kardex button in the Generaciones table and add Constancia next to it
const regex = /(<button onClick=\{\(\) => \{ setPrintData\(a\); setPrintMode\('kardex'\); \}\} className="text-purple-600 hover:text-purple-800 font-medium text-sm inline-flex items-center">[\s\S]*?<\/button>)/;

const newBtn = `<button onClick={() => handlePrintConstancia(a)} className="text-indigo-600 hover:text-indigo-800 font-medium text-sm inline-flex items-center ml-4">
                        <FileText className="w-4 h-4 mr-1" /> Constancia
                      </button>`;

if (file.match(regex)) {
  file = file.replace(regex, `$1\n                      ${newBtn}`);
  fs.writeFileSync('src/pages/dashboard/ControlEscolar.jsx', file);
  console.log('Added Constancia to Generaciones');
} else {
  console.log('Not found');
}
