const fs = require('fs');
const filePath = 'src/pages/dashboard/Contraloria.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix printMode
content = content.replace(
  '<div className={printMode ? "hidden" : "space-y-6"}>',
  '<div className={\space-y-6 \ print:\\}>'
);

// 2. Add receiptPago state
if (!content.includes('const [receiptPago, setReceiptPago] = useState(null);')) {
  content = content.replace(
    "metodo: 'Efectivo', tipo: 'administrativo', fecha: new Date().toISOString().split('T')[0]\n  });",
    "metodo: 'Efectivo', tipo: 'administrativo', fecha: new Date().toISOString().split('T')[0]\n  });\n  const [receiptPago, setReceiptPago] = useState(null);"
  );
}

// 3. Add Corte de Caja tab
if (!content.includes('setActiveTab(\\'corte\\')')) {
  content = content.replace(
    '<FileText className="w-4 h-4 mr-2" /> Historial de Resguardos\n          </button>\n        </nav>',
    '<FileText className="w-4 h-4 mr-2" /> Historial de Resguardos\n          </button>\n          <button\n            onClick={() => setActiveTab(\\'corte\\')}\n            className={\py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center \\}\n          >\n            <Wallet className="w-4 h-4 mr-2" /> Corte de Caja\n          </button>\n        </nav>'
  );
}

// 4. Add receipt button to pagosGenerales table (which uses filteredPagosGenerales)
// The loop is: {(activeIngresoTab === 'generales' ? filteredPagosGenerales : filteredPagosExtra).map((p, idx) => {
// We replace the th for Estado to add Acciones:
content = content.replace(
  '<th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</th>\n                  </tr>',
  '<th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</th>\n                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>\n                  </tr>'
);
// And the td for estado:
content = content.replace(
  '                        </button>\n                      )}\n                    </td>\n                  </tr>',
  '                        </button>\n                      )}\n                    </td>\n                    <td className="px-6 py-4 text-sm text-right space-x-2">\n                      <button onClick={() => setReceiptPago(p)} className="text-slate-400 hover:text-primary-600 transition-colors p-1" title="Imprimir Recibo"><Printer className="w-4 h-4" /></button>\n                    </td>\n                  </tr>'
);

// 5. Add receipt button to pagosRecientes table
content = content.replace(
  '                        )}\n                      </td>\n                    </tr>\n                  ))}',
  '                        )}\n                      </td>\n                      <td className="px-6 py-4 text-sm text-right space-x-2">\n                        <button onClick={() => setReceiptPago(p)} className="text-slate-400 hover:text-primary-600 transition-colors p-1" title="Imprimir Recibo"><Printer className="w-4 h-4" /></button>\n                      </td>\n                    </tr>\n                  ))}'
);

fs.writeFileSync(filePath, content, 'utf8');
