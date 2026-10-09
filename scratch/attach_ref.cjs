const fs = require('fs');
let c = fs.readFileSync('src/components/Formato911.jsx', 'utf8');

c = c.replace(/<div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">/, '<div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6" ref={containerRef}>');

fs.writeFileSync('src/components/Formato911.jsx', c, 'utf8');
