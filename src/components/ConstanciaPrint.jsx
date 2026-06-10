import React from 'react';

export default function ConstanciaPrint({ student, type = 'simple', materiasPorGrado = {} }) {
  if (!student) return null;

  const materias = materiasPorGrado[student.grado] || [];
  
  // Cálculo de calificaciones para la tabla
  let promedioGeneral = '-';
  const calificacionesData = materias.map(mat => {
    const t1 = parseFloat(student.calificaciones?.['t1']?.[mat.id]);
    const t2 = parseFloat(student.calificaciones?.['t2']?.[mat.id]);
    const t3 = parseFloat(student.calificaciones?.['t3']?.[mat.id]);
    
    let sum = 0;
    let count = 0;
    if (!isNaN(t1)) { sum += t1; count++; }
    if (!isNaN(t2)) { sum += t2; count++; }
    if (!isNaN(t3)) { sum += t3; count++; }
    
    const finalMat = count > 0 ? (sum / count).toFixed(1) : '-';
    return {
      name: mat.name,
      t1: isNaN(t1) ? '-' : t1.toFixed(1),
      t2: isNaN(t2) ? '-' : t2.toFixed(1),
      t3: isNaN(t3) ? '-' : t3.toFixed(1),
      final: finalMat,
      numFinal: count > 0 ? (sum / count) : null
    };
  });

  // Promedio general de todas las materias
  let sumGral = 0;
  let countGral = 0;
  calificacionesData.forEach(mat => {
    if (mat.numFinal !== null) {
      sumGral += mat.numFinal;
      countGral++;
    }
  });
  if (countGral > 0) {
    promedioGeneral = (sumGral / countGral).toFixed(1);
  }

  return (
    <div className="print-constancia-only">
      <style>{`
        @media print {
          @page { size: letter; margin: 1cm 2.5cm; }
          html, body, #root { height: auto !important; overflow: visible !important; min-height: auto !important; display: block !important; }
          * { overflow: visible !important; }
          aside, header { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; margin: 0; }
          .print-constancia-only { display: block !important; }
          
          /* Watermark */
          .watermark::before {
            content: "";
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 80%;
            height: 80%;
            background-image: url('/logo-escuela.png');
            background-repeat: no-repeat;
            background-position: center;
            background-size: contain;
            opacity: 0.05;
            z-index: -1;
          }
        }
        @media screen {
          .print-constancia-only { display: none !important; }
        }
      `}</style>
      
      <div className={`bg-white text-slate-800 font-serif text-justify relative z-10 watermark ${type === 'calificaciones' ? 'leading-snug' : 'leading-relaxed'}`} style={{ fontSize: type === 'calificaciones' ? '10pt' : '12pt' }}>
         {/* HEADER LOGOS AND TITLE */}
         <div className={`flex justify-between items-center border-b-2 border-slate-200 ${type === 'calificaciones' ? 'mb-3 pb-2' : 'mb-4 pb-2'}`}>
            <img src="/logo-sep.png" alt="SEP Guerrero" className="w-24 object-contain" />
            <div className="text-center flex-1 px-4">
              <h1 className="font-black text-[14pt] tracking-widest text-slate-900 uppercase">Sistema Educativo Nacional</h1>
              <h2 className="font-bold text-[11pt] text-slate-700 mt-1 uppercase">Subsecretaría de Educación Básica</h2>
              <h3 className="font-semibold text-[10pt] text-slate-600 uppercase mt-1">Escuela Secundaria Técnica N° 68 "Renacimiento"</h3>
              <p className="text-[9pt] font-medium text-slate-500 mt-0.5">C.C.T. 12DST0077B</p>
            </div>
            <img src="/logo-escuela.png" alt="EST 68" className="w-20 object-contain" />
         </div>

         <div className={`text-right font-bold uppercase text-[11pt] ${type === 'calificaciones' ? 'mb-4' : 'mb-6'}`}>
            <p>ASUNTO: CONSTANCIA DE ESTUDIOS {type === 'calificaciones' && 'CON CALIFICACIONES'}</p>
            <p className="mt-4 text-[12pt] normal-case font-normal text-left">A quien corresponda:</p>
         </div>

         <p className="mb-4 indent-12">
            El que suscribe, <strong>Profr. Juan Carlos Taboada Barajas</strong>, Director de la Escuela Secundaria Técnica N° 68 "Renacimiento", por medio de la presente:
         </p>

         <div className="text-center mb-4 font-black text-lg tracking-[0.3em] uppercase">
            C E R T I F I C A
         </div>

         <p className="mb-4 indent-12">
            Que el (la) alumno(a) <strong>{student.apellidoPaterno} {student.apellidoMaterno} {student.nombres}</strong>, con matrícula escolar <strong>{student.matricula}</strong>, se encuentra legalmente inscrito(a) y cursando el <strong>{student.grado}</strong>, Grupo <strong>"{student.grupo}"</strong>, en el turno <strong>{student.turno || 'Matutino'}</strong> durante el ciclo escolar vigente 2025-2026.
         </p>

         {/* TABLA DE CALIFICACIONES INYECTADA */}
         {type === 'calificaciones' && (
           <div className="mb-4 w-full">
             <p className="mb-1 indent-12">
               A continuación se detalla el historial académico y las calificaciones obtenidas hasta el momento de la expedición de este documento:
             </p>
             <table className="w-full text-[9pt] border-collapse border border-slate-300">
               <thead>
                 <tr className="bg-slate-100">
                   <th className="border border-slate-300 px-3 py-1 text-left font-bold w-1/2">Asignatura</th>
                   <th className="border border-slate-300 px-2 py-1 text-center font-bold">1° Trim.</th>
                   <th className="border border-slate-300 px-2 py-1 text-center font-bold">2° Trim.</th>
                   <th className="border border-slate-300 px-2 py-1 text-center font-bold">3° Trim.</th>
                   <th className="border border-slate-300 px-2 py-1 text-center font-bold bg-slate-200">Final</th>
                 </tr>
               </thead>
               <tbody>
                 {calificacionesData.map((mat, i) => (
                   <tr key={i}>
                     <td className="border border-slate-300 px-3 py-0.5 font-medium">{mat.name}</td>
                     <td className="border border-slate-300 px-2 py-0.5 text-center">{mat.t1}</td>
                     <td className="border border-slate-300 px-2 py-0.5 text-center">{mat.t2}</td>
                     <td className="border border-slate-300 px-2 py-0.5 text-center">{mat.t3}</td>
                     <td className="border border-slate-300 px-2 py-0.5 text-center font-bold bg-slate-50">{mat.final}</td>
                   </tr>
                 ))}
                 <tr>
                   <td colSpan="4" className="border border-slate-300 px-3 py-1 text-right font-black uppercase">Promedio General Acumulado:</td>
                   <td className="border border-slate-300 px-2 py-1 text-center font-black text-lg">{promedioGeneral}</td>
                 </tr>
               </tbody>
             </table>
           </div>
         )}

         <p className={`indent-12 ${type === 'calificaciones' ? 'mb-6' : 'mb-16'}`}>
            A petición de la parte interesada y para los fines legales que a la misma convenga, se expide la presente constancia en la ciudad sede, a los {new Date().getDate()} días del mes de {new Date().toLocaleString('es-MX', { month: 'long' })} del año {new Date().getFullYear()}.
         </p>

         <div className={`text-center relative ${type === 'calificaciones' ? 'mt-8' : 'mt-8'}`}>
            <p className="font-bold tracking-widest text-[11pt]">A T E N T A M E N T E</p>
            <div className={`border-b border-black w-80 mx-auto ${type === 'calificaciones' ? 'mt-8 mb-2' : 'mt-10 mb-2'}`}></div>
            <p className="font-bold text-[12pt] mt-2 uppercase">Profr. Juan Carlos Taboada Barajas</p>
            <p className="font-sans text-[10pt] mt-1 text-slate-600 font-bold">DIRECTOR DEL PLANTEL</p>
            
            {/* SELLO OFICIAL SIMULADO (Alineado junto a la firma) */}
            <div className="absolute top-10 left-10 w-32 h-32 border-4 border-slate-300 rounded-full flex flex-col items-center justify-center opacity-40 -rotate-12">
               <p className="text-[8px] font-bold uppercase tracking-widest mb-1">SEP</p>
               <div className="w-20 h-px bg-slate-300 mb-1"></div>
               <p className="text-[10px] font-black uppercase text-center leading-tight">Sello de la<br/>Institución</p>
            </div>
         </div>
      </div>
    </div>
  );
}
