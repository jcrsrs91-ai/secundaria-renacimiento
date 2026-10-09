const fs = require('fs');
let c = fs.readFileSync('src/components/Formato911.jsx', 'utf8');

const regexOldButton = /<button onClick=\{handleSave\} disabled=\{isSaving\}[\s\S]*?<\/button>\s*/;

c = c.replace(regexOldButton, "");

fs.writeFileSync('src/components/Formato911.jsx', c, 'utf8');
