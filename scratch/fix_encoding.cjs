const fs = require('fs');

const path = 'src/components/HojaInscripcionPrint.jsx';
let c = fs.readFileSync(path, 'utf8');

// The file was likely written with double-utf8 encoding by mistake.
// Let's decode it safely.
let decoded = Buffer.from(c, 'latin1').toString('utf8');

// If there's a replacement character from a BOM or something, clean it.
decoded = decoded.replace(/\uFFFD/g, '');

// Verify if the decoded version is valid. If it has "Aportación", it worked.
if (decoded.includes('Aportación')) {
    fs.writeFileSync(path, decoded, 'utf8');
    console.log("Fixed Mojibake in HojaInscripcionPrint.jsx");
} else {
    console.log("Failed to fix, string not found.");
}
