const fs = require('fs');
let file = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');

file = file.replace(/<\/div>\s*< \/div>|<\/div>\s*\)\s*;\s*\}/g, match => {
  return `      {selectedExpediente && (
        <ExpedienteModal 
          student={selectedExpediente} 
          onClose={() => setSelectedExpediente(null)} 
        />
      )}\n` + match;
});

// Since the regex might not be perfect, let's just do:
file = file.replace(/\{printMode === 'concentrado-parcial' && <CuadroParcialPrint.*?\/>\}/, 
  "$& \n      {selectedExpediente && (\n        <ExpedienteModal \n          student={selectedExpediente} \n          onClose={() => setSelectedExpediente(null)} \n        />\n      )}");


fs.writeFileSync('src/pages/dashboard/ControlEscolar.jsx', file);
console.log('Added modal rendering');
