import React from 'react';

export default function ActaBajaPrint({ data }) {
  if (!data) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '___ de __________ de 202_';
    const d = new Date(dateString + 'T00:00:00');
    return `${d.getDate()} de ${d.toLocaleString('es-MX', { month: 'long' })} de ${d.getFullYear()}`;
  };

  return (
    <div className="print-baja-only">
      <style>{`
        @media print {
          @page { size: letter; margin: 1.0cm; }
          html, body, #root { height: auto !important; overflow: visible !important; min-height: auto !important; display: block !important; }
          * { overflow: visible !important; }
          aside, header { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; margin: 0; }
          .print-baja-only { display: block !important; }
        }
        @media screen {
          .print-baja-only { display: none !important; }
        }
      `}</style>
      
      <div className="bg-white text-slate-800 font-sans leading-relaxed text-justify relative z-10" style={{ fontSize: '11pt' }}>
         <div className="flex justify-between items-center mb-4 border-b border-slate-300 pb-3">
            <img src="/logo-sep.png" alt="SEP Guerrero" className="h-12 object-contain" />
            <div className="text-center px-4 flex-1">
              <h1 className="font-black text-lg text-slate-800 uppercase tracking-wider">Escuela Secundaria Técnica N° 68 "Renacimiento"</h1>
              <h2 className="font-bold text-sm text-slate-600 uppercase mt-0.5">Contraloría Interna</h2>
              <h3 className="font-bold text-xs mt-1.5 bg-rose-100 border border-rose-200 text-rose-800 inline-block px-3 py-1 rounded-full tracking-widest">ACTA DE BAJA DE BIENES</h3>
            </div>
            <img src="/logo-escuela.png" alt="EST 68" className="h-14 object-contain" />
         </div>

         <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 shadow-sm">
              <p className="font-black text-slate-700 mb-1 uppercase text-[10px] tracking-widest">Información del Acta</p>
              <p><strong>Lugar y Fecha:</strong> Acapulco de Juárez, Gro., a {formatDate(data.fecha)}.</p>
              <p className="mt-1"><strong>Hora:</strong> {data.hora || '_______ hrs.'}</p>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 shadow-sm">
              <p className="font-black text-slate-700 mb-1 uppercase text-[10px] tracking-widest">Motivo de la Baja</p>
              <p className="font-bold text-rose-700 mt-1">{data.motivo || 'Deterioro / Obsoleto / Destrucción'}</p>
            </div>
         </div>

         <p className="mb-3 text-[10pt] text-slate-700 leading-relaxed px-1">
            Por medio de la presente acta administrativa, se hace constar la <strong>baja definitiva</strong> del inventario escolar de los siguientes bienes muebles y/o equipos, debido a las condiciones en las que se encuentran:
         </p>

         <div className="rounded-lg overflow-hidden border border-slate-300 mb-4">
           <table className="w-full text-[9pt] text-left">
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-300">
                <tr>
                  <th className="p-2 w-12 text-center border-r border-slate-300">Cant.</th>
                  <th className="p-2 w-28 border-r border-slate-300">Código</th>
                  <th className="p-2 border-r border-slate-300">Descripción del Artículo</th>
                  <th className="p-2 w-32 border-r border-slate-300">Ubicación Anterior</th>
                  <th className="p-2 w-24 text-center">Estado Final</th>
                </tr>
              </thead>
            <tbody className="divide-y divide-slate-200">
              {data.articulos && data.articulos.length > 0 ? (
                data.articulos.map((art, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2 text-center font-bold text-slate-800 border-r border-slate-200">{art.cantidad || 1}</td>
                    <td className="p-2 text-[10px] font-mono text-slate-600 border-r border-slate-200">{art.codigo}</td>
                    <td className="p-2 text-slate-700 border-r border-slate-200">{art.articulo}</td>
                    <td className="p-2 text-[10px] text-slate-500 border-r border-slate-200">{art.ubicacion}</td>
                    <td className="p-2 text-center text-xs font-bold text-rose-700 border-slate-200">BAJA</td>
                  </tr>
                ))
              ) : (
                // Filas vacías si no hay artículos precargados
                [...Array(12)].map((_, idx) => (
                  <tr key={idx}>
                    <td className="p-2.5 border-r border-slate-200"></td>
                    <td className="p-2.5 border-r border-slate-200"></td>
                    <td className="p-2.5 border-r border-slate-200"></td>
                    <td className="p-2.5 border-r border-slate-200"></td>
                    <td className="p-2.5"></td>
                  </tr>
                ))
              )}
            </tbody>
         </table>
         </div>

         <div className="mb-8 px-2">
            <p className="font-bold text-xs uppercase text-slate-500 tracking-wider mb-1">Observaciones / Dictamen Técnico:</p>
            <div className="w-full min-h-[40px] border border-slate-300 rounded bg-slate-50 p-2 text-sm text-slate-700">
              {data.observaciones || ''}
            </div>
         </div>

         <p className="mb-8 text-[10pt] text-slate-700 leading-relaxed px-1 text-center font-medium">
            Se levanta la presente acta para los fines administrativos y patrimoniales que haya lugar, firmando de conformidad los que en ella intervienen.
         </p>

         <div className="grid grid-cols-2 gap-16 text-center mt-6 px-8">
            <div>
              <p className="font-bold text-xs uppercase text-slate-500 tracking-wider">Contraloría Interna</p>
              <div className="mt-12 border-b border-slate-400 w-full mx-auto"></div>
              <p className="font-bold text-sm mt-2 text-slate-800">{data.nombreContralor || 'Profr. Juan Carlos Taboada B.'}</p>
            </div>
            <div>
              <p className="font-bold text-xs uppercase text-slate-500 tracking-wider">Vo.Bo. Dirección Escolar</p>
              <div className="mt-12 border-b border-slate-400 w-full mx-auto"></div>
              <p className="font-bold text-sm mt-2 text-slate-800">Director del Plantel</p>
            </div>
         </div>
      </div>
    </div>
  );
}
