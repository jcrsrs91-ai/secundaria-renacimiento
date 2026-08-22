const fs = require('fs');
const filePath = 'src/pages/dashboard/Contraloria.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add printMode logic correctly
content = content.replace(
  '<div className={printMode ? "hidden" : "space-y-6"}>',
  '<div className={\space-y-6 \ print:\\}>'
);

// 2. Add corte de caja tab correctly
const navOriginal = '<FileText className="w-4 h-4 mr-2" /> Historial de Resguardos\\n          </button>\\n        </nav>';
const navNuevo = '<FileText className="w-4 h-4 mr-2" /> Historial de Resguardos\\n          </button>\\n          <button\\n            onClick={() => setActiveTab(\\'corte\\')}\\n            className={\py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center \\}\\n          >\\n            <Wallet className="w-4 h-4 mr-2" /> Corte de Caja\\n          </button>\\n        </nav>';
content = content.replace(navOriginal, navNuevo);

// 3. Add receiptPago state
const stateOriginal = '  const [pagoFormData, setPagoFormData] = useState({\\n    nombre: \\'\\', conceptosList: [{ concepto: \\'\\', monto: \\'\\' }], metodo: \\'Efectivo\\', tipo: \\'administrativo\\', fecha: new Date().toISOString().split(\\'T\\')[0]\\n  });';
const stateNuevo = '  const [pagoFormData, setPagoFormData] = useState({\\n    nombre: \\'\\', conceptosList: [{ concepto: \\'\\', monto: \\'\\' }], metodo: \\'Efectivo\\', tipo: \\'administrativo\\', fecha: new Date().toISOString().split(\\'T\\')[0]\\n  });\\n  const [receiptPago, setReceiptPago] = useState(null);';
content = content.replace(stateOriginal, stateNuevo);


// 4. Add Quick Filters to Corte de Caja
const filtrosOriginal = '              <div className="space-y-4">\\n                  <div className="grid grid-cols-2 gap-4">';
const filtrosNuevo = '              <div className="space-y-4">\\n                <div className="flex flex-wrap gap-2 mb-4">\\n                  <span className="text-xs font-bold text-slate-500 py-1.5">Filtros Rápidos:</span>\\n                  <button type="button" onClick={() => {\\n                    const hoy = new Date().toISOString().split(\\'T\\')[0];\\n                    setCorteConfig(prev => ({...prev, fechaInicio: hoy, fechaFin: hoy}));\\n                  }} className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-colors">Hoy (Diario)</button>\\n                  <button type="button" onClick={() => {\\n                    const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1);\\n                    const e = new Date(d); e.setDate(d.getDate() + 6);\\n                    setCorteConfig(prev => ({...prev, fechaInicio: d.toISOString().split(\\'T\\')[0], fechaFin: e.toISOString().split(\\'T\\')[0]}));\\n                  }} className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-colors">Esta Semana</button>\\n                  <button type="button" onClick={() => {\\n                    const d = new Date();\\n                    const s = new Date(d.getFullYear(), d.getMonth(), 1);\\n                    const e = new Date(d.getFullYear(), d.getMonth() + 1, 0);\\n                    setCorteConfig(prev => ({...prev, fechaInicio: \\-\-01\, fechaFin: \\-\-\\}));\\n                  }} className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-colors">Este Mes</button>\\n                  <button type="button" onClick={() => {\\n                    const y = new Date().getFullYear();\\n                    setCorteConfig(prev => ({...prev, fechaInicio: \\-01-01\, fechaFin: \\-12-31\}));\\n                  }} className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-colors">Este Año</button>\\n                </div>\\n                <div className="grid grid-cols-2 gap-4">';
content = content.replace(filtrosOriginal, filtrosNuevo);

fs.writeFileSync(filePath, content, 'utf8');
