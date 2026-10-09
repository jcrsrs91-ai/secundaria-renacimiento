import React from 'react';

export default function CartaResguardoPrint({ data, onBack }) {
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

  return (
    <div className="print-resguardo-only bg-white  font-sans">
      <style>{`
        @media print {
          @page { size: landscape; margin: 1.0cm; }
          html, body, #root { height: auto !important; overflow: visible !important; min-height: auto !important; display: block !important; }
          * { overflow: visible !important; }
          aside, header { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; margin: 0; }
          .no-print { display: none !important; }
        }
        @media screen {
          .print-resguardo-only { padding: 2rem; max-width: 1050px; margin: 2rem auto; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); border-radius: 0.5rem; }
        }
      `}</style>
      
      <div className="no-print flex justify-end gap-4 mb-1 border-b border-slate-200 pb-4">
        <button onClick={onBack} className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium">Volver a Inventario</button>
        <button onClick={() => window.print()} className="px-6 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-bold shadow-sm">Imprimir Documento</button>
      </div>
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-1">
        <div className="w-1/4">
           {/* Replace with exact left logo if you have it */}
           <img src="/logo-sep.png" alt="Guerrero" className="h-12 object-contain" />
        </div>
        <div className="w-2/4 text-center">
          <h1 className="font-bold text-[12px] leading-tight">
            SECRETARIA DE EDUCACIÓN GUERRERO<br/>
            SUBSECRETARIA DE ADMINISTRACIÓN Y FINANZAS<br/>
            DIRECCIÓN DE RECURSOS MATERIALES<br/>
            DEPARTAMENTO DE ALMACENES E INVENTARIOS<br/>
            OFICINA DE INVENTARIOS
          </h1>
        </div>
        <div className="w-1/4 flex justify-end items-center">
           <img src="/logo-educacion.png" alt="Educación" className="h-14 object-contain" />
        </div>
      </div>

      {/* TITULO */}
      <div className="bg-gray-300 border border-black text-center py-1 mb-1">
        <h2 className="font-bold text-[14px]">RESGUARDO DE BIENES MUEBLES Y EQUIPOS DE CÓMPUTO.</h2>
      </div>

      {/* DATOS */}
      <div className="flex w-full border border-black mb-1">
        {/* IZQUIERDA */}
        <div className="w-1/2 border-r border-black flex flex-col">
          <div className="text-center font-bold text-[11px] py-1 border-b border-black">
            DATOS PERSONALES DEL RESPONSABLE
          </div>
          <div className="p-2 text-[10px] space-y-3 relative flex-1">
            <div className="flex">
              <span className="font-bold w-20">NOMBRE:</span>
              <span className="border-b border-black flex-1 uppercase">{data.nombreResguardante || ''}</span>
            </div>
            <div className="flex">
              <span className="font-bold w-20">DOMICILIO:</span>
              <span className="border-b border-black flex-1 uppercase">{data.domicilioResguardante || ''}</span>
            </div>
            <div className="flex gap-4">
              <div className="flex flex-1">
                <span className="font-bold w-16">CIUDAD:</span>
                <span className="border-b border-black flex-1 uppercase">Acapulco de Juárez</span>
              </div>
              <div className="flex w-24">
                <span className="font-bold mr-1">C.P.:</span>
                <span className="border-b border-black flex-1 uppercase"></span>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex flex-1">
                <span className="font-bold w-12">RFC:</span>
                <span className="border-b border-black flex-1 uppercase">{data.rfcResguardante || ''}</span>
              </div>
              <div className="flex flex-1">
                <span className="font-bold w-20">TELEFONO:</span>
                <span className="border-b border-black flex-1 uppercase">{data.telefonoResguardante || ''}</span>
              </div>
            </div>
          </div>
        </div>

        {/* DERECHA */}
        <div className="w-1/2 flex flex-col">
          <div className="text-center font-bold text-[11px] py-1 border-b border-black">
            DATOS DEL ÁREA O INSTITUCIÓN EDUCATIVA
          </div>
          <div className="p-2 text-[10px] space-y-3 relative flex-1">
            <div className="flex">
              <span className="font-bold w-44">NOMBRE DEL ÁREA O ESCUELA:</span>
              <span className="border-b border-black flex-1 uppercase">ESC. SEC. TEC. N° 68 "RENACIMIENTO"</span>
            </div>
            <div className="flex gap-2">
              <div className="flex w-1/3">
                <span className="font-bold w-12">C.C.T.:</span>
                <span className="border-b border-black flex-1 uppercase">12DST0077B</span>
              </div>
              <div className="flex w-1/3">
                <span className="font-bold w-16">SECTOR:</span>
                <span className="border-b border-black flex-1 uppercase">06</span>
              </div>
              <div className="flex w-1/3">
                <span className="font-bold w-12">ZONA:</span>
                <span className="border-b border-black flex-1 uppercase">24</span>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex w-1/2">
                <span className="font-bold w-12">NIVEL:</span>
                <span className="border-b border-black flex-1 uppercase">SECUNDARIA</span>
              </div>
              <div className="flex w-1/2">
                <span className="font-bold w-24">LOCALIDAD:</span>
                <span className="border-b border-black flex-1 uppercase">ACAPULCO</span>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex w-1/2">
                <span className="font-bold w-20">MUNICIPIO:</span>
                <span className="border-b border-black flex-1 uppercase">ACAPULCO</span>
              </div>
              <div className="flex w-1/2">
                <span className="font-bold w-16">REGIÓN:</span>
                <span className="border-b border-black flex-1 uppercase text-[8px]">ACAPULCO - COYUCA DE BENITEZ</span>
              </div>
            </div>
            <div className="flex w-1/2">
              <span className="font-bold w-20">TELEFONO:</span>
              <span className="border-b border-black flex-1 uppercase">7444415678</span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-[9px] font-bold leading-tight mb-1 uppercase text-justify">
        DE LA CONSERVACIÓN DEL BIEN ABAJO DESCRITO Y QUE AL TERMINO DE SUS FUNCIONES CON ESTA DEPENDENCIA, DEBERA ENTREGAR ESTE RESGUARDO ASI COMO EL BIEN QUE LE FUE ASIGNADO, CONFORME AL ART. 43., FRACCIÓN V, DE LA LEY DEL TRABAJO DE LOS SERVIDORES PÚBLICOS DEL ESTADO DE GUERRERO.
      </p>

      {/* TABLA DE ARTICULOS */}
      <div className="bg-gray-300 border border-black text-center py-0.5">
        <h3 className="font-bold text-[10px]">DESCRIPCIÓN GENERAL DEL ACTIVO FIJO</h3>
      </div>
      <table className="w-full text-[9px] text-center border-collapse border border-black mb-1">
        <thead>
          <tr>
            <th className="border border-black p-1 w-12">CANT.</th>
            <th className="border border-black p-1">CONCEPTO</th>
            <th className="border border-black p-1 w-24">MARCA</th>
            <th className="border border-black p-1 w-24">MODELO</th>
            <th className="border border-black p-1 w-24">SERIE</th>
            <th className="border border-black p-1 w-12">E.F.</th>
            <th className="border border-black p-1 w-40">OBSERVACIONES</th>
          </tr>
        </thead>
        <tbody>
          {data.articulos && data.articulos.some(art => art.cantidad || art.descripcion || art.articulo || art.marca) ? (
            data.articulos.map((art, idx) => (
              <tr key={idx}>
                <td className="border border-black p-1 font-bold">{art.cantidad}</td>
                <td className="border border-black p-1 uppercase">{art.descripcion || art.articulo}</td>
                <td className="border border-black p-1 uppercase">{art.marca || ''}</td>
                <td className="border border-black p-1 uppercase">{art.modelo || ''}</td>
                <td className="border border-black p-1 uppercase font-mono">{art.serie || ''}</td>
                <td className="border border-black p-1 uppercase">{art.estado || ''}</td>
                <td className="border border-black p-1 uppercase text-[8px]">{art.observaciones || ''}</td>
              </tr>
            ))
          ) : null}
          {/* Fill remaining rows to make it look like a standard format */}
          {[...Array(Math.max(0, 10 - (data.articulos?.length || 0)))].map((_, idx) => (
            <tr key={'empty-'+idx}>
              <td className="border border-black p-1"></td>
              <td className="border border-black p-1"></td>
              <td className="border border-black p-1"></td>
              <td className="border border-black p-1"></td>
              <td className="border border-black p-1"></td>
              <td className="border border-black p-1"></td>
              <td className="border border-black p-1"></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* FECHA Y FIRMAS */}
      <div className="flex mb-2 text-[10px]">
        <span className="font-bold whitespace-nowrap">FECHA DE ASIGNACIÓN:</span>
        <span className="border-b border-black flex-1 ml-2 text-center uppercase tracking-widest">{formatDate(data.fecha)}</span>
      </div>

      <div className="flex border border-black w-full min-h-[100px] mb-1">
        {/* VoBo */}
        <div className="w-1/3 border-r border-black flex flex-col justify-between">
          <div className="text-center font-bold text-[10px] mt-2">Vo. Bo.</div>
          <div className="text-center font-bold text-[10px] mb-1 px-2 uppercase">
            <div className="border-t border-black pt-1 mt-10 w-3/4 mx-auto"></div>
            PROFR. JUAN CARLOS TABOADA BARAJAS<br/>
            DIRECTOR DE LA ESCUELA
          </div>
        </div>
        
        {/* RESPONSABLE */}
        <div className="w-1/3 border-r border-black flex flex-col justify-between">
          <div className="text-center font-bold text-[10px] mt-2 leading-tight">
            NOMBRE, FIRMA<br/>DEL RESPONSABLE
          </div>
          <div className="text-center font-bold text-[10px] mb-1 px-2 uppercase">
            <div className="border-t border-black pt-1 mt-10 w-3/4 mx-auto"></div>
            {data.nombreResguardante || ''}
          </div>
        </div>

        {/* JEFE INVENTARIOS */}
        <div className="w-1/3 flex flex-col justify-between">
          <div className="text-center font-bold text-[10px] mt-2">
            JEFE DE INVENTARIOS
          </div>
          <div className="text-center font-bold text-[10px] mb-1 px-2 leading-tight uppercase">
            <div className="border-t border-black pt-1 mt-10 w-3/4 mx-auto"></div>
            PROFR. JOSE ELIAS SILVA POLANCO.<br/>
            REPRESENTANTE DE RECURSOS MATERIALES Y SERVICIOS<br/>
            REGIÓN ACAPULCO – COYUCA DE BENITEZ.
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex gap-8 text-[7px] uppercase text-gray-600 font-bold">
        <span>1.- ORIGINAL OFICINA DE INVENTARIOS.</span>
        <span>2.- COPIA DIRECCIÓN DE FINANZAS.</span>
        <span>3.- COPIA DEL INTERESADO.</span>
      </div>

    </div>
  );
}
