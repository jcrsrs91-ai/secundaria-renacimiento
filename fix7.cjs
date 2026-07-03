const fs = require('fs');

let code = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');
const lines = code.split('\n');

const targetLineString = '<div className="flex justify-end gap-3 pt-4 border-t border-slate-200">';

let lastIndex = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(targetLineString)) {
        lastIndex = i;
    }
}

if (lastIndex !== -1) {
    // Insert the two missing closing divs right before the last occurrence of the button container
    lines.splice(lastIndex, 0, '                  </div>', '                </div>');
    fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', lines.join('\n'));
    console.log('Fixed missing divs by inserting at line ' + lastIndex);
} else {
    console.log('Target line string not found at all!');
}
