const fs = require('fs');

let inv = fs.readFileSync('src/pages/dashboard/Inventario.jsx', 'utf8');

// Change `print:${receiptPago ? "hidden" : "block"}` to hide the main UI when printing a resguardo, recepcion, etc.
inv = inv.replace(
  'print:${receiptPago ? "hidden" : "block"}',
  'print:${(receiptPago || printMode) ? "hidden" : "block"}'
);

fs.writeFileSync('src/pages/dashboard/Inventario.jsx', inv, 'utf8');
console.log('Fixed print layout visibility in Inventario');
