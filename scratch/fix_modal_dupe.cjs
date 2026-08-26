const fs = require('fs');
let file = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');

file = file.replace(/\{selectedExpediente && \([\s\S]*?<\/ExpedienteModal>\s*\)\}/g, '');
file = file.replace(/<\/div>\s*< \/div>|<\/div>\s*\)\s*;\s*\}/g, match => {
  return `      {selectedExpediente && (
        <ExpedienteModal 
          student={selectedExpediente} 
          onClose={() => setSelectedExpediente(null)} 
        />
      )}\n` + match;
});

// Since the regex might not be perfect, let's just insert it before the last `</div>`
let file2 = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');
file2 = file2.replace(/\{selectedExpediente && \([\s\S]*?<\/ExpedienteModal>\s*\)\}/g, '');
const parts = file2.split('</div>\n  );\n}');
file2 = parts[0] + `
      {selectedExpediente && (
        <ExpedienteModal 
          student={selectedExpediente} 
          onClose={() => setSelectedExpediente(null)} 
        />
      )}
    </div>
  );
}`;

fs.writeFileSync('src/pages/dashboard/ControlEscolar.jsx', file2);
console.log('Fixed modal rendering duplicates');
