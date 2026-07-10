import React from 'react';

export default function TicketPagoPrint({ pago }) {
  if (!pago) return null;

  return (
    <>
      <style>
        {`
          @media print {
            @page {
              size: 80mm auto; /* Formato de miniprinter térmica de 80mm */
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              width: 80mm;
            }
          }
        `}
      </style>
      <div className="bg-white p-2 w-[80mm] mx-auto text-black font-sans text-xs print:m-0 print:p-2 flex flex-col items-center">
        {/* Encabezado */}
        <div className="text-center mb-2 border-b border-black w-full pb-2">
          <h1 className="text-sm font-bold uppercase leading-tight">Secundaria Técnica N°68</h1>
          <h2 className="text-xs font-semibold uppercase leading-tight">"Renacimiento"</h2>
          <p className="text-[10px] mt-1">C.C.T. 12DST0068Z</p>
          <p className="text-[10px]">Depto. de Contraloría</p>
          <h3 className="text-xs font-bold mt-2 uppercase border border-black inline-block px-2 py-0.5">Recibo de Ingreso</h3>
        </div>

        {/* Datos del Recibo */}
        <div className="w-full text-[11px] mb-2 border-b border-black pb-2">
          <div className="flex justify-between">
            <span><strong>Folio:</strong></span>
            <span className="font-bold text-sm">{pago.folio}</span>
          </div>
          <div className="flex justify-between">
            <span><strong>Fecha:</strong></span>
            <span>{new Date(pago.fechaRegistro || pago.fecha).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span><strong>Cajero:</strong></span>
            <span>{pago.usuario || 'Caja 1'}</span>
          </div>
        </div>

        {/* Datos del Alumno */}
        <div className="w-full text-[11px] mb-2 border-b border-black pb-2">
          <p><strong>Alumno(a):</strong></p>
          <p className="uppercase leading-tight">{pago.alumno_nombre}</p>
          <div className="flex justify-between mt-1">
            <span><strong>CURP:</strong></span>
            <span>{pago.alumno_curp || 'S/N'}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span><strong>Turno:</strong></span>
            <span className="uppercase font-bold">{pago.turno || '-'}</span>
          </div>
        </div>

        {/* Concepto y Monto */}
        <div className="w-full text-[11px] mb-2">
          <p className="font-bold border-b border-dashed border-black pb-1 mb-1">Concepto</p>
          <div className="flex justify-between items-start mb-1">
            <span className="w-2/3 pr-1 leading-tight">{pago.concepto_nombre}</span>
            <span className="w-1/3 text-right font-bold">${Number(pago.monto).toFixed(2)}</span>
          </div>
          {pago.observaciones && (
            <p className="text-[9px] text-gray-700 italic">Nota: {pago.observaciones}</p>
          )}
        </div>

        {/* Total */}
        <div className="w-full border-t-2 border-black pt-1 mb-4 flex justify-between items-center">
          <span className="font-bold text-xs">Total:</span>
          <span className="font-bold text-base">${Number(pago.monto).toFixed(2)}</span>
        </div>

        {/* Firma */}
        <div className="w-full mt-6 text-center">
          <div className="border-b border-black w-3/4 mx-auto mb-1"></div>
          <p className="text-[10px] font-bold">Firma del(la) Contralor(a)</p>
        </div>

        <div className="mt-4 text-center text-[9px] italic mb-4 w-full">
          <p>Documento de uso interno.<br/>No tiene validez fiscal.</p>
          <p className="mt-1 font-bold">Conserva este ticket para tus trámites.</p>
        </div>
      </div>
    </>
  );
}
