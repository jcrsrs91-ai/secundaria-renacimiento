const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');

const regex = /<\/div>\s*\}\)\}\s*<div className="flex justify-end gap-3 pt-4 border-t border-slate-200">/g;
let matchCount = 0;
code = code.replace(regex, (match) => {
    matchCount++;
    if (matchCount === 2) {
        return `</div>
                    ))}
                  </div>
                </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">`;
    }
    return match;
});

if (matchCount > 0) {
    fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', code);
    console.log('Fixed missing divs using regex! Match count: ' + matchCount);
} else {
    console.log('Target regex not found!');
}
