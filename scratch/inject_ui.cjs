const fs = require('fs');

let c = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');

c = c.replace(/\{\/\* Tabla Pendientes \*\/\}\s*\{\!loading && activeTab === 'pendientes' && \(\s*<div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-x-auto">\s*<table/g, 
`{/* Tabla Pendientes */}
        {!loading && activeTab === 'pendientes' && (
          <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-x-auto">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex">
              <input type="text" placeholder="Buscar aspirante por nombre o CURP..." value={searchAspirantes} onChange={(e) => setSearchAspirantes(e.target.value)} className="w-full max-w-md px-4 py-2 border border-slate-300 rounded-md focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
            <table`);

fs.writeFileSync('src/pages/dashboard/ControlEscolar.jsx', c);
console.log("Injected search bar UI");
