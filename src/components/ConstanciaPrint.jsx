import React from 'react';

export default function ConstanciaPrint({ student }) {
  if (!student) return null;

  return (
    <div className="print-constancia-only">
      <style>{`
        @media print {
          @page { size: letter; margin: 2.5cm; }
          html, body, #root { height: auto !important; overflow: visible !important; min-height: auto !important; display: block !important; }
          * { overflow: visible !important; }
          aside, header { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; margin: 0; }
          .print-constancia-only { display: block !important; }
        }
        @media screen {
          .print-constancia-only { display: none !important; }
        }
      `}</style>
      
      <div className="bg-white text-slate-800 font-serif leading-relaxed text-justify relative z-10" style={{ fontSize: '13pt' }}>
         {/* HEADER LOGOS AND TITLE */}
         <div className="flex justify-between items-center mb-6">
            <img src="/logo-sep.png" alt="SEP Guerrero" className="w-24 object-contain" />
            <div className="text-center flex-1 px-4">
              <h1 className="font-black text-2xl tracking-widest text-slate-900 uppercase">Sistema Educativo Nacional</h1>
              <h2 className="font-bold text-lg text-slate-700 mt-1 uppercase">Subsecretaría de Educación Básica</h2>
              <h3 className="font-semibold text-md text-slate-600 uppercase">Escuela Secundaria Técnica N° 68 "Renacimiento"</h3>
              <p className="text-sm font-medium text-slate-500 mt-1">C.C.T. 12DST0068Z</p>
            </div>
            <img src="/logo-escuela.png" alt="EST 68" className="w-24 object-contain" />
         </div>

         <div className="text-right mb-16 font-bold uppercase">
            <p>ASUNTO: CONSTANCIA DE ESTUDIOS</p>
            <p className="mt-4 text-lg normal-case font-normal text-left">A quien corresponda:</p>
         </div>

         <p className="mb-8 indent-12">
            El que suscribe, <strong>Profr. Juan Carlos Taboada Barajas</strong>, Director de la Escuela Secundaria Técnica N° 68 "Renacimiento", por medio de la presente:
         </p>

         <div className="text-center mb-8 font-black text-xl tracking-[0.3em] uppercase">
            C E R T I F I C A
         </div>

         <p className="mb-8 indent-12">
            Que el (la) alumno(a) <strong>{student.apellidoPaterno} {student.apellidoMaterno} {student.nombres}</strong>, con matrícula escolar <strong>{student.matricula}</strong>, se encuentra legalmente inscrito(a) y cursando el <strong>{student.grado}</strong>, Grupo <strong>"{student.grupo}"</strong>, en el turno <strong>{student.turno || 'Matutino'}</strong> durante el ciclo escolar vigente 2025-2026.
         </p>

         <p className="mb-24 indent-12">
            A petición de la parte interesada y para los fines legales que a la misma convenga, se expide la presente constancia en la ciudad sede, a los {new Date().getDate()} días del mes de {new Date().toLocaleString('es-MX', { month: 'long' })} del año {new Date().getFullYear()}.
         </p>

         <div className="text-center mt-32">
            <p className="font-bold tracking-widest">A T E N T A M E N T E</p>
            <div className="mt-16 mb-2 border-b-2 border-slate-800 w-80 mx-auto"></div>
            <p className="font-bold text-lg mt-4">PROFR. JUAN CARLOS TABOADA BARAJAS</p>
            <p className="font-sans text-sm mt-1 text-slate-600">DIRECTOR DEL PLANTEL</p>
         </div>

         {/* SELLO OFICIAL SIMULADO */}
         <div className="absolute bottom-10 left-10 w-40 h-40 border-4 border-slate-300 rounded-full flex flex-col items-center justify-center opacity-40 -rotate-12">
            <p className="text-[9px] font-bold uppercase tracking-widest mb-1">SEP</p>
            <div className="w-24 h-px bg-slate-300 mb-1"></div>
            <p className="text-[12px] font-black uppercase text-center leading-tight">Sello de la<br/>Institución</p>
         </div>
      </div>
    </div>
  );
}
