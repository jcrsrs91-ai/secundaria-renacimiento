import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Award, Printer, X, Star } from 'lucide-react';

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
  const nombreCompleto = `${student.nombres} ${student.apellidoPaterno} ${student.apellidoMaterno}`.toUpperCase();

  return createPortal(
    <div id="print-modal-overlay" className="fixed inset-0 z-50 bg-slate-900/90 flex justify-center overflow-y-auto custom-scrollbar">
      <style>
        {`
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
          }
          
          .elegant-border {
            border: 12px solid #0f172a; /* slate-900 */
            outline: 4px solid #ca8a04; /* amber-600 */
            outline-offset: -20px;
          }
          
          .bg-pattern {
            background-image: radial-gradient(#94a3b8 1px, transparent 1px);
            background-size: 20px 20px;
            opacity: 0.1;
          }
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
        <div className="diploma-container elegant-border flex flex-col items-center justify-center relative p-8">
          
          {/* Fondo sutil */}
          <div className="absolute inset-0 bg-pattern pointer-events-none"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-amber-50 opacity-90 pointer-events-none"></div>

          {/* Sello de agua central sutil */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
            <img src="/logo-escuela.png" alt="Watermark" className="w-[500px] h-[500px] object-contain grayscale" />
          </div>

          <div className="relative z-10 w-full h-full flex flex-col items-center justify-between py-6">
            
            {/* Header Logos */}
            <div className="w-full flex items-center justify-between px-16">
              <img src="/logo-sep.png" alt="SEP" className="w-56 object-contain" />
              <img src="/logo-escuela.png" alt="Escudo" className="w-32 h-32 object-contain" />
            </div>

            {/* Institución */}
            <div className="text-center mt-[-20px]">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-[0.3em] mb-1">La Escuela Secundaria Técnica No. 68 "Renacimiento"</h2>
              <p className="text-xs font-semibold text-slate-400 tracking-widest">C.C.T. 12DST0077B</p>
              <p className="text-[10px] font-medium text-slate-400 tracking-widest mt-1">Otorga el presente</p>
            </div>

            {/* Título del Diploma */}
            <div className="text-center my-4 relative">
              <div className="flex items-center justify-center gap-4 mb-2">
                <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
                <h1 className="text-4xl font-serif font-black text-slate-900 tracking-widest">DIPLOMA DE EXCELENCIA</h1>
                <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
              </div>
              <h2 className="text-2xl font-serif italic text-amber-600 tracking-widest">ACADÉMICA DE GENERACIÓN</h2>
            </div>

            <p className="text-xs font-medium text-slate-500 tracking-[0.2em] uppercase mt-2">A:</p>

            {/* Nombre del Alumno */}
            <div className="my-4 w-full max-w-4xl border-b-2 border-slate-900 pb-2 flex justify-center">
              <h2 className="text-4xl font-black text-slate-900 tracking-widest" style={{ wordSpacing: '0.4em' }}>{nombreCompleto}</h2>
            </div>

            {/* Razón */}
            <div className="max-w-4xl text-center px-12">
              <p className="text-lg text-slate-700 leading-relaxed font-medium">
                En reconocimiento a su brillante desempeño, dedicación y esfuerzo constante durante los tres años de su educación secundaria (Generación <strong className="text-slate-900 font-bold">{generacion}</strong>). Su resiliencia ante los desafíos y su conducta ejemplar le han hecho merecedor del más alto reconocimiento de nuestra institución, culminando sus estudios con un promedio general de:
              </p>
              
              <div className="mt-6 flex justify-center">
                <div className="text-3xl font-black text-amber-500 bg-slate-900 px-8 py-2 rounded-lg shadow-xl tracking-wider">
                  {promedio}
                </div>
              </div>
            </div>

            {/* Fecha */}
            <p className="text-sm text-slate-500 font-semibold italic mt-8 mb-6">
              Acapulco de Juárez, Gro., a {getFormattedDate()}
            </p>

            {/* Firmas */}
            <div className="w-full flex justify-between px-16">
              <div className="w-64 flex flex-col items-center">
                <div className="w-full border-b-[1.5px] border-slate-900 mb-2"></div>
                <p className="text-[11px] font-bold text-slate-900 uppercase text-center h-8 flex items-center justify-center leading-tight">{firmas.coordinador.nombre}</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{firmas.coordinador.cargo}</p>
              </div>
              <div className="w-64 flex flex-col items-center">
                <div className="w-full border-b-[1.5px] border-slate-900 mb-2"></div>
                <p className="text-[11px] font-bold text-slate-900 uppercase text-center h-8 flex items-center justify-center leading-tight">{firmas.subdirector.nombre}</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{firmas.subdirector.cargo}</p>
              </div>
              <div className="w-64 flex flex-col items-center">
                <div className="w-full border-b-[1.5px] border-slate-900 mb-2"></div>
                <p className="text-[11px] font-bold text-slate-900 uppercase text-center h-8 flex items-center justify-center leading-tight">{firmas.director.nombre}</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{firmas.director.cargo}</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
