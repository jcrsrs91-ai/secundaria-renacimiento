const fs = require('fs');
const file = 'src/pages/dashboard/ControlEscolar.jsx';
let code = fs.readFileSync(file, 'utf8');

// Inject the BecasReport import
if (!code.includes('import BecasReport')) {
  code = code.replace(
    "import NoInscritosPrint from '../../components/NoInscritosPrint';",
    "import NoInscritosPrint from '../../components/NoInscritosPrint';\nimport BecasReport from '../../components/BecasReport';"
  );
}

// Inject the tab button next to 'activos'
const btnActivos = `<button onClick={() => setActiveTab('activos')} className={\`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm \${activeTab === 'activos' ? 'bg-primary-600 text-white shadow-primary-200 ring-2 ring-primary-600 ring-offset-1' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'}\`}>`;

if (!code.includes("setActiveTab('becas')")) {
  const becasBtn = `
          {/* Becas */}
          <button onClick={() => setActiveTab('becas')} className={\`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm \${activeTab === 'becas' ? 'bg-emerald-600 text-white shadow-emerald-200 ring-2 ring-emerald-600 ring-offset-1' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'}\`}>
            Control de Becas
          </button>
  `;
  code = code.replace(btnActivos, becasBtn + '\n' + btnActivos);
}

// Inject the render section at the end of the file
if (!code.includes("activeTab === 'becas'")) {
  const becasRender = `
        {/* Seccin Becas */}
        {!loading && activeTab === 'becas' && !printMode && (
          <BecasReport activos={activos} onClose={() => setActiveTab('activos')} />
        )}
  `;
  // Add it before the closing of the main div
  code = code.replace(
    "      </div>\n    </DashboardLayout>",
    becasRender + "\n      </div>\n    </DashboardLayout>"
  );
}

fs.writeFileSync(file, code, 'utf8');
console.log('Modified ControlEscolar.jsx');
