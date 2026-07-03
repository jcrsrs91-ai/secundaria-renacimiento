const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');

// 1. Remove duplicate formData.articulos.map block
const regexDuplicate = /<div className="space-y-3">\s*\{formData\.articulos\.map\(\(art, idx\) => \(\s*<div key=\{idx\} className="flex gap-2">\s*<div className="w-16">\s*<input type="number" placeholder="Cant" className="w-full rounded-md border-slate-300 text-sm" value=\{art\.cantidad \|\| ''\} onChange=\{\(e\) => \{\s*const newArts = \[\.\.\.formData\.articulos\];\s*newArts\[idx\]\.cantidad = e\.target\.value;\s*setFormData\(\{\.\.\.formData, articulos: newArts\}\);\s*\}\} \/>\s*<\/div>\s*<div className="flex-1">\s*\{formData\.articulos\.map\(\(art, idx\) => \(/;

const replacementDuplicate = `<div className="space-y-3">
                    {formData.articulos.map((art, idx) => (`;

if (regexDuplicate.test(code)) {
    code = code.replace(regexDuplicate, replacementDuplicate);
    console.log('Fixed syntax error in formData.articulos.map!');
} else {
    console.log('Duplicate Target block not found with regex!');
}

// 2. Add the missing closing divs
const targetDivs = `                    ))}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setModalOpen(null)}`;

const replacementDivs = `                    ))}
                  </div>
                </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setModalOpen(null)}`;

if (code.includes(targetDivs)) {
    code = code.replace(targetDivs, replacementDivs);
    console.log('Added missing divs!');
} else {
    console.log('Missing divs Target block not found!');
}

fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', code);
