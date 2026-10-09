import React, { useState, useMemo } from 'react';

export default function ActaRecepcionPrint({ data }) {
  const [viewMode, setViewMode] = useState('desglosada'); // 'desglosada' | 'global'

  if (!data) return null;

  const formatDate = (dateString) => {
    if (dateString && dateString.toDate) {
      const d = dateString.toDate();
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    }
    if (!dateString) return '___/___/_____';
    const d = new Date(dateString + 'T00:00:00');
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  const articulosMostrados = useMemo(() => {
    if (!data.articulos) return [];
    
    if (viewMode === 'desglosada') {
      return data.articulos;
    } else {
      // Global mode: group by articulo + descripcion
      const agrupados = data.articulos.reduce((acc, art) => {
        const key = (art.articulo || '') + '|' + (art.descripcion || '');
        if (!acc[key]) {
          acc[key] = {
            ...art,
            cantidad: Number(art.cantidad) || 1,
            serie: '', // clear specific fields
            codigo: '',
            observaciones: 'NUEVOS EN GENERAL'
          };
        } else {
          acc[key].cantidad += (Number(art.cantidad) || 1);
        }
        return acc;
      }, {});
      return Object.values(agrupados);
    }
  }, [data.articulos, viewMode]);

  return (
    <div className="print-acta-only bg-white min-h-screen font-sans text-black">
      <style>{`
        @media print {
          @page { size: portrait; margin: 1.0cm; }
          html, body, #root { height: auto !important; overflow: visible !important; min-height: auto !important; display: block !important; }
          * { overflow: visible !important; }
          aside, header { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; margin: 0; }
          .no-print { display: none !important; }
          .print-acta-only { display: block !important; }
        }
        @media screen {
          .print-acta-only { padding: 2rem; max-width: 800px; margin: 2rem auto; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); border-radius: 0.5rem; display: block !important;}
        }
      `}</style>
      
      <div className="no-print flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 border-b border-slate-200 pb-4">
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setViewMode('global')}
            className={`px-4 py-2 text-sm font-bold rounded-md transition ${viewMode === 'global' ? 'bg-white text-indigo-600 shadow' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Vista Global (Agrupada)
          </button>
          <button 
            onClick={() => setViewMode('desglosada')}
            className={`px-4 py-2 text-sm font-bold rounded-md transition ${viewMode === 'desglosada' ? 'bg-white text-indigo-600 shadow' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Vista Desglosada (1 por 1)
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.location.reload()} className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium">Volver</button>
          <button onClick={() => window.print()} className="px-6 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-bold shadow-sm">Imprimir</button>
        </div>
      </div>
      
      {/* HEADER LOGOS AND TITLES */}
      <div className="flex justify-between items-center mb-6">
        <div className="w-1/4">
           <img src="/logo-sep.png" alt="Guerrero" className="h-16 object-contain" />
        </div>
        <div className="w-2/4 text-center">
          <h1 className="font-bold text-[12px] leading-tight">
            SECRETARIA DE EDUCACIÓN GUERRERO<br/>
            SUBSECRETARIA DE ADMINISTRACIÓN Y FINANZAS<br/>
            DIRECCIÓN DE RECURSOS MATERIALES Y SERVICIOS<br/>
            REPRESENTACIÓN DE RECURSOS MATERIALES Y SERVICIOS<br/>
            REGIÓN ACAPULCO – COYUCA DE BENITEZ.
          </h1>
        </div>
        <div className="w-1/4 flex justify-end items-center">
           <img src="/logo-educacion.png" alt="Educación" className="h-14 object-contain" />
        </div>
      </div>

      {/* TITULO */}
      <div className="text-center mb-6">
        <h2 className="font-bold text-[14px] underline underline-offset-4">SOLICITUD DE ALTA DE BIENES INSTRUMENTALES.</h2>
      </div>

      {/* DATOS GRID */}
      <div className="flex flex-col border-2 border-black mb-6 text-[10px] uppercase font-bold">
        {/* FILA 1 */}
        <div className="flex w-full border-b-2 border-black">
          <div className="w-1/2 border-r-2 border-black p-2 flex">
            <span>NOMBRE DE LA ESCUELA: </span>
            <span className="ml-2 font-normal">ESC. SEC. TEC. N° 68 "RENACIMIENTO"</span>
          </div>
          <div className="w-1/4 border-r border-black p-2 flex flex-col">
            <div className="mb-2">
              <span>C.C.T. </span><span className="border-b border-black inline-block min-w-[80px] text-center font-normal">12DST0077B</span>
            </div>
            <div>
              <span>SECTOR. </span><span className="border-b border-black inline-block min-w-[80px] text-center font-normal">06</span>
            </div>
          </div>
          <div className="w-1/4 p-2 flex flex-col">
            <div className="mb-2">
              <span>ZONA ESCOLAR: </span><span className="border-b border-black inline-block min-w-[50px] text-center font-normal">24</span>
            </div>
            <div>
              <span>NIVEL </span><span className="border-b border-black inline-block min-w-[80px] text-center font-normal">SECUNDARIA</span>
            </div>
          </div>
        </div>
        {/* FILA 2 */}
        <div className="flex w-full">
          <div className="w-1/2 border-r-2 border-black p-2 flex">
            <span>DOMICILIO: </span>
            <span className="ml-2 font-normal text-[8px] flex-1">CALLE ALTA QUEBRADORA Y AND. 24 FEBRERO S/N CD. RENACIMIENTO C.P.39715</span>
          </div>
          <div className="w-1/2 p-2 flex">
            <span>FECHA: </span>
            <span className="ml-2 font-normal">{formatDate(data.fecha)}</span>
          </div>
        </div>
      </div>

      {/* TABLA DE BIENES */}
      <table className="w-full text-[10px] text-center border-collapse border-2 border-black mb-8 h-[400px]">
        <thead>
          <tr className="bg-gray-300">
            <th className="border-2 border-black p-2 w-1/4 font-bold uppercase">NOMBRE DEL BIEN</th>
            <th className="border-2 border-black p-2 w-2/4 font-bold uppercase">DESCRIPCIÓN DEL BIEN</th>
            <th className="border-2 border-black p-2 w-24 font-bold uppercase">CANTIDAD</th>
            <th className="border-2 border-black p-2 w-1/4 font-bold uppercase">OBSERVACIONES</th>
          </tr>
        </thead>
        <tbody className="align-top">
          {articulosMostrados.map((art, idx) => (
            <tr key={idx} className="h-8">
              <td className="border-r-2 border-black p-2 uppercase font-bold text-left">{art.articulo}</td>
              <td className="border-r-2 border-black p-2 uppercase text-[8px] text-justify leading-tight">
                {[art.descripcion, art.marca && `MARCA: ${art.marca}`, art.modelo && `MOD: ${art.modelo}`, viewMode === 'desglosada' && art.serie && `S/N: ${art.serie}`, viewMode === 'desglosada' && art.codigo && `FOLIO: ${art.codigo}`].filter(Boolean).join(' | ')}
              </td>
              <td className="border-r-2 border-black p-2 uppercase font-bold">{art.cantidad}</td>
              <td className="p-2 uppercase text-[8px]">{art.observaciones || art.estado || ''}</td>
            </tr>
          ))}
          {/* Empty rows to fill space */}
          {[...Array(Math.max(0, 15 - articulosMostrados.length))].map((_, idx) => (
            <tr key={'empty-'+idx}>
              <td className="border-r-2 border-black p-2"></td>
              <td className="border-r-2 border-black p-2"></td>
              <td className="border-r-2 border-black p-2"></td>
              <td className="p-2"></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* FIRMAS */}
      <div className="flex border-2 border-black w-full min-h-[120px] text-[10px]">
        {/* IZQUIERDA */}
        <div className="w-1/2 border-r-2 border-black flex flex-col justify-between p-2">
          <div className="text-center font-bold">
            SOLICITANTE DE LA ALTA DEL (OS) BIEN (ES)
          </div>
          <div className="text-center font-bold uppercase">
            <div className="border-t border-black pt-1 mt-16 w-3/4 mx-auto"></div>
            NOMBRE, FIRMA Y SELLO.
            <div className="text-[8px] mt-1 font-normal">PROFR. JUAN CARLOS TABOADA BARAJAS<br/>DIRECTOR DE LA ESCUELA</div>
          </div>
        </div>
        
        {/* DERECHA */}
        <div className="w-1/2 flex flex-col justify-between p-2">
          <div className="text-center font-bold leading-tight">
            REPRESENTANTE DE RECURSOS MATERIALES Y SERVICIOS DE<br/>
            LA REGIÓN ACAPULCO – COYUCA DE BENITEZ.
          </div>
          <div className="text-center font-bold uppercase">
            <div className="border-t border-black pt-1 mt-16 w-3/4 mx-auto"></div>
            PROFR. JOSE ELIAS SILVA POLANCO.
          </div>
        </div>
      </div>

    </div>
  );
}
