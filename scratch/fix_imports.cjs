const fs = require('fs');

let c = fs.readFileSync('src/components/Formato911.jsx', 'utf8');

c = c.replace(`import { FileText, Download, Filter } from 'lucide-react';`, `import { FileText, Download, Filter, AlertTriangle, Info } from 'lucide-react';`);

fs.writeFileSync('src/components/Formato911.jsx', c, 'utf8');
console.log('Fixed imports');
