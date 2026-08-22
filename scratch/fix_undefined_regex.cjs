const fs = require('fs');

let c = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');

c = c.replace(
    /return\s*\(\s*<div\s*className="h-full flex flex-col/g,
    'const filteredPendientes = pendientes.filter(p => `${p.nombres} ${p.apellidoPaterno} ${p.apellidoMaterno} ${p.curp}`.toLowerCase().includes(searchAspirantes.toLowerCase()));\n\n  return (\n    <div className="h-full flex flex-col'
);

fs.writeFileSync('src/pages/dashboard/ControlEscolar.jsx', c);
console.log("Fixed undefined for real real.");
