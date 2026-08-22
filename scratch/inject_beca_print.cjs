const fs = require('fs');
let c = fs.readFileSync('src/components/HojaInscripcionPrint.jsx', 'utf8');

// I need to find the line with "C.P."
let match = c.match(/C\.P\.:<\/span>[\s\S]*?<\/div>\s*<\/div>/);
if (match) {
    let insertPoint = match[0];
    let newFields = insertPoint + '\n          <div className="grid grid-cols-4 gap-1 text-[9px] border border-gray-300 border-t-0 p-1 mb-1 leading-tight">\n            <div className="col-span-4"><span className="font-bold text-gray-600">Beca:</span> <br/><span className="font-semibold uppercase">{data.tieneBeca === "Sí" ? "SÍ - " + data.nombreBeca : (data.tieneBeca || "NO")}</span></div>\n          </div>';
    
    // Check if I already injected it
    if (!c.includes("Beca:</span>")) {
        c = c.replace(insertPoint, newFields);
        fs.writeFileSync('src/components/HojaInscripcionPrint.jsx', c);
        console.log("Injected Beca into Print");
    } else {
        console.log("Already exists");
    }
} else {
    console.log("Could not find insert point.");
}
