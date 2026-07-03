const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');

const regex = /<div className="space-y-3">\s*\{formData\.articulos\.map\(\(art, idx\) => \(\s*<div key=\{idx\} className="flex gap-2">\s*<div className="w-16">\s*<input type="number" placeholder="Cant" className="w-full rounded-md border-slate-300 text-sm" value=\{art\.cantidad \|\| ''\} onChange=\{\(e\) => \{\s*const newArts = \[\.\.\.formData\.articulos\];\s*newArts\[idx\]\.cantidad = e\.target\.value;\s*setFormData\(\{\.\.\.formData, articulos: newArts\}\);\s*\}\} \/>\s*<\/div>\s*<div className="flex-1">\s*\{formData\.articulos\.map\(\(art, idx\) => \(/;

const replacement = `<div className="space-y-3">
                    {formData.articulos.map((art, idx) => (`;

if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', code);
    console.log('Fixed syntax error in formData.articulos.map!');
} else {
    console.log('Target block not found with regex!');
}
