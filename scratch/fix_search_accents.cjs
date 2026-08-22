const fs = require('fs');

let c = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');

c = c.replace(
    '  const filteredPendientes = pendientes.filter(p => `${p.nombres} ${p.apellidoPaterno} ${p.apellidoMaterno} ${p.curp}`.toLowerCase().includes(searchAspirantes.toLowerCase()));',
    `  const removeAccents = (str) => {
    return str ? str.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "") : "";
  };
  const filteredPendientes = pendientes.filter(p => removeAccents(\`\${p.nombres} \${p.apellidoPaterno} \${p.apellidoMaterno} \${p.curp}\`).toLowerCase().includes(removeAccents(searchAspirantes).toLowerCase()));`
);

fs.writeFileSync('src/pages/dashboard/ControlEscolar.jsx', c);
console.log("Made search accent-insensitive.");
