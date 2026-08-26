const fs = require('fs');

let file = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');

// Strip ALL `selectedExpediente && ` blocks
file = file.replace(/\{selectedExpediente && \([\s\S]*?<\/ExpedienteModal>\s*\)\}/g, '');

// Clean up weird double ends
file = file.replace(/<\/div>\s*\);\s*\}\s*<\/div>\s*\);\s*\}/g, '</div>\n  );\n}');
file = file.replace(/<\/div>\s*\n\s*<\/div>\s*\);\s*\}/g, '</div>\n  );\n}');
file = file.replace(/<\/div>\s*<\/div>\s*\);\s*\}/g, '</div>\n  );\n}');

const target = "{printMode === 'concentrado-parcial' && <CuadroParcialPrint alumnos={printData.alumnos} materias={materiasPorGrado[printData.grado]} grado={printData.grado} grupo={printData.grupo} />}";

if (file.includes(target)) {
  file = file.replace(target, target + "\n\n      {selectedExpediente && (\n        <ExpedienteModal \n          student={selectedExpediente} \n          onClose={() => setSelectedExpediente(null)} \n        />\n      )}");
}

fs.writeFileSync('src/pages/dashboard/ControlEscolar.jsx', file);
console.log('Fixed properly');
