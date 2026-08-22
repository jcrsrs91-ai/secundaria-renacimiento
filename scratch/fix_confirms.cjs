const fs = require('fs');
let c = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');
c = c.replace(/window\.confirm\("([^"]*)"/g, (match, p1) => {
    return 'window.confirm("' + p1.replace(/\r?\n/g, '\\n') + '"';
});
fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', c);
console.log("Fixed all window confirms");
