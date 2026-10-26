import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function EtiquetasPrint({ items, onBack }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="print-etiquetas-only bg-white min-h-screen">
      <style>{`
        @media print {
          @page { size: letter; margin: 1cm; }
          html, body, #root { height: auto !important; overflow: visible !important; min-height: auto !important; display: block !important; }
          * { overflow: visible !important; }
          aside, header { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; margin: 0; }
          .no-print { display: none !important; }
          .print-etiquetas-only { display: block !important; }
        }
        @media screen {
          .print-etiquetas-only { padding: 2rem; max-width: 850px; margin: 2rem auto; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); border-radius: 0.75rem; display: block !important; }
        }
      `}</style>

      <div className="no-print flex justify-between items-center gap-4 mb-6 border-b border-slate-200 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
            Vista Previa — {items.length} Etiquetas QR
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => (onBack ? onBack() : window.location.reload())}
            className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium text-sm"
          >
            Volver al Inventario
          </button>
          <button
            onClick={() => window.print()}
            className="px-6 py-2 bg-slate-800 text-white hover:bg-slate-900 rounded-lg font-bold shadow-sm text-sm"
          >
            Imprimir Etiquetas
          </button>
        </div>
      </div>

      <div className="bg-white text-slate-800 font-sans relative z-10">
        <h2 className="text-center font-bold text-xl mb-6 text-slate-700 tracking-widest uppercase">Planilla de Etiquetas de Inventario</h2>
        
        {/* Grid de Etiquetas - Usamos un grid que se ajusta a 3 columnas en papel carta */}
        <div className="grid grid-cols-3 gap-x-4 gap-y-6">
          {items.map((item, idx) => (
            <div key={idx} className="border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center text-center page-break-inside-avoid shadow-sm bg-white">
              <h3 className="font-black text-xs uppercase tracking-wider mb-2">EST 68 Renacimiento</h3>
              
              <div className="bg-white p-2 border border-slate-200 rounded-lg mb-2">
                <QRCodeSVG 
                  value={item.codigo || 'S/N'} 
                  size={100}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <p className="font-bold text-[14px] text-slate-900 font-mono tracking-tight">{item.codigo}</p>
              <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 px-2 leading-tight h-8 flex items-center justify-center">
                {item.articulo || item.descripcion}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
