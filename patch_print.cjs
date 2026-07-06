const fs = require('fs');

let file = fs.readFileSync('src/components/HojaInscripcionPrint.jsx', 'utf8');

// 1. Add Ciclo Escolar to header
file = file.replace(
  /<h3 className="text-xs font-semibold">Esc\. Sec\. Téc\. N°68 "RENACIMIENTO"<\/h3>/,
  `<h3 className="text-xs font-semibold">Esc. Sec. Téc. N°68 "RENACIMIENTO"</h3>
            <p className="text-[10px] font-bold mt-0.5 text-slate-700">CICLO ESCOLAR: {data.cicloEscolar || '2024-2025'}</p>`
);

// 2. Change Comprobante to Carta de Conducta
file = file.replace(
  /\{hasDoc\('comprobante'\)\}<\/span> Comprobante Domicilio/,
  `{hasDoc('conducta')}</span> Carta de Conducta`
);

fs.writeFileSync('src/components/HojaInscripcionPrint.jsx', file);
console.log('HojaInscripcionPrint updated.');
