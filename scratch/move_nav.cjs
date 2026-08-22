const fs = require('fs');

let c = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');

const searchStr = `{(!cajaTurno && (activeTab === 'pagos' || activeTab === 'gastos' || activeTab === 'corte')) ? (
         <CajaLockScreen userEmail={currentUser?.email} onCajaAbierta={(id, turno, fondo) => setCajaTurno({id, turno, fondoInicial: fondo})} />
      ) : (
        <>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Contralora</h2>
          <p className="text-slate-500 text-sm">Control de ingresos (trǭmites) e inventario del mobiliario escolar.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pagos')}
            className={\`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center \${activeTab === 'pagos' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}\`}
          >
            <DollarSign className="w-4 h-4 mr-2" /> Registro de Pagos
          </button>
          <button
            onClick={() => setActiveTab('inventario')}
            className={\`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center \${activeTab === 'inventario' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}\`}
          >
            <Package className="w-4 h-4 mr-2" /> Inventario Escolar
          </button>
          <button
            onClick={() => setActiveTab('resguardos')}
            className={\`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center \${activeTab === 'resguardos' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}\`}
          >
            <FileText className="w-4 h-4 mr-2" /> Historial de Resguardos
          </button>
          <button
            onClick={() => setActiveTab('corte')}
            className={\`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center \${activeTab === 'corte' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}\`}
          >
            <Wallet className="w-4 h-4 mr-2" /> Corte de Caja
          </button>
        </nav>
      </div>`;

// Check if string matches first
let searchRegex = /\{\(\!cajaTurno[\s\S]*?Corte de Caja\s*<\/button>\s*<\/nav>\s*<\/div>/;

if(searchRegex.test(c)) {
  const replacement = `<div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Contraloría</h2>
          <p className="text-slate-500 text-sm">Control de ingresos (trámites) e inventario del mobiliario escolar.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex flex-wrap gap-y-2 space-x-8">
          <button
            onClick={() => setActiveTab('pagos')}
            className={\`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center \${activeTab === 'pagos' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}\`}
          >
            <DollarSign className="w-4 h-4 mr-2" /> Registro de Pagos
          </button>
          <button
            onClick={() => setActiveTab('inventario')}
            className={\`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center \${activeTab === 'inventario' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}\`}
          >
            <Package className="w-4 h-4 mr-2" /> Inventario Escolar
          </button>
          <button
            onClick={() => setActiveTab('resguardos')}
            className={\`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center \${activeTab === 'resguardos' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}\`}
          >
            <FileText className="w-4 h-4 mr-2" /> Historial de Resguardos
          </button>
          <button
            onClick={() => setActiveTab('corte')}
            className={\`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center \${activeTab === 'corte' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}\`}
          >
            <Wallet className="w-4 h-4 mr-2" /> Corte de Caja
          </button>
        </nav>
      </div>
      
      {(!cajaTurno && (activeTab === 'pagos' || activeTab === 'gastos' || activeTab === 'corte')) ? (
         <CajaLockScreen userEmail={currentUser?.email} onCajaAbierta={(id, turno, fondo) => setCajaTurno({id, turno, fondoInicial: fondo})} />
      ) : (
        <>`;
  
  c = c.replace(searchRegex, replacement);
  fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', c);
  console.log("Success!");
} else {
  console.log("Not found!");
}
