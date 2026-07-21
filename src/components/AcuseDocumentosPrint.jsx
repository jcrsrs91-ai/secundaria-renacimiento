import React, { useEffect, useState } from 'react';
import { X, Printer } from 'lucide-react';
import { autoAcentuar } from '../utils/format';

export default function AcuseDocumentosPrint({ data, onClose }) {
  const [fecha, setFecha] = useState('');

  useEffect(() => {
    const hoy = new Date();
    setFecha(hoy.toLocaleDateString('es-MX'));
  }, []);

  const { student, motivo, tutor, quienEntrega, docs } = data;

  const docLabels = {
    curp: 'C.U.R.P.',
    acta: 'Acta de Nacimiento',
    certprim: 'Cert. de Primaria',
    bol1: 'Boleta 1er Grado',
    bol2: 'Boleta 2do Grado',
    bol3: 'Boleta 3er Grado',
    certsec: 'Cert. Secundaria'
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/90 flex flex-col items-center overflow-y-auto print:bg-white print:p-0">
      
      {/* Botones de Control (Ocultos en impresión) */}
      <div className="w-full max-w-[215.9mm] mx-auto p-4 flex justify-between items-center print:hidden sticky top-0 bg-slate-900/90 backdrop-blur z-20">
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg"
        >
          <Printer className="w-5 h-5" />
          Imprimir Acuse
        </button>
        <button 
          onClick={onClose}
          className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <style type="text/css" media="print">
        {`
          @page {
            size: Letter;
            margin: 15mm 20mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: white !important;
          }
          .print-page {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: 100vh;
            page-break-after: always;
            overflow: hidden;
            background-color: white !important;
          }
        `}
      </style>

      {/* Contenedor de Impresión */}
      <div className="w-full flex justify-center pb-8 pt-4 print:pt-0 print:pb-0" style={{ minHeight: '100vh' }}>
        <div 
          className="print-page bg-white relative mx-auto shadow-2xl p-10 print:p-0" 
          style={{ width: '215.9mm', minHeight: '279.4mm', fontFamily: "Arial, sans-serif", fontSize: '11pt', color: '#000' }}
        >
          
          {/* Header Oficial con Logos */}
          <div className="w-full flex items-center justify-between border-b-[3px] border-[#621132] pb-4 mb-5">
            <div className="w-40 flex justify-start items-center">
              <img src="/logo-sep.png" alt="SEP" className="w-40 object-contain" />
            </div>
            
            <div className="text-center flex-1 px-2">
              <p className="text-[9px] font-bold text-slate-700 uppercase tracking-widest mb-1">Secretaría de Educación Pública</p>
              <h1 className="m-0 text-[13pt] text-[#621132] uppercase font-black tracking-wider">Escuela Secundaria Técnica No. 68 "Renacimiento"</h1>
              <p className="text-[9px] font-bold text-slate-600 tracking-widest mt-1">
                C.C.T. 12DST0077B <span className="mx-2 text-rose-300">•</span> Zona Escolar 24
              </p>
              <h2 className="mt-1 mb-0 text-[10pt] font-semibold text-slate-700">Acapulco de Juárez, Guerrero | Tel. 744 441 5678</h2>
            </div>
            
            <div className="w-40 flex flex-col items-end justify-between">
              <img src="/logo-escuela.png" alt="Escudo" className="w-16 h-16 object-contain mb-2" />
              <div className="text-right text-[9pt] font-bold text-slate-700">
                <div>Folio: _______</div>
                <div className="mt-1">Fecha: <span>{fecha}</span></div>
              </div>
            </div>
          </div>

          {/* Título */}
          <div className="text-center text-[12pt] font-bold mb-5 bg-[#f4f4f4] p-1.5 border border-[#ccc]">
            ACUSE DE RECIBO DE DEVOLUCIÓN DE DOCUMENTOS ORIGINALES
          </div>

          {/* Tabla de Datos Genéricos */}
          <table className="w-full border-collapse mb-5 text-[10pt]">
            <tbody>
              <tr>
                <td className="font-bold w-[140px] py-1 align-bottom">Motivo de entrega:</td>
                <td colSpan="3" className="border-b border-black font-bold uppercase py-1 align-bottom">{motivo}</td>
              </tr>
              <tr>
                <td className="font-bold py-1 align-bottom">Nombre del Alumno(a):</td>
                <td className="border-b border-black w-1/2 py-1 align-bottom uppercase">
                  {autoAcentuar(student.apellidoPaterno)} {autoAcentuar(student.apellidoMaterno)} {autoAcentuar(student.nombres)}
                </td>
                <td className="font-bold text-right pr-2 py-1 align-bottom">Grado/Grupo/Turno:</td>
                <td className="border-b border-black py-1 align-bottom uppercase">
                  {student.grado}° "{student.grupo}" {student.turno}
                </td>
              </tr>
              <tr>
                <td className="font-bold py-1 align-bottom">Nombre del Tutor:</td>
                <td colSpan="3" className="border-b border-black py-1 align-bottom uppercase">{autoAcentuar(tutor)}</td>
              </tr>
            </tbody>
          </table>

          {/* Caja Documentos */}
          <div className="border border-[#ccc] p-3 mb-5 text-[10pt]">
            <h3 className="m-0 mb-3 text-[11pt] font-bold border-b border-[#eee] pb-1.5">
              Documentación original y observaciones por documento:
            </h3>
            
            <table className="w-full border-collapse">
              <tbody>
                {Object.keys(docs).map((key) => (
                  <tr key={key}>
                    <td className="w-1/2 py-1.5 font-medium">
                      [{docs[key].checked ? ' X ' : '   '}] {docLabels[key]}
                    </td>
                    <td className="w-1/2 py-1.5 border-b border-[#666] text-[#333] italic">
                      Motivo: <span className="uppercase">{docs[key].checked ? '' : docs[key].motivo}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legal */}
          <div className="text-[8pt] text-justify p-3 border border-[#ddd] bg-[#fcfcfc] mt-3 leading-[1.4]">
            <strong>AVISO DE DEVOLUCIÓN Y LIBERACIÓN DE RESPONSABILIDAD:</strong><br/>
            Por medio del presente documento, el padre, madre o tutor legal firma de entera conformidad la recepción de los documentos originales marcados en la lista superior (salvo aquellos donde se indique expresamente el motivo de su retención o inexistencia en el expediente). Dichos documentos se encontraban bajo el resguardo de la institución educativa para fines de control escolar. A partir de la firma de este acuse, la Escuela Secundaria Técnica N°68 se libera de toda responsabilidad sobre el resguardo, cuidado y estado físico de dicha documentación. Cualquier extravío, deterioro o mal uso de los mismos será responsabilidad absoluta del titular o su tutor. En caso de préstamo temporal, el tutor asume la responsabilidad de devolverlos a la brevedad.
          </div>

          {/* Firmas */}
          <div className="w-full flex mt-10 pt-4">
            <div className="w-1/3 text-center flex flex-col justify-end pb-2">
              <div className="border-t border-black w-[85%] mx-auto pt-1 text-[9pt] font-bold uppercase truncate px-1">
                {autoAcentuar(quienEntrega)}
              </div>
              <div className="text-[8pt] text-[#555] mt-1">Control Escolar / Administración</div>
            </div>
            
            <div className="w-1/3 text-center flex justify-center">
              <div className="w-[70px] h-[70px] border-2 border-dashed border-[#999] rounded-full flex items-center justify-center text-[7pt] text-[#999] mb-2">
                Sello de la<br/>Escuela
              </div>
            </div>

            <div className="w-1/3 text-center flex flex-col justify-end pb-2">
              <div className="border-t border-black w-[85%] mx-auto pt-1 text-[9pt] font-bold uppercase truncate px-1">
                {autoAcentuar(tutor)}
              </div>
              <div className="text-[8pt] text-[#555] mt-1">Padre, Madre o Tutor Legal</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
