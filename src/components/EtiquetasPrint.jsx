import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function EtiquetasPrint({ items }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="print-etiquetas-only">
      <style>{`
        @media print {
          @page { size: letter; margin: 1cm; }
          html, body, #root { height: auto !important; overflow: visible !important; min-height: auto !important; display: block !important; }
          * { overflow: visible !important; }
          aside, header { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; margin: 0; }
          .print-etiquetas-only { display: block !important; }
        }
        @media screen {
          .print-etiquetas-only { display: none !important; }
        }
      `}</style>

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
                {item.articulo}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
