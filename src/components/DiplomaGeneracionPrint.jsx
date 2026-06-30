import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Award, Printer, X, Star } from 'lucide-react';
import { autoAcentuar } from '../utils/format';

export default function DiplomaGeneracionPrint({ student, promedio, generacion, turno, onClose }) {
  const [fecha] = useState(() => new Date().toISOString().split('T')[0]);

  const getFormattedDate = () => {
    if (!fecha) return '';
    const d = new Date(`${fecha}T12:00:00`);
    return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getFirmas = () => {
    if (turno === 'Matutino') {
      return {
        coordinador: { nombre: 'Profa. Lucila Rodríguez Martínez', cargo: 'Coordinadora Académica' },
        subdirector: { nombre: 'Prof. Ubaldo Meza Lorenzo', cargo: 'Subdirector' },
        director: { nombre: 'Prof. Juan Carlos Taboada Barajas', cargo: 'Director' }
      };
    } else {
      return {
        coordinador: { nombre: 'Prof. José Barrera Vázquez', cargo: 'Coordinador Académico' },
        subdirector: { nombre: 'Profa. Teresa de Jesús Salazar Moreno', cargo: 'Subdirectora' },
        director: { nombre: 'Prof. Juan Carlos Taboada Barajas', cargo: 'Director' }
      };
    }
  };

  const firmas = getFirmas();
  
  if (!student) return null;
  const nombreCompleto = `${autoAcentuar(student.nombres)} ${autoAcentuar(student.apellidoPaterno)} ${autoAcentuar(student.apellidoMaterno)}`.toUpperCase();

  return createPortal(
    <div id="print-modal-overlay" className="fixed inset-0 z-50 bg-slate-900/90 flex justify-center overflow-y-auto custom-scrollbar">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Montserrat:wght@300;400;500;600;700;900&family=Pinyon+Script&display=swap');
          
          @media print {
            @page { size: letter landscape; margin: 0; }
            #root { display: none !important; }
            
            #print-modal-overlay {
              position: static !important;
              display: block !important;
              height: auto !important;
              min-height: 100% !important;
              overflow: visible !important;
              background: white !important;
            }
            
            html, body { height: auto !important; min-height: 100% !important; overflow: visible !important; display: block !important; margin: 0; padding: 0; background: white; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            aside, header, .no-print { display: none !important; }
            
            .print-page-wrapper {
              width: 100vw;
              height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0;
              padding: 0;
              overflow: hidden;
            }
            
            .diploma-container { 
              width: 265mm; 
              height: 200mm; 
              position: relative; 
              overflow: hidden; 
              margin: 0 auto !important;
              box-sizing: border-box; 
              box-shadow: none !important;
            }
          }
          
          .diploma-container {
            width: 265mm;
            height: 200mm;
            background: #fff;
            position: relative;
            margin: 2rem auto;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            overflow: hidden;
            font-family: 'Montserrat', sans-serif;
            padding: 15px;
            box-sizing: border-box;
          }
          
          /* Marco exterior azul marino */
          .border-outer {
              border: 2px solid #1A2B4C;
              width: 100%;
              height: 100%;
              padding: 8px;
              box-sizing: border-box;
          }

          /* Marco interior dorado */
          .border-inner {
              border: 1px solid #C5A059;
              width: 100%;
              height: 100%;
              position: relative;
              padding: 30px 40px;
              box-sizing: border-box;
              text-align: center;
              display: flex;
              flex-direction: column;
              justify-content: flex-start;
              background: linear-gradient(to bottom right, #ffffff, #fdfbf7);
          }

          /* Adornos dorados en las esquinas */
          .corner {
              position: absolute;
              width: 50px;
              height: 50px;
              border: 3px solid #C5A059;
          }
          .tl { top: 15px; left: 15px; border-right: none; border-bottom: none; }
          .tr { top: 15px; right: 15px; border-left: none; border-bottom: none; }
          .bl { bottom: 15px; left: 15px; border-right: none; border-top: none; }
          .br { bottom: 15px; right: 15px; border-left: none; border-top: none; }
          
          .font-cinzel { font-family: 'Cinzel', serif; }
          .font-pinyon { font-family: 'Pinyon Script', cursive; }
          .font-montserrat { font-family: 'Montserrat', sans-serif; }
          
          .text-navy { color: #1A2B4C; }
          .text-gold { color: #C5A059; }
          .border-navy { border-color: #1A2B4C; }
        `}
      </style>

      <div className="absolute top-4 right-8 flex gap-4 no-print z-50">
        <button 
          onClick={() => {
            setTimeout(() => window.print(), 500);
          }} 
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-bold flex items-center shadow-lg transition-colors"
        >
          <Printer className="w-5 h-5 mr-2" />
          Imprimir Diploma
        </button>
        <button 
          onClick={onClose} 
          className="bg-slate-700 hover:bg-slate-800 text-white px-6 py-2 rounded-lg font-bold flex items-center shadow-lg transition-colors"
        >
          <X className="w-5 h-5 mr-2" />
          Cerrar
        </button>
      </div>

      <div className="print-page-wrapper">
        <div className="diploma-container">
          <div className="border-outer">
            <div className="border-inner">
              <div className="corner tl"></div>
              <div className="corner tr"></div>
              <div className="corner bl"></div>
              <div className="corner br"></div>

              {/* Sello de agua central sutil */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none">
                <img src="/logo-escuela.png" alt="Watermark" className="w-[450px] h-[450px] object-contain grayscale" />
              </div>

              <div className="relative z-10 w-full h-full flex flex-col items-center justify-between">
                
                {/* Header Logos */}
                <div className="w-full flex items-center justify-between px-8">
                  <img src="/logo-sep.png" alt="SEP" className="w-48 object-contain" />
                  <div className="text-center">
                     <p className="text-[10px] font-bold text-navy uppercase tracking-[0.2em] mb-1">Secretaría de Educación Pública</p>
                     <h2 className="text-[14px] font-black text-navy uppercase tracking-[0.2em]">Escuela Secundaria Técnica No. 68 "Renacimiento"</h2>
                     <p className="text-[10px] font-semibold text-slate-500 tracking-widest mt-1">C.C.T. 12DST0077B</p>
                  </div>
                  <img src="/logo-escuela.png" alt="Escudo" className="w-24 h-24 object-contain" />
                </div>

                <div className="text-center mt-2">
                  <p className="font-pinyon text-3xl text-gold mb-2">otorga el presente</p>
                </div>

                {/* Título del Diploma */}
                <div className="text-center mb-2">
                  <h1 className="text-5xl font-cinzel font-black text-navy tracking-[0.2em] mb-2 leading-none drop-shadow-sm">DIPLOMA</h1>
                  <h2 className="text-xl font-cinzel font-bold text-gold tracking-[0.3em]">DE EXCELENCIA ACADÉMICA</h2>
                </div>

                <p className="text-[11px] font-medium text-slate-400 tracking-[0.2em] uppercase mt-2">A:</p>

                {/* Nombre del Alumno */}
                <div className="my-2 w-full max-w-4xl border-b-[1px] border-gold pb-1 flex justify-center">
                  <h2 className="text-4xl font-cinzel font-black text-navy tracking-widest" style={{ wordSpacing: '0.4em' }}>{nombreCompleto}</h2>
                </div>

                {/* Razón */}
                <div className="max-w-3xl text-center px-4 mt-2">
                  <p className="text-[13pt] text-navy leading-relaxed font-medium font-montserrat">
                    En reconocimiento a su brillante desempeño, dedicación y esfuerzo constante durante los tres años de su educación secundaria (Generación <strong className="font-bold">{generacion}</strong>). 
                    Su resiliencia ante los desafíos y su conducta ejemplar le han hecho merecedor del más alto reconocimiento de nuestra institución.
                  </p>
                  
                  <div className="mt-4 flex flex-col items-center justify-center">
                    <span className="text-[10px] uppercase tracking-widest text-slate-500 mb-1 font-bold">Promedio Final de Generación</span>
                    <div className="text-3xl font-cinzel font-black text-white bg-navy px-8 py-1 rounded-sm shadow-md tracking-wider border border-gold">
                      {promedio}
                    </div>
                  </div>
                </div>

                {/* Fecha */}
                <p className="text-[11px] text-slate-500 font-medium mt-4">
                  Acapulco de Juárez, Gro., a {getFormattedDate()}
                </p>

                {/* Firmas */}
                <div className="w-full flex justify-between px-8 mt-2">
                  <div className="w-64 flex flex-col items-center">
                    <div className="w-full border-b-[1px] border-navy mb-1"></div>
                    <p className="text-[10px] font-bold text-navy uppercase text-center h-8 flex items-center justify-center leading-tight font-montserrat">{firmas.coordinador.nombre}</p>
                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">{firmas.coordinador.cargo}</p>
                  </div>
                  <div className="w-64 flex flex-col items-center">
                    <div className="w-full border-b-[1px] border-navy mb-1"></div>
                    <p className="text-[10px] font-bold text-navy uppercase text-center h-8 flex items-center justify-center leading-tight font-montserrat">{firmas.subdirector.nombre}</p>
                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">{firmas.subdirector.cargo}</p>
                  </div>
                  <div className="w-64 flex flex-col items-center">
                    <div className="w-full border-b-[1px] border-navy mb-1"></div>
                    <p className="text-[10px] font-bold text-navy uppercase text-center h-8 flex items-center justify-center leading-tight font-montserrat">{firmas.director.nombre}</p>
                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">{firmas.director.cargo}</p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
