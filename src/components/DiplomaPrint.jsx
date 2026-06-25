import React from 'react';
import { Award, Printer, X, Medal } from 'lucide-react';

export default function DiplomaPrint({ alumnos = [], turno, onClose }) {
  const getFirmas = () => {
    if (turno === 'Matutino') {
      return {
        coordinador: { nombre: 'Mtra. Lucila Rodríguez Morales', cargo: 'Coordinadora Académica' },
        subdirector: { nombre: 'Prof. Ubaldo Meza Lorenzo', cargo: 'Subdirector' },
        director: { nombre: 'Prof. Juan Carlos Taboada Barajas', cargo: 'Director' }
      };
    } else {
      return {
        coordinador: { nombre: 'Mtro. José Barrera Vázquez', cargo: 'Coordinador Académico' },
        subdirector: { nombre: 'Mtra. Teresa de Jesús Salazar Moreno', cargo: 'Subdirectora' },
        director: { nombre: 'Prof. Juan Carlos Taboada Barajas', cargo: 'Director' }
      };
    }
  };

  const firmas = getFirmas();

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/90 flex justify-center overflow-y-auto print:bg-white print:block print:inset-auto print:overflow-visible custom-scrollbar">
      <style>
        {`
          @media print {
            @page { size: landscape; margin: 0; }
            html, body, #root { height: 100% !important; overflow: visible !important; display: block !important; margin: 0; padding: 0; background: white; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            aside, header, .no-print { display: none !important; }
            .page-break-after { page-break-after: always; }
            .diploma-container { width: 297mm; height: 210mm; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; page-break-after: always; margin: 0 auto; box-sizing: border-box; }
          }
          .diploma-container {
            width: 297mm;
            height: 210mm;
            background: white;
            position: relative;
            margin: 2rem auto;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
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

      <div className="w-full flex flex-col items-center">
        {alumnos.map((ganador, index) => {
          const { student, average, place, periodoName } = ganador;
          const nombreCompleto = `${student.nombres} ${student.apellidoPaterno} ${student.apellidoMaterno}`.toUpperCase();
          const placeText = place === 1 ? 'PRIMER LUGAR' : place === 2 ? 'SEGUNDO LUGAR' : 'TERCER LUGAR';
          
          return (
            <div key={index} className="diploma-container gold-border p-12 bg-[#fffdf5]">
              {/* Background watermark */}
              <div className="absolute inset-0 opacity-5 flex items-center justify-center pointer-events-none">
                <img src="/logo-escuela.png" alt="Watermark" className="w-[500px] h-[500px] object-contain grayscale" />
              </div>

              {/* Decorative Corners */}
              <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-amber-500"></div>
              <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-amber-500"></div>
              <div className="absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 border-amber-500"></div>
              <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-amber-500"></div>

              <div className="relative z-10 w-full h-full flex flex-col items-center text-center justify-between py-4">
                
                {/* Header with 2 Logos */}
                <div className="w-full flex items-center justify-between px-16 mt-4">
                  <img src="/logo-sep.png" alt="SEP" className="w-48 object-contain" />
                  <div className="flex-1 px-8 text-center mt-2">
                    <h1 className="text-2xl font-black text-slate-800 uppercase tracking-widest mb-1">Secretaría de Educación Guerrero</h1>
                    <h2 className="text-lg font-bold text-slate-600 uppercase tracking-wider mb-0.5">Escuela Secundaria Técnica "Renacimiento"</h2>
                    <h3 className="text-sm font-semibold text-slate-500 tracking-widest">C.C.T. 12EES0000X</h3>
                  </div>
                  <img src="/logo-escuela.png" alt="Escudo" className="w-24 h-24 object-contain" />
                </div>

                {/* Title */}
                <div className="mt-8 mb-4">
                  <h1 className="text-5xl font-serif italic text-amber-700 tracking-wide mb-4">Diploma de Aprovechamiento</h1>
                  <p className="text-lg font-medium text-slate-600 tracking-widest uppercase">La dirección de la escuela otorga el presente reconocimiento a:</p>
                </div>

                {/* Student Name */}
                <div className="my-6 w-full max-w-4xl border-b border-amber-300 pb-2">
                  <h2 className="text-5xl font-black text-slate-800 tracking-tight">{nombreCompleto}</h2>
                </div>

                {/* Reason */}
                <div className="max-w-4xl mb-4 px-8 flex-1 flex flex-col justify-center items-center">
                  <p className="text-xl text-slate-700 leading-relaxed font-medium text-justify" style={{ textJustify: 'inter-word' }}>
                    Por su destacada dedicación, disciplina y excelencia académica demostrados durante el presente ciclo escolar. Habiendo obtenido el <strong className="text-amber-700">{placeText}</strong> de aprovechamiento escolar correspondiente al <strong className="text-slate-900">{periodoName}</strong> en sus estudios de educación secundaria, cursando en el <strong>{student.grado} Grupo "{student.grupo}"</strong> del Turno <strong>{turno}</strong>, y logrando un promedio sobresaliente de:
                  </p>
                  <div className="mt-6 text-4xl font-black text-slate-800 bg-amber-50 border border-amber-200 py-3 px-8 rounded-2xl inline-block shadow-inner">
                    {average.toFixed(1)}
                  </div>
                </div>

                {/* Date */}
                <p className="text-sm text-slate-500 font-semibold italic mb-8">
                  Acapulco de Juárez, Gro., a {new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>

                {/* Signatures */}
                <div className="w-full flex justify-between px-16 mb-4">
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
    </div>
  );
}
