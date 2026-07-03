const fs = require('fs');

let code = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');

// 1. Fix Duplicate Block
const regexDuplicate = /<div className="space-y-3">\s*\{formData\.articulos\.map\(\(art, idx\) => \(\s*<div key=\{idx\} className="flex gap-2">\s*<div className="w-16">\s*<input type="number" placeholder="Cant" className="w-full rounded-md border-slate-300 text-sm" value=\{art\.cantidad \|\| ''\} onChange=\{\(e\) => \{\s*const newArts = \[\.\.\.formData\.articulos\];\s*newArts\[idx\]\.cantidad = e\.target\.value;\s*setFormData\(\{\.\.\.formData, articulos: newArts\}\);\s*\}\} \/>\s*<\/div>\s*<div className="flex-1">\s*\{formData\.articulos\.map\(\(art, idx\) => \(/;

const replacementDuplicate = `<div className="space-y-3">
                    {formData.articulos.map((art, idx) => (`;

if (regexDuplicate.test(code)) {
    code = code.replace(regexDuplicate, replacementDuplicate);
    console.log('Fixed duplicate formData.articulos.map block!');
} else {
    console.log('Duplicate block not found!');
}

// 2. Fix Missing Divs
// The target is to find where `                    ))}` is followed by `<div className="flex justify-end gap-3 pt-4 border-t border-slate-200">`
// Note: We'll target the last occurrence using a function to be safe.
const targetRegex = /\s*\}\)\}\s*<div className="flex justify-end gap-3 pt-4 border-t border-slate-200">\s*<button type="button" onClick=\{\(\) => setModalOpen\(null\)\}/g;

let matchCount = 0;
code = code.replace(targetRegex, (match) => {
    matchCount++;
    if (matchCount === 2) {
        return `
                    ))}
                  </div>
                </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setModalOpen(null)}`;
    }
    return match;
});

if (matchCount > 0) {
    console.log('Fixed missing divs! Replaced instance: ' + matchCount);
} else {
    console.log('Missing divs target not found!');
}

fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', code);
