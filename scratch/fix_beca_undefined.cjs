const fs = require('fs');
let c = fs.readFileSync('src/components/HojaInscripcionPrint.jsx', 'utf8');

c = c.replace('"SÍ - " + data.nombreBeca', 'data.nombreBeca ? "SÍ - " + data.nombreBeca : "SÍ"');

fs.writeFileSync('src/components/HojaInscripcionPrint.jsx', c);
console.log("Fixed undefined");
