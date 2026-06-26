import React from 'react';
import { createPortal } from 'react-dom';
import { Award, Printer, X, Medal } from 'lucide-react';

export default function DiplomaPrint({ alumnos = [], turno, onClose }) {
  const getFirmas = () => {
    if (turno === 'Matutino') {
      return {
        coordinador: { nombre: 'Profa. Lucila Rodríguez Morales', cargo: 'Coordinadora Académica' },
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

  return createPortal(
    <div className="fixed inset-0 z-50 bg-slate-900/90 flex justify-center overflow-y-auto print:bg-white print:block print:static print:inset-auto print:overflow-visible custom-scrollbar">
      <style>
        {`
          @media print {
            @page { size: letter landscape; margin: 0; }
            #root { display: none !important; }
            html, body { height: auto !important; min-height: 100% !important; overflow: visible !important; display: block !important; margin: 0; padding: 0; background: white; }
            .print-wrapper { position: relative; width: 100%; height: auto; display: block !important; text-align: center; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            aside, header, .no-print { display: none !important; }
            
            .print-page-wrapper {
              width: 100vw;
              height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              page-break-after: always;
              margin: 0;
              padding: 0;
              overflow: hidden;
            }
            .diploma-container { 
              width: 265mm; 
              height: 200mm; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              position: relative; 
              overflow: hidden; 
              page-break-after: avoid;
              page-break-inside: avoid;
              margin: 0 !important;
              box-sizing: border-box; 
              flex-shrink: 0;
            }
          }
          .diploma-container {
            width: 265mm;
            height: 200mm;
            background: white;
            position: relative;
            margin: 2rem auto;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            flex-shrink: 0;
          }
          .gold-border {
            border: 12px double #ca8a04;
            outline: 2px solid #ca8a04;
            outline-offset: -18px;
            border-radius: 12px;
          }
        `}
      </style>

      <div className="absolute top-6 right-6 flex gap-3 no-print fixed z-[60]">
        <button onClick={() => window.print()} className="flex items-center px-5 py-2.5 bg-amber-600 text-white rounded-xl shadow-lg hover:bg-amber-700 transition font-bold">
          <Printer className="w-5 h-5 mr-2" /> Imprimir
        </button>
        <button onClick={onClose} className="p-2.5 bg-white text-slate-500 rounded-xl shadow-lg hover:bg-slate-100 hover:text-slate-800 transition">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="w-full flex flex-col items-center print-wrapper">
        {alumnos.map((ganador, index) => {
          const { student, average, place, periodoName } = ganador;
          const nombreCompleto = `${student.nombres} ${student.apellidoPaterno} ${student.apellidoMaterno}`.toUpperCase();
          const placeText = place === 1 ? 'PRIMER LUGAR' : place === 2 ? 'SEGUNDO LUGAR' : 'TERCER LUGAR';
          
          return (
            <div key={index} className="print-page-wrapper">
              <div className="diploma-container gold-border p-8 bg-[#fffdf5]">
                {/* Background watermark pattern */}
              <div 
                className="absolute inset-0 pointer-events-none grayscale" 
                style={{ 
                  opacity: 0.10,
                  backgroundImage: 'url(/logo-escuela.png), url(/logo-escuela.png)', 
                  backgroundSize: '300px 300px', 
                  backgroundRepeat: 'repeat',
                  backgroundPosition: '0 0, 150px 150px'
                }}
              ></div>

              {/* Decorative Corners */}
              <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-amber-500"></div>
              <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-amber-500"></div>
              <div className="absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 border-amber-500"></div>
              <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-amber-500"></div>

              <div className="relative z-10 w-full h-full flex flex-col items-center text-center justify-between py-4">
                
                {/* Header with 2 Logos */}
                <div className="w-full flex items-center justify-between px-12 mt-2">
                  <img src="/logo-sep.png" alt="SEP" className="w-48 object-contain" />
                  <div className="flex-1 px-4 text-center mt-1">
                    <h1 className="text-xl font-black text-slate-800 uppercase tracking-widest mb-0.5">Secretaría de Educación Guerrero</h1>
                    <h2 className="text-base font-bold text-slate-600 uppercase tracking-wider mb-0.5">Escuela Secundaria Técnica No. 68 "Renacimiento"</h2>
                    <h3 className="text-xs font-semibold text-slate-500 tracking-widest">C.C.T. 12DST0077B</h3>
                  </div>
                  <img src="/logo-escuela.png" alt="Escudo" className="w-28 h-28 object-contain" />
                </div>

                {/* Title */}
                <div className="mt-2 mb-1">
                  <h1 className="text-3xl font-serif italic text-amber-700 tracking-wide mb-1">Diploma de Aprovechamiento</h1>
                  <p className="text-xs font-medium text-slate-600 tracking-widest uppercase">La dirección de la escuela otorga el presente reconocimiento a:</p>
                </div>

                {/* Student Name */}
                <div className="my-2 w-full max-w-4xl border-b border-amber-300 pb-2 relative flex justify-center">
                  <div className="bg-white/90 backdrop-blur-sm px-8 py-2 rounded-xl shadow-sm border border-white/50 text-center">
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">{nombreCompleto}</h2>
                    <p className="text-sm font-bold text-amber-700 tracking-widest uppercase mt-1">
                      {student.grado} Grado Grupo "{student.grupo}"
                    </p>
                  </div>
                </div>

                {/* Reason */}
                <div className="max-w-4xl mb-1 px-8 flex-1 flex flex-col justify-center items-center">
                  <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-white/50 flex flex-col items-center">
                    <p className="text-lg text-slate-700 leading-relaxed font-medium text-justify relative z-10" style={{ textJustify: 'inter-word' }}>
                      Por su destacada dedicación, disciplina y excelencia académica demostrados durante el presente ciclo escolar. Habiendo obtenido el <strong className="text-amber-700">{placeText}</strong> de aprovechamiento escolar correspondiente al <strong className="text-slate-900">{periodoName}</strong> en sus estudios de educación secundaria del Turno <strong>{turno}</strong>, y logrando un promedio sobresaliente de:
                    </p>
                    <div className="mt-3 text-2xl font-black text-slate-800 bg-amber-50 border border-amber-200 py-1.5 px-6 rounded-xl inline-block shadow-inner relative z-10">
                      {average.toFixed(1)}
                    </div>
                  </div>
                </div>

                {/* Date */}
                <p className="text-xs text-slate-500 font-semibold italic mb-4">
                  Acapulco de Juárez, Gro., a {new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>

                {/* Signatures */}
                <div className="w-full flex justify-between px-12 mb-2">
                  <div className="w-64 flex flex-col items-center">
                    <div className="w-full border-b-2 border-slate-800 mb-2"></div>
                    <p className="text-xs font-bold text-slate-800 uppercase text-center h-8 flex items-center justify-center leading-tight">{firmas.coordinador.nombre}</p>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{firmas.coordinador.cargo}</p>
                  </div>
                  <div className="w-64 flex flex-col items-center">
                    <div className="w-full border-b-2 border-slate-800 mb-2"></div>
                    <p className="text-xs font-bold text-slate-800 uppercase text-center h-8 flex items-center justify-center leading-tight">{firmas.subdirector.nombre}</p>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{firmas.subdirector.cargo}</p>
                  </div>
                  <div className="w-64 flex flex-col items-center">
                    <div className="w-full border-b-2 border-slate-800 mb-2"></div>
                    <p className="text-xs font-bold text-slate-800 uppercase text-center h-8 flex items-center justify-center leading-tight">{firmas.director.nombre}</p>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{firmas.director.cargo}</p>
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>,
    document.body
  );
}
