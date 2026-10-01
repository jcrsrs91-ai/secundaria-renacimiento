const fs = require('fs');
const file = 'src/pages/dashboard/Inventario.jsx';
let txt = fs.readFileSync(file, 'utf8');

// The main modal
txt = txt.replace(
    '<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">',
    '<div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">'
);

// Any other modals that might overflow just in case
txt = txt.replace(
    '<div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">',
    '<div className="fixed inset-0 z-[60] flex items-start justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">'
);

fs.writeFileSync(file, txt, 'utf8');
console.log('Fixed modal alignment');
