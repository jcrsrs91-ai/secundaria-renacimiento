const fs = require('fs');
let c = fs.readFileSync('src/App.jsx', 'utf8');

if (!c.includes('import Inventario from')) {
  c = c.replace(/import Contraloria from '.\/pages\/dashboard\/Contraloria';/, "import Contraloria from './pages/dashboard/Contraloria';\nimport Inventario from './pages/dashboard/Inventario';");
}

if (!c.includes('<Route path="inventario"')) {
  c = c.replace(/<Route path="contraloria" element=\{<Contraloria \/>\} \/>/, "<Route path=\"contraloria\" element={<Contraloria />} />\n            <Route path=\"inventario\" element={<Inventario />} />");
}

fs.writeFileSync('src/App.jsx', c);
console.log("App.jsx updated");
