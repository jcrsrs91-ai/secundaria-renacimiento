import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

// Tamaño CR80 (54mm x 85.6mm)
export default function CredencialPrint({ students = [] }) {
  const getGradeColor = (grado) => {
    if (grado?.includes('1')) return 'bg-blue-600 border-blue-600';
    if (grado?.includes('2')) return 'bg-emerald-600 border-emerald-600';
    if (grado?.includes('3')) return 'bg-rose-600 border-rose-600';
    return 'bg-slate-800 border-slate-800'; // Default
  };

  const getTextColor = (grado) => {
    if (grado?.includes('1')) return 'text-blue-600';
    if (grado?.includes('2')) return 'text-emerald-600';
    if (grado?.includes('3')) return 'text-rose-600';
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
          .credencial-page { page-break-after: always; width: 54mm; height: 85.6mm; overflow: hidden !important; position: relative; font-family: sans-serif; box-sizing: border-box; }
        }
        @media screen {
          .print-only { display: none !important; }
        }
      `}</style>
      
      {students.map(student => (
        <React.Fragment key={student.id}>
          {/* FRENTE DE LA TARJETA */}
          <div className="credencial-page bg-white flex flex-col justify-between overflow-hidden">
            {/* Header */}
            <div className={`${getGradeColor(student.grado)} text-white p-1 text-center shadow-md relative z-10 rounded-b-md`}>
              <h1 className="text-[7px] font-bold uppercase leading-tight tracking-wider">Secretaría de Educación Pública</h1>
              <h2 className="text-[10px] font-black leading-tight mt-0.5 tracking-tight">Esc. Sec. Téc. N°68</h2>
              <p className="text-[6px] uppercase opacity-90 font-bold tracking-widest">Renacimiento</p>
            </div>

            {/* Body */}
            <div className="flex-1 flex flex-col items-center pt-1 px-2 pb-0.5 text-center relative z-0">
              {/* Foto */}
              <div className={`w-16 h-20 mt-0.5 border-2 rounded-md overflow-hidden bg-slate-100 ${getGradeColor(student.grado)} shadow-sm z-10 flex-shrink-0`}>
                {student.fotoUrl ? (
                  <img src={student.fotoUrl} alt="Foto" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-100">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  </div>
                )}
              </div>

              {/* Datos Personales */}
              <div className="mt-1 w-full z-10 leading-none">
                <p className={`text-[10px] font-black uppercase leading-tight tracking-tight ${getTextColor(student.grado)}`}>
                  {student.apellidoPaterno} {student.apellidoMaterno}
                </p>
                <p className="text-[8px] font-bold text-slate-700 uppercase leading-tight mt-0.5">
                  {student.nombres}
                </p>
                <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                  {student.matricula}
                </p>
              </div>

              {/* Datos Académicos */}
              <div className="grid grid-cols-2 gap-x-1 w-full mt-1.5 z-10 border-t border-slate-200 pt-1">
                <div>
                  <p className="text-[4.5px] font-bold text-slate-400 uppercase tracking-widest">Grado/Grupo</p>
                  <p className="text-[8px] font-black text-slate-800">{student.grado?.substring(0,1)}° "{student.grupo || '-'}"</p>
                </div>
                <div>
                  <p className="text-[4.5px] font-bold text-slate-400 uppercase tracking-widest">Turno</p>
                  <p className="text-[8px] font-black text-slate-800 uppercase">{student.turno?.substring(0,4) || 'MATU'}.</p>
                </div>
                <div className="col-span-2 mt-0.5">
                  <p className="text-[4.5px] font-bold text-slate-400 uppercase tracking-widest">Taller</p>
                  <p className="text-[7px] font-bold text-slate-800 leading-tight truncate">{student.taller || 'Sin Asignar'}</p>
                </div>
              </div>
            </div>

            {/* Footer (QR) */}
            <div className="p-1 border-t border-slate-200 bg-slate-50 flex flex-col items-center justify-center z-10 h-14">
              <div className="bg-white p-0.5 rounded border shadow-sm">
                <QRCodeSVG 
                  value={JSON.stringify({ m: student.matricula, id: student.id, c: "25-26" })} 
                  size={32} 
                  level="M"
                />
              </div>
              <p className="text-[4px] font-bold text-slate-400 mt-0.5 uppercase text-center tracking-widest">Válida Ciclo 25-26</p>
            </div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}
