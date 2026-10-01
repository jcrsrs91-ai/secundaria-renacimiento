const fs = require('fs');

let layout = fs.readFileSync('src/layouts/DashboardLayout.jsx', 'utf8');

layout = layout.replace(
  '<aside className="w-64 bg-slate-900 text-slate-300 flex flex-col transition-all">',
  '<aside className="w-64 bg-slate-900 text-slate-300 flex flex-col transition-all print:hidden">'
);

layout = layout.replace(
  '<header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">',
  '<header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10 print:hidden">'
);

fs.writeFileSync('src/layouts/DashboardLayout.jsx', layout, 'utf8');
console.log('Added print:hidden to sidebar and header');
