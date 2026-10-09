const fs = require('fs');

let c = fs.readFileSync('src/components/CartaResguardoPrint.jsx', 'utf8');

c = c.replace('className="flex mb-8 text-[10px]"', 'className="flex mb-2 text-[10px]"');
c = c.replace(/p-1\.5/g, 'p-1');
c = c.replace(/min-h-\[70px\]/g, 'min-h-[50px]');
c = c.replace(/mb-2/g, 'mb-1');
c = c.replace(/mb-4/g, 'mb-2');
c = c.replace('min-h-screen', '');

// Adjust margin print
c = c.replace('@page { size: landscape; margin: 0.5cm; }', '@page { size: landscape; margin: 0.4cm; }');

fs.writeFileSync('src/components/CartaResguardoPrint.jsx', c, 'utf8');
console.log('Fixed margins');
