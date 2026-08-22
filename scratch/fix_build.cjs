const fs = require('fs');

// Fix Inventario.jsx import
let inv = fs.readFileSync('src/pages/dashboard/Inventario.jsx', 'utf8');
inv = inv.replace('../../firebase/config', '../../firebase');
fs.writeFileSync('src/pages/dashboard/Inventario.jsx', inv);

// Fix Contraloria.jsx syntax error
let con = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');
con = con.replace(/\s*\/>\s*\)\}/g, (match, offset, string) => {
    // Only replace if it's near the top-level modals and looks like an orphan
    if (offset > string.length - 5000) {
        return "";
    }
    return match;
});

// A safer way: just explicitly target the broken lines before showPagoAdminModal
con = con.replace(/(\n\s*)\/>\n\s*\)\}\n(\s*\{showPagoAdminModal && \()/, "$1$2");

fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', con);
console.log("Fixed!");
