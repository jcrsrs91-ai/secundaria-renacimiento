const fs = require('fs');
let c = fs.readFileSync('src/components/HojaInscripcionPrint.jsx', 'utf8');

c = c.replace('data.tieneBeca === "Sí"', 'data.tieneBeca === "SÍ"');

// Wait, let's also make it case insensitive or check both just in case!
c = c.replace('data.tieneBeca === "SÍ"', '(data.tieneBeca === "SÍ" || data.tieneBeca === "Sí")');

fs.writeFileSync('src/components/HojaInscripcionPrint.jsx', c);
console.log("Fixed Beca logic");
