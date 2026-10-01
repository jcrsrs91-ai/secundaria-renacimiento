const fs = require('fs');

let inv = fs.readFileSync('src/pages/dashboard/Inventario.jsx', 'utf8');
inv = inv.replace(
  "<CartaResguardoPrint data={printData} />",
  "<CartaResguardoPrint data={printData} onBack={() => setPrintMode(null)} />"
);
fs.writeFileSync('src/pages/dashboard/Inventario.jsx', inv, 'utf8');

let print = fs.readFileSync('src/components/CartaResguardoPrint.jsx', 'utf8');

// Replace the invalid characters Jurez, Contralora, etc.
print = print.replace(/Jurez/g, 'Juárez')
             .replace(/Contralora/g, 'Contraloría')
             .replace(/rea/g, 'Área')
             .replace(/Tcnica N/g, 'Técnica N°')
             .replace(/Descripcin del Artculo/g, 'Descripción del Artículo')
             .replace(/Estado Fsico/g, 'Estado Físico')
             .replace(/Entreg/g, 'Entregó')
             .replace(/trmino/g, 'término')
             .replace(/adscripcin/g, 'adscripción')
             .replace(/deber/g, 'deberá')
             .replace(/liberacin/g, 'liberación')
             .replace(/extravo/g, 'extravío')
             .replace(/continuacin/g, 'continuación')
             .replace(/comprometindose/g, 'comprometiéndose');

// Make visible on screen, add buttons
print = print.replace(
  "export default function CartaResguardoPrint({ data }) {",
  "export default function CartaResguardoPrint({ data, onBack }) {"
);

print = print.replace(
  "        @media screen {\n          .print-resguardo-only { display: none !important; }\n        }",
  "        @media screen {\n          .print-resguardo-only { padding: 2rem; max-width: 800px; margin: 0 auto; background: white; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); border-radius: 0.5rem; }\n        }"
);

// Add the buttons at the top of the component
print = print.replace(
  '<div className="bg-white text-slate-800 font-sans leading-relaxed text-justify relative z-10" style={{ fontSize: \'11pt\' }}>',
  '<div className="no-print flex justify-end gap-4 mb-6 border-b pb-4"><button onClick={onBack} className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium">Cerrar</button><button onClick={() => window.print()} className="px-6 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-bold shadow-sm">Imprimir Documento</button></div>\n      <div className="bg-white text-slate-800 font-sans leading-relaxed text-justify relative z-10" style={{ fontSize: \'11pt\' }}>'
);

// Fix formatDate to handle Timestamps properly
print = print.replace(
  "const formatDate = (dateString) => {",
  "const formatDate = (dateString) => {\n    if (dateString && dateString.toDate) {\n      const d = dateString.toDate();\n      return `${d.getDate()} de ${d.toLocaleString('es-MX', { month: 'long' })} de ${d.getFullYear()}`;\n    }"
);

fs.writeFileSync('src/components/CartaResguardoPrint.jsx', print, 'utf8');
console.log('Fixed CartaResguardoPrint');
