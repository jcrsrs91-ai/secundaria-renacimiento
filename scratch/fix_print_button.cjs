const fs = require('fs');
const file = 'src/pages/dashboard/Inventario.jsx';
let txt = fs.readFileSync(file, 'utf8');

txt = txt.replace(
    '                          Ver / Editar\n                        </button>',
    '                          Ver / Editar\n                        </button>\n                        <button\n                          onClick={() => {\n                            setPrintData(r);\n                            setPrintMode(\'resguardo\');\n                          }}\n                          className="ml-4 text-indigo-600 hover:text-indigo-800 font-medium text-xs"\n                        >\n                          Imprimir PDF\n                        </button>'
);

fs.writeFileSync(file, txt, 'utf8');
console.log('Added print button');
