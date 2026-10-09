const fs = require('fs');

let c = fs.readFileSync('src/components/CartaResguardoPrint.jsx', 'utf8');

const tOld = `<div className="w-1/4 flex justify-end">
           {/* Replace with exact right logo if you have it */}
           <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">
              Secretaría de Educación
           </div>
        </div>`;

const tNew = `<div className="w-1/4 flex justify-end items-center">
           <img src="/logo-educacion.png" alt="Educación" className="h-14 object-contain" />
        </div>`;

c = c.replace(tOld, tNew);

fs.writeFileSync('src/components/CartaResguardoPrint.jsx', c, 'utf8');
console.log('Fixed right logo');
