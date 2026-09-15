import React from 'react';
import { useGlobalConfig } from '../hooks/useGlobalConfig';
import { QRCodeSVG } from 'qrcode.react';

// TamaÃ±o CR80 (54mm x 85.6mm)
export default function CredencialPrint({ students = [] }) {
  const { config } = useGlobalConfig();
  const getGradeColor = (grado) => {
    // 1ro Rojo/Guinda, 2do Azul, 3ro Verde
    if (grado?.includes('1')) return 'bg-red-800 border-red-800';
    if (grado?.includes('2')) return 'bg-blue-700 border-blue-700';
    if (grado?.includes('3')) return 'bg-emerald-700 border-emerald-700';
    return 'bg-slate-800 border-slate-800'; // Default
  };

  const getTextColor = (grado) => {
    if (grado?.includes('1')) return 'text-red-800';
    if (grado?.includes('2')) return 'text-blue-700';
    if (grado?.includes('3')) return 'text-emerald-700';
    return 'text-slate-800';
  };

  const getSchoolCycle = () => { return config?.cicloEscolarActual || "2025-2026"; // Fallback 
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed, 7 is August
    return month >= 7 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  };

  return (
    <div className="print-only">
      <style>{`
        @media print {
          @page { size: 54mm 85.6mm; margin: 0; }
          html, body, #root { height: auto !important; overflow: visible !important; min-height: auto !important; display: block !important; }
          * { overflow: visible !important; }
          aside, header { display: none !important; }
          body { 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
            margin: 0; padding: 0; background: white;
            text-rendering: optimizeLegibility;
            -webkit-font-smoothing: antialiased;
          }
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
          img {
            image-rendering: -webkit-optimize-contrast;
            image-rendering: high-quality;
          }
          svg {
            shape-rendering: crispEdges;
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
            <div className={`${getGradeColor(student.grado)} text-white relative z-10 rounded-b flex items-center justify-center h-[12mm] w-full box-border overflow-hidden shadow-md`}>
              <img src="/logo-sep.png" alt="SEP" className="absolute left-[1.5mm] top-[1mm] h-[10mm] w-[10mm] object-contain drop-shadow-sm" />
              
              <div className="flex flex-col justify-center items-center text-center z-10 mx-[13mm]">
                <h1 className="text-[5.5px] font-extrabold uppercase leading-none tracking-wide whitespace-nowrap">
                  Secretaría de Educación Pública
                </h1>
                <h2 className="text-[7px] font-black leading-none tracking-tight mt-[1px]">Esc. Sec. Téc. N°68</h2>
                <h3 className="text-[8px] font-black leading-none mt-[1px] tracking-[0.15em] text-yellow-300 drop-shadow-md">RENACIMIENTO</h3>
                <p className="text-[4.5px] font-bold tracking-widest mt-[1px] opacity-90">
                  C.C.T. 12DST0077B
                </p>
              </div>

              <img src="/logo-escuela.png" alt="Escuela" className="absolute right-[1.5mm] top-[1mm] h-[10mm] w-[10mm] object-contain drop-shadow-sm" />
            </div>

            {/* Body */}
            <div className="flex-1 flex flex-col w-full relative z-0">
              
              {/* Contenedor Foto + Nombres */}
              <div className="flex px-1.5 pt-1 pb-0 gap-1 items-center">
                {/* Foto */}
                <div className={`w-[19mm] h-[24mm] border-[1.5px] rounded-sm overflow-hidden bg-slate-50 ${getGradeColor(student.grado)} shadow-sm z-10 flex-shrink-0`}>
                  {student.fotoUrl ? (
                    <img src={student.fotoUrl} alt="Foto" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    </div>
                  )}
                </div>
                
                {/* Nombres y Matrícula */}
                <div className="flex-1 flex flex-col justify-center leading-none mt-0">
                  <p className={`text-[12.5px] font-black uppercase leading-[1.0] tracking-tight ${getTextColor(student.grado)}`}>
                    {student.apellidoPaterno} <br/> {student.apellidoMaterno}
                  </p>
                  <p className="text-[11px] font-bold text-slate-700 uppercase leading-tight mt-0">
                    {student.nombres}
                  </p>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-2">
                    MAT: {student.matricula}
                  </p>
                  <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-0.5">
                    CURP: {student.curp || 'NO REGISTRADA'}
                  </p>
                  <div className="mt-1.5 inline-block bg-slate-800 rounded px-1 py-0.5 self-start shadow-sm border border-slate-700">
                    <p className="text-[6px] font-black text-white uppercase tracking-widest leading-none">
                      VIGENCIA: {getSchoolCycle()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Datos Académicos y Sangre */}
              <div className="grid grid-cols-3 gap-x-1 px-1 w-full z-10 mt-0">
                <div>
                  <p className="text-[6px] font-bold text-slate-500 uppercase tracking-widest">Grado / Grupo / Turno</p>
                  <p className="text-[11px] font-black text-slate-900 leading-tight">
                    {student.grado?.substring(0,1)}° "{student.grupo || '-'}" <span className="text-[7px] font-bold text-slate-500">{student.turno?.substring(0,4) || 'MATU'}</span>
                  </p>
                </div>
                <div>
                  <p className="text-[6px] font-bold text-slate-500 uppercase tracking-widest">T. Sangre</p>
                  <p className="text-[11px] font-black text-red-600 leading-tight">{student.tipoSangre || 'No Esp.'}</p>
                </div>
                <div>
                  <p className="text-[6px] font-bold text-slate-500 uppercase tracking-widest">Taller</p>
                  <p className="text-[8.5px] font-bold text-slate-900 leading-[1.1]">{student.taller || 'Sin Asignar'}</p>
                </div>
              </div>

              {/* Contacto de Emergencia y Leyenda */}
              <div className="px-1 mt-0 border-t-[0.5px] border-slate-300 pt-[1px] bg-red-50/40">
                <p className="text-[6px] font-bold text-red-600 uppercase tracking-widest">En caso de emergencia avisar a:</p>
                <div className="flex justify-between items-end mt-0">
                  <p className="text-[7.5px] font-black text-slate-800 leading-[1.1] flex-1 pr-1">{student.tutorNombre || student.tutor || student.nombreTutor || 'No registrado'}</p>
                  <p className="text-[7.5px] font-black text-slate-900 leading-[1.1] flex-shrink-0">Tel: {student.telefono || student.celularTutor || student.telefonoTutor || 'N/A'}</p>
                </div>
              </div>

              {/* Leyenda Oficial SEP */}
              <div className="px-1 mt-0 text-center">
                 <p className="text-[5.5px] font-bold text-slate-700 leading-tight text-center px-1">
                   Esta credencial acredita al portador como alumno(a) regular de esta Institución incorporada a la SEP. Es personal e intransferible.
                 </p>
              </div>
            </div>

            {/* Footer: 2 QR Codes y Firma */}
            <div className="px-1 border-t-[0.5px] border-slate-300 flex flex-row items-end justify-between z-10 pb-[2px] h-[22mm] bg-slate-50/50 mt-0">
              
              {/* QR 1: Para Celulares (URL) */}
              <div className="flex flex-col items-center justify-end">
                <div className="flex-shrink-0 bg-white border border-slate-300 shadow-sm self-center flex items-center justify-center overflow-hidden p-[1mm]" style={{ width: '17mm', height: '17mm' }}>
                  <QRCodeSVG 
                    value={`https://web-tec-68.web.app/verificar/${student.matricula}`} 
                    size={256} 
                    style={{ width: '100%', height: '100%', display: 'block' }}
                    level="M"
                    includeMargin={false}
                    fgColor="#000000"
                    bgColor="#FFFFFF"
                  />
                </div>
                <p className="text-[4px] font-bold text-slate-500 mt-[1px]">CELULARES</p>
              </div>

              {/* Firma Director (Centro) */}
              <div className="flex-1 flex flex-col items-center justify-end h-full pb-[1px] px-1">
                <div className="w-full flex justify-center h-[9mm] mb-[1px] relative z-20">
                  <img src="/firma-director.png" alt="Firma" className="h-full w-auto object-contain" />
                </div>
                <div className="w-full border-b-[1px] border-slate-800 mb-[1px] z-10"></div>
                <p className="text-[4px] font-black text-slate-900 uppercase text-center leading-[1.1] tracking-tight">Profr. J. C. Taboada B.</p>
                <p className="text-[3.5px] font-bold text-slate-600 uppercase text-center leading-tight">Director</p>
              </div>

              {/* QR 2: Para Escáner (Matrícula) */}
              <div className="flex flex-col items-center justify-end">
                <div className="flex-shrink-0 bg-white border border-slate-300 shadow-sm self-center flex items-center justify-center overflow-hidden p-[1mm]" style={{ width: '17mm', height: '17mm' }}>
                  <QRCodeSVG 
                    value={student.matricula} 
                    size={256} 
                    style={{ width: '100%', height: '100%', display: 'block' }}
                    level="M"
                    includeMargin={false}
                    fgColor="#000000"
                    bgColor="#FFFFFF"
                  />
                </div>
                <p className="text-[4px] font-bold text-blue-600 mt-[1px]">ASISTENCIA</p>
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
