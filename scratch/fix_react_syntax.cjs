const fs = require('fs');

let c = fs.readFileSync('src/components/HojaDeVida.jsx', 'utf8');

c = c.replace(
    /<button onClick=\{startCamera\} type="button" className="px-4 py-1\.5 bg-slate-800 text-white text-xs font-bold rounded shadow hover:bg-slate-900 flex items-center">\s*<Camera className="w-3 h-3 mr-1\.5" \/> Tomar Foto\s*<\/button>\s*<label className="px-4 py-1\.5 bg-emerald-600 text-white text-xs font-bold rounded shadow hover:bg-emerald-700 flex items-center cursor-pointer ml-2">\s*<Upload className="w-3 h-3 mr-1\.5" \/> Subir\s*<input type="file" accept="image\/\*" className="hidden" onChange=\{handleFileUpload\} \/>\s*<\/label>/,
    `<div className="flex">
        <button onClick={startCamera} type="button" className="px-4 py-1.5 bg-slate-800 text-white text-xs font-bold rounded shadow hover:bg-slate-900 flex items-center">
            <Camera className="w-3 h-3 mr-1.5" /> Tomar Foto
        </button>
        <label className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded shadow hover:bg-emerald-700 flex items-center cursor-pointer ml-2">
            <Upload className="w-3 h-3 mr-1.5" /> Subir
            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
        </label>
    </div>`
);

fs.writeFileSync('src/components/HojaDeVida.jsx', c);
console.log("Wrapped in div");
