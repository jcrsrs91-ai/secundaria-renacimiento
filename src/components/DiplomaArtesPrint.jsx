import React from 'react';
import { X, Printer, Music, Sparkles, Star, Palette } from 'lucide-react';
import { autoAcentuar } from '../utils/format';

export default function DiplomaArtesPrint({ student, turno, onClose }) {
  const isVespertino = turno === 'Vespertino';
  
  const directorMatutino = "PROF. JUAN CARLOS TABOADA BARAJAS";
  const directorVespertino = "MTRA. MARTHA LAURA CABRERA SILVA";
  const directorActual = isVespertino ? directorVespertino : directorMatutino;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/90 flex flex-col items-center overflow-y-auto print:bg-white print:p-0">
      
      <div className="w-full max-w-[297mm] mx-auto p-4 flex justify-between items-center print:hidden sticky top-0 bg-slate-900/90 backdrop-blur z-20">
        <div className="flex gap-4">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-amber-600 hover:from-rose-600 hover:to-amber-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-rose-500/30"
          >
            <Printer className="w-5 h-5" />
            Imprimir Diploma de Artes
          </button>
        </div>
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
            size: A4 landscape;
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: white !important;
          }
          .print-page {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 12mm !important;
            width: 297mm !important;
            height: 210mm !important;
            page-break-after: always;
            overflow: hidden;
            background-color: white !important;
          }
          .art-border-outer {
            border: 8px solid #be123c; /* rose-700 */
            border-radius: 16px;
            height: 100%;
            padding: 4px;
            position: relative;
            background: linear-gradient(135deg, #fff1f2 0%, #ffffff 50%, #fffbeb 100%) !important;
          }
          .art-border-inner {
            border: 3px dashed #f59e0b; /* amber-500 */
            border-radius: 12px;
            height: 100%;
            padding: 24px;
            position: relative;
            text-align: center;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
          }
          .corner-tl, .corner-tr, .corner-bl, .corner-br {
            position: absolute;
            width: 40px;
            height: 40px;
            border: 4px solid #be123c;
            z-index: 10;
          }
          .corner-tl { top: -4px; left: -4px; border-right: none; border-bottom: none; }
          .corner-tr { top: -4px; right: -4px; border-left: none; border-bottom: none; }
          .corner-bl { bottom: -4px; left: -4px; border-right: none; border-top: none; }
          .corner-br { bottom: -4px; right: -4px; border-left: none; border-top: none; }
        `}
      </style>

      <div className="w-full flex justify-center pb-8 pt-4" style={{ minHeight: '100vh' }}>
        <div 
          className="print-page bg-white relative mx-auto shadow-2xl" 
          style={{ width: '297mm', height: '210mm', padding: '12mm' }}
        >
          <div className="art-border-outer">
            <div className="corner-tl"></div>
            <div className="corner-tr"></div>
            <div className="corner-bl"></div>
            <div className="corner-br"></div>
            
            <div className="art-border-inner">
              
              <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                <img src="/logo-escuela.png" alt="Watermark" className="w-[500px] h-[500px] object-contain grayscale" />
              </div>
              
              <div className="relative z-10 w-full h-full flex flex-col items-center justify-between">
                
                {/* Cabecera con Logos Oficiales */}
                <div className="w-full flex items-center justify-between px-8">
                  <div className="w-40">
                    <img src="/logo-sep.png" alt="SEP" className="w-40 object-contain" />
                  </div>
                  <div className="text-center flex-1 px-4">
                     <p className="text-[10px] font-bold text-slate-700 uppercase tracking-[0.2em] mb-1">Secretaría de Educación Pública</p>
                     <h2 className="text-sm font-black text-rose-900 uppercase tracking-[0.15em]">Escuela Secundaria Técnica No. 68 "Renacimiento"</h2>
                     <p className="text-[10px] font-bold text-slate-600 tracking-widest mt-1.5">
                       C.C.T. 12DST0077B <span className="mx-2 text-rose-300">•</span> Zona Escolar 24
                     </p>
                  </div>
                  <div className="w-40 flex justify-end">
                    <img src="/logo-escuela.png" alt="Escudo" className="w-20 h-20 object-contain" />
                  </div>
                </div>

                {/* Título Artístico con Iconos */}
                <div className="text-center mt-6 mb-8 relative">
                  <div className="absolute -left-12 top-0 opacity-40 text-amber-500 transform -rotate-12"><Music className="w-12 h-12" /></div>
                  <div className="absolute -right-12 top-4 opacity-40 text-rose-500 transform rotate-12"><Palette className="w-10 h-10" /></div>
                  <div className="absolute left-1/4 -top-6 opacity-30 text-amber-400"><Sparkles className="w-8 h-8" /></div>
                  <div className="absolute right-1/4 -top-4 opacity-30 text-rose-400"><Star className="w-6 h-6" /></div>

                  <h1 
                    className="text-6xl font-black text-rose-700 mb-2 drop-shadow-md"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: '0.05em' }}
                  >
                    RECONOCIMIENTO
                  </h1>
                  <div className="flex items-center justify-center gap-4">
                    <div className="h-px w-16 bg-amber-500"></div>
                    <p className="text-lg tracking-[0.2em] text-amber-600 font-bold uppercase" style={{ fontFamily: "Inter, sans-serif" }}>
                      Al Mérito Artístico
                    </p>
                    <div className="h-px w-16 bg-amber-500"></div>
                  </div>
                </div>

                <div className="mb-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-bold">Otorga el presente a:</p>
                </div>

                {/* Nombre del Alumno y Grado */}
                <div className="w-[95%] border-b-2 border-amber-400 pb-4 mb-10 flex flex-col items-center">
                  <h2 
                    className="text-4xl font-black text-slate-900 tracking-wide text-center drop-shadow-sm leading-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-full px-2"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    {autoAcentuar(student.nombres)} {autoAcentuar(student.apellidoPaterno)} {autoAcentuar(student.apellidoMaterno)}
                  </h2>
                  <p className="text-sm font-black text-rose-700 mt-3 tracking-[0.2em] uppercase">
                    ALUMNO DE {student.grado} GRUPO "{student.grupo}"
                  </p>
                </div>

                {/* Leyenda Expandida */}
                <div className="w-[85%] flex-1 flex flex-col justify-center mb-4">
                  <p 
                    className="text-[1.1rem] leading-loose text-slate-700 italic font-medium"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    Por su destacado compromiso, disciplina y pasión artística demostrada como integrante activo del <strong className="text-rose-800 font-black text-[1.2rem] px-1">Taller de Danza Xochipilli</strong>, enriqueciendo el acervo cultural de nuestra institución durante el ciclo escolar 2025-2026.
                  </p>
                </div>

                {/* Contenedor Inferior: Fecha y Firmas ancladas abajo */}
                <div className="w-full mt-auto">
                  {/* Fecha desplazada un poco a la derecha */}
                  <div className="w-full flex justify-end px-16 mb-16">
                    <p className="text-[11px] text-slate-600 font-bold tracking-wider">
                      Acapulco de Juárez, Gro., a 15 de julio de 2026
                    </p>
                  </div>

                  {/* Firmas */}
                  <div className="w-full grid grid-cols-2 gap-32 px-12 pb-4">
                    <div className="flex flex-col items-center justify-end">
                      <div className="w-full border-t border-slate-400 pt-2 text-center">
                        <p className="text-[11px] font-black text-slate-800 tracking-wider">PROFA. MARBELLA SANTANA ALCARAZ</p>
                        <p className="text-[9px] text-rose-700 font-bold uppercase mt-1 tracking-[0.15em]">
                          Maestra del Taller de Danza
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-end">
                      <div className="w-full border-t border-slate-400 pt-2 text-center">
                        <p className="text-[11px] font-black text-slate-800 tracking-wider">{directorActual}</p>
                        <p className="text-[9px] text-slate-600 font-bold uppercase mt-1 tracking-[0.15em]">Director de la Escuela</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
