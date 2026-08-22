const fs = require('fs');
let c = fs.readFileSync('src/components/HojaInscripcionPrint.jsx', 'utf8');

let startIndex = c.indexOf('{/* SEGUNDA P');
if (startIndex === -1) {
    console.log("Could not find start");
    process.exit(1);
}

let styleIndex = c.indexOf('<style dangerouslySetInnerHTML={{__html: `');
if (styleIndex === -1) {
    console.log("Could not find end");
    process.exit(1);
}

// Remove from startIndex up to styleIndex
c = c.substring(0, startIndex) + c.substring(styleIndex);

fs.writeFileSync('src/components/HojaInscripcionPrint.jsx', c);
console.log("Removed second page");
