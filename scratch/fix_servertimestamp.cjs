const fs = require('fs');

let c = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');

if (!c.includes('serverTimestamp')) {
  // It is included in the code but not imported. Wait, let me check if it's imported.
}

c = c.replace(/import\s+\{([^}]*)\}\s+from\s+'firebase\/firestore';/, (match, p1) => {
  if (!p1.includes('serverTimestamp')) {
    return `import { ${p1.trim()}, serverTimestamp } from 'firebase/firestore';`;
  }
  return match;
});

fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', c);
console.log('Fixed serverTimestamp import');
