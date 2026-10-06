const fs = require('fs');
let content = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');
content = content.replace(
  "<BecasReport activos={directorio} onClose={() => setActiveTab('activos')} />",
  "<BecasReport activos={activos} onClose={() => setActiveTab('activos')} />"
);
fs.writeFileSync('src/pages/dashboard/ControlEscolar.jsx', content, 'utf8');
