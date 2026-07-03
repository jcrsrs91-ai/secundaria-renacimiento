import React from 'react';

export default function CartaResguardoPrint({ data }) {
  if (!data) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '___ de __________ de 202_';
    const d = new Date(dateString + 'T00:00:00');
    return `${d.getDate()} de ${d.toLocaleString('es-MX', { month: 'long' })} de ${d.getFullYear()}`;
  };

  return (
    <div className="print-resguardo-only">
      <style>{`
        @media print {
          @page { size: letter; margin: 1.0cm; }
          html, body, #root { height: auto !important; overflow: visible !important; min-height: auto !important; display: block !important; }
          * { overflow: visible !important; }
          aside, header { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; margin: 0; }
          .print-resguardo-only { display: block !important; }
        }
        @media screen {
          .print-resguardo-only { display: none !important; }
        }
      `}</style>
      
      <div className="bg-white text-slate-800 font-sans leading-relaxed text-justify relative z-10" style={{ fontSize: '11pt' }}>
         <div className="flex justify-between items-center mb-4 border-b border-slate-300 pb-3">
            <img src="/logo-sep.png" alt="SEP Guerrero" className="h-12 object-contain" />
            <div className="text-center px-4 flex-1">
              <h1 className="font-black text-lg text-slate-800 uppercase tracking-wider">Escuela Secundaria Técnica N° 68 "Renacimiento"</h1>
              <h2 className="font-bold text-sm text-slate-600 uppercase mt-0.5">Contraloría Interna</h2>
              <h3 className="font-bold text-xs mt-1.5 bg-slate-100 border border-slate-200 text-slate-700 inline-block px-3 py-1 rounded-full tracking-widest">CARTA DE RESGUARDO DE BIENES MUEBLES</h3>
            </div>
            <img src="/logo-escuela.png" alt="EST 68" className="h-14 object-contain" />
         </div>

         <div className="flex justify-between items-end mb-4 px-2">
            <p className="text-sm"><strong>Folio de Resguardo:</strong> <span className="text-red-600 font-bold text-base">{data.folio || '_______'}</span></p>
            <p className="text-sm text-slate-600">Acapulco de Juárez, Gro., a {formatDate(data.fecha)}.</p>
         </div>

         <div className="mb-4 p-3 rounded-lg border border-slate-200 bg-slate-50/50 shadow-sm text-sm">
            <p className="font-black text-slate-700 mb-2 uppercase text-[10px] tracking-widest">Datos del Resguardante</p>
            <div className="grid grid-cols-2 gap-4">
              <p><strong>Nombre:</strong> {data.nombreResguardante || '________________________________________'}</p>
              <p><strong>Cargo / Área:</strong> {data.areaResguardante || '____________________________________'}</p>
            </div>
         </div>

         <p className="mb-4 text-[10pt] text-slate-700 leading-relaxed px-1">
            Por medio del presente documento, el(la) que suscribe acepta recibir en calidad de <strong>RESGUARDO</strong> los bienes que se detallan a continuación, asumiendo la responsabilidad de su cuidado, buen uso y conservación, comprometiéndose a reportar inmediatamente a la Contraloría cualquier falla, robo o extravío.
         </p>

         <div className="rounded-lg overflow-hidden border border-slate-300 mb-4">
           <table className="w-full text-[9pt] text-left">
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-300">
                <tr>
                  <th className="p-2 w-24 text-center border-r border-slate-300">No. Inv. Interno</th>
                  <th className="p-2 w-12 text-center border-r border-slate-300">Cant.</th>
                  <th className="p-2 border-r border-slate-300">Descripción del Artículo</th>
                  <th className="p-2 w-32 border-r border-slate-300">Marca / Modelo / Serie</th>
                  <th className="p-2 w-24 text-center">Estado Físico</th>
                </tr>
              </thead>
            <tbody className="divide-y divide-slate-200">
              {data.articulos && data.articulos.some(art => art.cantidad || art.descripcion || art.articulo || art.marca) ? (
                data.articulos.map((art, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2 text-center uppercase font-mono text-xs font-bold text-slate-500 border-r border-slate-200">{art.codigo || art.inventario}</td>
                    <td className="p-2 text-center font-bold text-slate-800 border-r border-slate-200">{art.cantidad}</td>
                    <td className="p-2 text-slate-700 border-r border-slate-200">
                      <div>{art.descripcion || art.articulo}</div>
                      {art.observaciones && <div className="text-[9px] text-slate-400 mt-0.5 italic text-justify">Obs: {art.observaciones}</div>}
                    </td>
                    <td className="p-2 uppercase text-[10px] text-slate-500 border-r border-slate-200">{[art.marca, art.modelo, art.serie && `S/N: ${art.serie}`].filter(Boolean).join(' / ')}</td>
                    <td className="p-2 text-center text-xs border-slate-200">{art.estado}</td>
                  </tr>
                ))
              ) : (
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

         <p className="text-[9px] text-slate-500 mb-10 italic px-2">
            <strong>Nota:</strong> Al término del ciclo escolar o cambio de adscripción, el resguardante deberá realizar la entrega formal de estos bienes para su liberación.
         </p>

         <div className="grid grid-cols-2 gap-16 text-center mt-8 px-8">
            <div>
              <p className="font-bold text-xs uppercase text-slate-500 tracking-wider">Entregó (Contraloría)</p>
              <div className="mt-12 border-b border-slate-400 w-full mx-auto"></div>
              <p className="font-bold text-sm mt-2 text-slate-800">{data.nombreContralor || 'Nombre y Firma'}</p>
            </div>
            <div>
              <p className="font-bold text-xs uppercase text-slate-500 tracking-wider">Recibe y Acepta Resguardo</p>
              <div className="mt-12 border-b border-slate-400 w-full mx-auto"></div>
              <p className="font-bold text-sm mt-2 text-slate-800">{data.nombreResguardante || 'Nombre y Firma'}</p>
            </div>
         </div>
      </div>
    </div>
  );
}
