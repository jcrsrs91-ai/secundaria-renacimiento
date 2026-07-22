import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

// Tamaño CR80 (54mm x 85.6mm)
export default function CredencialPrint({ students = [] }) {
  const getGradeColor = (grado) => {
    // 1ro Guinda, 2do Azul, 3ro Verde
    if (grado?.includes('1')) return 'bg-rose-900 border-rose-900';
    if (grado?.includes('2')) return 'bg-blue-700 border-blue-700';
    if (grado?.includes('3')) return 'bg-emerald-700 border-emerald-700';
    return 'bg-slate-800 border-slate-800'; // Default
  };

  const getTextColor = (grado) => {
    if (grado?.includes('1')) return 'text-rose-900';
    if (grado?.includes('2')) return 'text-blue-700';
    if (grado?.includes('3')) return 'text-emerald-700';
    return 'text-slate-800';
  };

  return (
    <div className="print-only">
      <style>{`
        @media print {
          @page { size: 54mm 85.6mm; margin: 0; }
          html, body, #root { height: auto !important; overflow: visible !important; min-height: auto !important; display: block !important; }
          * { overflow: visible !important; }
          aside, header { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; background: white; }
          .print-only { display: block !important; }
          .credencial-page { 
            page-break-after: always; 
            width: 54mm; 
            height: 85.6mm; 
            overflow: hidden !important; 
            position: relative; 
            font-family: sans-serif; 
            box-sizing: border-box; 
          }
        }
        @media screen {
          .print-only { display: none !important; }
        }
      `}</style>
      
      {students.map(student => (
        <React.Fragment key={student.id}>
          {/* FRENTE DE LA TARJETA */}
          <div className="credencial-page bg-white flex flex-col justify-between overflow-hidden relative border-r border-b border-slate-100 print:border-none">
            
            {/* Header */}
            <div className={`${getGradeColor(student.grado)} text-white px-1 py-1.5 shadow-md relative z-10 rounded-b flex items-center h-[16mm]`}>
              <img src="/logo-sep.png" alt="SEP" className="h-[11mm] w-[11mm] object-contain mr-1" />
              <div className="flex-1 text-center px-0.5 flex flex-col justify-center">
                <h1 className="text-[6px] font-extrabold uppercase leading-[1.1] tracking-wide">Secretaría de Educación Pública</h1>
                <h2 className="text-[8px] font-black leading-tight mt-[1px] tracking-tight">Esc. Sec. Téc. N°68</h2>
                <h3 className="text-[9px] font-black leading-tight mt-[1px] tracking-[0.2em] text-yellow-300 drop-shadow-md">RENACIMIENTO</h3>
                <p className="text-[5px] font-semibold tracking-wider mt-[1px] opacity-90">C.C.T. 12DST0077B</p>
              </div>
              <img src="/logo-escuela.png" alt="Escuela" className="h-[11mm] w-[11mm] object-contain ml-1 drop-shadow-md" />
            </div>

            {/* Body */}
            <div className="flex-1 flex flex-col w-full relative z-0">
              
              {/* Contenedor Foto + Nombres */}
              <div className="flex px-1.5 pt-1.5 pb-1 gap-1.5 items-center">
                {/* Foto */}
                <div className={`w-[18mm] h-[23mm] border-[1.5px] rounded-sm overflow-hidden bg-slate-50 ${getGradeColor(student.grado)} shadow-sm z-10 flex-shrink-0`}>
                  {student.fotoUrl ? (
                    <img src={student.fotoUrl} alt="Foto" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    </div>
                  )}
                </div>
                
                {/* Nombres y Matrícula */}
                <div className="flex-1 flex flex-col justify-center leading-none mt-1">
                  <p className={`text-[9.5px] font-black uppercase leading-[1.1] tracking-tight ${getTextColor(student.grado)}`}>
                    {student.apellidoPaterno} <br/> {student.apellidoMaterno}
                  </p>
                  <p className="text-[8px] font-bold text-slate-700 uppercase leading-tight mt-[3px]">
                    {student.nombres}
                  </p>
                  <p className="text-[6.5px] font-bold text-slate-500 uppercase tracking-widest mt-2">
                    MAT: {student.matricula}
                  </p>
                  <p className="text-[6px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    CURP: {student.curp || 'NO REGISTRADA'}
                  </p>
                </div>
              </div>

              {/* Datos Académicos y Sangre */}
              <div className="grid grid-cols-2 gap-x-1 px-1.5 w-full z-10 mt-1">
                <div>
                  <p className="text-[4.5px] font-bold text-slate-400 uppercase tracking-widest">Grado / Grupo / Turno</p>
                  <p className="text-[8.5px] font-black text-slate-800 leading-tight">
                    {student.grado?.substring(0,1)}° "{student.grupo || '-'}" <span className="text-[7px] font-bold text-slate-500">{student.turno?.substring(0,4) || 'MATU'}</span>
                  </p>
                </div>
                <div>
                  <p className="text-[4.5px] font-bold text-slate-400 uppercase tracking-widest">T. Sangre</p>
                  <p className="text-[8.5px] font-black text-red-600 leading-tight">{student.tipoSangre || 'No Esp.'}</p>
                </div>
                <div className="col-span-2 mt-[3px]">
                  <p className="text-[4.5px] font-bold text-slate-400 uppercase tracking-widest">Taller</p>
                  <p className="text-[7px] font-bold text-slate-800 leading-tight truncate">{student.taller || 'Sin Asignar'}</p>
                </div>
              </div>

              {/* Contacto de Emergencia y Leyenda */}
              <div className="px-1.5 mt-[3px] border-t-[0.5px] border-slate-200 pt-[3px] bg-red-50/40">
                <p className="text-[4.5px] font-bold text-red-500 uppercase tracking-widest">En caso de emergencia avisar a:</p>
                <div className="flex justify-between items-end mt-[2px]">
                  <p className="text-[6.5px] font-bold text-slate-700 leading-tight truncate flex-1 pr-1">{student.nombreTutor || 'No registrado'}</p>
                  <p className="text-[7px] font-black text-slate-900 leading-tight flex-shrink-0">Tel: {student.telefonoTutor || 'N/A'}</p>
                </div>
              </div>

              {/* Leyenda Oficial SEP */}
              <div className="px-1.5 mt-[3px] text-center">
                 <p className="text-[4.5px] font-medium text-slate-400 leading-[1.2] text-justify">
                   Esta credencial acredita al portador como alumno(a) regular de esta Institución incorporada a la SEP. Es personal e intransferible.
                 </p>
              </div>
            </div>

            {/* Footer: QR y Firmas */}
            <div className="px-2 border-t-[0.5px] border-slate-200 flex flex-row items-end justify-between z-10 pb-[2px] h-[19mm] bg-slate-50/50 mt-[2px]">
              {/* Código QR para Escáner */}
              <div className="flex-shrink-0 bg-white p-[1px] rounded border shadow-sm self-center">
                <QRCodeSVG 
                  value={JSON.stringify({ m: student.matricula, id: student.id, c: "25-26" })} 
                  size={42} 
                  level="M"
                  includeMargin={false}
                />
              </div>

              {/* Firma Director */}
              <div className="flex-1 flex flex-col items-center justify-end h-full pb-[1px] ml-2">
                {/* Imagen Firma Real Digitalizada */}
                <div className="w-full flex justify-center h-[12mm] mb-[1px] relative z-20">
                  <img src="/firma-director.png" alt="Firma" className="h-full w-auto object-contain" />
                </div>
                <div className="w-full border-b-[1px] border-slate-800 mb-[1px] z-10"></div>
                <p className="text-[4.5px] font-black text-slate-900 uppercase text-center leading-[1.1] tracking-tight">Profr. Juan Carlos Taboada Barajas</p>
                <p className="text-[4px] font-bold text-slate-600 uppercase text-center leading-tight">Director del Plantel</p>
              </div>
            </div>
            
            {/* Fondo de agua tenue (Logo) */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none z-0 overflow-hidden mix-blend-multiply">
               <img src="/logo-escuela.png" alt="" className="w-48 h-48 object-contain scale-150 grayscale" />
            </div>

          </div>
        </React.Fragment>
      ))}
    </div>
  );
}
