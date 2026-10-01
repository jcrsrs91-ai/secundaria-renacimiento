const fs = require('fs');

let inv = fs.readFileSync('src/pages/dashboard/Inventario.jsx', 'utf8');

// Change `print:${(receiptPago || printMode) ? "hidden" : "block"}` to explicit Tailwind classes
inv = inv.replace(
  'print:${(receiptPago || printMode) ? "hidden" : "block"}',
  '${(receiptPago || printMode) ? "print:hidden" : "print:block"}'
);

fs.writeFileSync('src/pages/dashboard/Inventario.jsx', inv, 'utf8');
console.log('Fixed Tailwind explicit print classes');
