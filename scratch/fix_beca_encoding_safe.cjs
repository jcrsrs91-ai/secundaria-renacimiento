const fs = require('fs');
let c = fs.readFileSync('src/components/HojaInscripcionPrint.jsx', 'utf8');

// Use a regex to match the entire Beca line regardless of corrupted characters
const lineRegex = /<div className="col-span-4"><span className="font-bold text-gray-600">Beca:<\/span> <br\/><span className="font-semibold uppercase">\{.*?\s*<\/span><\/div>/;

let match = c.match(lineRegex);
if (!match) {
    console.log("Could not find the Beca line to replace.");
    process.exit(1);
}

// Replace with encoding-safe logic:
// (data.tieneBeca && data.tieneBeca.toUpperCase().startsWith('S')) ? (data.nombreBeca ? data.tieneBeca + " - " + data.nombreBeca : data.tieneBeca) : (data.tieneBeca || "NO")
let newSpan = '<div className="col-span-4"><span className="font-bold text-gray-600">Beca:</span> <br/><span className="font-semibold uppercase">{(data.tieneBeca && data.tieneBeca.toUpperCase().startsWith("S")) ? (data.nombreBeca ? data.tieneBeca + " - " + data.nombreBeca : data.tieneBeca) : (data.tieneBeca || "NO")}</span></div>';

c = c.replace(lineRegex, newSpan);

fs.writeFileSync('src/components/HojaInscripcionPrint.jsx', c);
console.log("Fixed Beca logic with encoding-safe check");
