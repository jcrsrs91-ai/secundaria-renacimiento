const fs = require('fs');
let c = fs.readFileSync('src/pages/public/PreInscripcion.jsx', 'utf8');

// The exact string to remove from section 4
const blockToRemoveRegex = /[ \t]*<div>\s*<label className="block text-sm font-medium">.Cuenta con alguna beca\?<\/label>[\s\S]*?<div id="nombreBecaContainer"[\s\S]*?<\/div>/;

let match = c.match(blockToRemoveRegex);
if (!match) {
    console.log("Could not find the beca block");
    process.exit(1);
}
let becaBlock = match[0];
c = c.replace(becaBlock, '');

// Now insert it in section 2
let insertPointRegex = /<label className="block text-sm font-medium text-slate-700">C.digo Postal<\/label>\s*<input type="text" name="cp" required className="mt-1 block w-full rounded-md shadow-sm p-2 border" defaultValue={studentData\?\.cp} \/>\s*<\/div>/;

let insertMatch = c.match(insertPointRegex);
if (!insertMatch) {
    console.log("Could not find insertion point");
    process.exit(1);
}

c = c.replace(insertPointRegex, insertMatch[0] + '\n' + becaBlock);

fs.writeFileSync('src/pages/public/PreInscripcion.jsx', c);
console.log("Moved beca safely");
