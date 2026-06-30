import React from 'react';
import { truncateTo1Dec, getCalificacionFinal, autoAcentuar } from '../utils/format';

const extraerFechaDeCurp = (curp) => {
  if (!curp || curp.length < 10) return null;
  const yy = curp.substring(4, 6);
  const mm = curp.substring(6, 8);
  const dd = curp.substring(8, 10);
  if (isNaN(yy) || isNaN(mm) || isNaN(dd)) return null;
  const yearNum = parseInt(yy, 10);
  // Asumimos que los años menores o iguales a 30 son de los 2000s
  const fullYear = yearNum <= 30 ? 2000 + yearNum : 1900 + yearNum;
  return `${dd}/${mm}/${fullYear}`;
};

const promedioALetras = (promedioNum) => {
  if (!promedioNum) return '';
  const num = parseFloat(promedioNum);
  if (isNaN(num)) return '';

  const enteros = Math.floor(num);
  const decimal = Math.round((num - enteros) * 10);

  const numWords = {
    5: 'CINCO',
    6: 'SEIS',
    7: 'SIETE',
    8: 'OCHO',
    9: 'NUEVE',
    10: 'DIEZ'
  };

  const decWords = {
    0: 'CERO',
    1: 'UNO',
    2: 'DOS',
    3: 'TRES',
    4: 'CUATRO',
    5: 'CINCO',
    6: 'SEIS',
    7: 'SIETE',
    8: 'OCHO',
    9: 'NUEVE'
  };

  const enteroStr = numWords[enteros] || enteros.toString();
  if (enteros === 10 && decimal === 0) {
      return 'DIEZ PUNTO CERO';
  }
  const decStr = decWords[decimal] || 'CERO';

  return `${enteroStr} PUNTO ${decStr}`;
};

export default function ConstanciaPrint({ student, type = 'simple', materiasPorGrado = {} }) {
  if (!student) return null;

  const materias = materiasPorGrado[student.grado] || [];
  
  // Cálculo de calificaciones para la tabla
  let promedioGeneral = '-';
  const calificacionesData = materias.map(mat => {
    const t1 = parseFloat(student.calificaciones?.['t1']?.[mat.id]);
    const t2 = parseFloat(student.calificaciones?.['t2']?.[mat.id]);
    const t3 = parseFloat(student.calificaciones?.['t3']?.[mat.id]);
    
    const califFinalObj = getCalificacionFinal(student, mat.id);
    let finalMat = '-';
    let numFinal = null;
    let isRegularizacion = false;

    if (califFinalObj) {
       finalMat = truncateTo1Dec(califFinalObj.valor);
       numFinal = califFinalObj.valor;
       isRegularizacion = califFinalObj.isRegularizacion;
    }
    
    return {
      name: autoAcentuar(mat.name),
      t1: truncateTo1Dec(t1),
      t2: truncateTo1Dec(t2),
      t3: truncateTo1Dec(t3),
      final: isRegularizacion ? `${finalMat}*` : finalMat,
      numFinal: numFinal,
      isRegularizacion
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
    promedioGeneral = truncateTo1Dec(sumGral / countGral, '');
  }

  return (
    <div className="print-constancia-only">
      <style>{`
        @media print {
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
      <div className="page-container relative block">
        <div className="page-border"></div>
        
        <div className={`bg-white px-10 py-6 text-slate-800 font-serif text-justify relative z-10 watermark ${type === 'calificaciones' ? 'leading-snug' : 'leading-loose'}`} style={{ fontSize: type === 'calificaciones' ? '10pt' : '11pt' }}>
         {/* HEADER LOGOS AND TITLE */}
         {/* HEADER LOGOS AND TITLE */}
         <div className="flex items-center justify-between mb-4">
            <img src="/logo-sep.png" alt="Logo SEP / Guerrero" className="w-24 h-20 object-contain shrink-0" />
            <div className="flex-1 text-center px-4">
              <h1 className="font-black text-[14pt] tracking-widest text-slate-900 uppercase font-sans">Sistema Educativo Nacional</h1>
              <h2 className="font-bold text-[11pt] text-slate-700 mt-1 uppercase font-sans">Subsecretaría de Educación Básica</h2>
              <h3 className="font-semibold text-[10pt] text-slate-600 uppercase mt-1 font-serif">Escuela Secundaria Técnica N° 68 "Renacimiento"</h3>
              <p className="text-[9pt] font-medium text-slate-500 mt-0.5 font-sans">C.C.T. 12DST0077B</p>
            </div>
            <img src="/logo-escuela.png" alt="EST 68" className="w-24 h-20 object-contain shrink-0" />
         </div>
         <hr className="border-t-[1.5px] border-gray-800 mb-6" />

         <div className={`text-right font-bold uppercase text-[11pt] ${type === 'calificaciones' ? 'mb-4' : 'mb-6'}`}>
            <p>ASUNTO: CONSTANCIA DE ESTUDIOS {type === 'calificaciones' && 'CON CALIFICACIONES'}</p>
            <p className="mt-4 text-[12pt] normal-case font-normal text-left">A quien corresponda:</p>
         </div>

         <p className="mb-6 indent-12">
            El que suscribe, <strong>Profr. Juan Carlos Taboada Barajas</strong>, Director de la Escuela Secundaria Técnica N° 68 "Renacimiento", con domicilio en Calle Alta Quebradora y Andador 24 de Febrero S/N, Cd. Renacimiento, C.P. 39715, Tel. 744 441 5678, por medio de la presente:
         </p>

         <div className="text-center mb-6 font-black text-lg tracking-[0.3em] uppercase">
            C E R T I F I C A
         </div>

         {type === 'terminacion' ? (
           <p className="mb-6 indent-12">
             Que el (la) alumno(a) <strong>{autoAcentuar(student.apellidoPaterno)} {autoAcentuar(student.apellidoMaterno)} {autoAcentuar(student.nombres)}</strong>, con fecha de nacimiento <strong>{student.fechaNacimiento || extraerFechaDeCurp(student.curp) || '___/___/_____'}</strong>, Clave Única de Registro de Población (CURP) <strong>{student.curp || '__________________'}</strong> y matrícula escolar <strong>{student.matricula}</strong>, concluyó satisfactoriamente sus estudios correspondientes a la Educación Secundaria en el ciclo escolar 2025-2026 en esta Institución Educativa.
           </p>
         ) : type === 'promedio_generacion' ? (
           <p className="mb-6 indent-12">
             Que el (la) alumno(a) <strong>{autoAcentuar(student.apellidoPaterno)} {autoAcentuar(student.apellidoMaterno)} {autoAcentuar(student.nombres)}</strong>, con fecha de nacimiento <strong>{student.fechaNacimiento || extraerFechaDeCurp(student.curp) || '___/___/_____'}</strong>, Clave Única de Registro de Población (CURP) <strong>{student.curp || '__________________'}</strong> y matrícula escolar <strong>{student.matricula}</strong>, concluyó satisfactoriamente sus estudios de educación secundaria en esta institución durante la <strong>Generación 2023-2026</strong>.
           </p>
         ) : (
           <p className="mb-6 indent-12">
             Que el (la) alumno(a) <strong>{autoAcentuar(student.apellidoPaterno)} {autoAcentuar(student.apellidoMaterno)} {autoAcentuar(student.nombres)}</strong>, con fecha de nacimiento <strong>{student.fechaNacimiento || extraerFechaDeCurp(student.curp) || '___/___/_____'}</strong>, Clave Única de Registro de Población (CURP) <strong>{student.curp || '__________________'}</strong> y matrícula escolar <strong>{student.matricula}</strong>, se encuentra legalmente inscrito(a) y cursando el <strong>{student.grado}</strong>, Grupo <strong>"{student.grupo}"</strong>, en el turno <strong>{student.turno || 'Matutino'}</strong> durante el ciclo escolar vigente 2025-2026.
           </p>
         )}

         {type === 'promedio_ciclo' && (
           <p className="mb-6 indent-12 font-medium">
             Y ha obtenido hasta la fecha un Promedio General en el presente ciclo escolar de: <strong className="whitespace-nowrap">{promedioGeneral} ({promedioALetras(promedioGeneral)})</strong>.
           </p>
         )}

         {type === 'promedio_generacion' && (
           <p className="mb-6 indent-12 font-medium">
             Y de acuerdo con nuestros registros, obtuvo un Promedio General de Generación de: <strong className="whitespace-nowrap">{student.manualPromedio || '___'} ({promedioALetras(student.manualPromedio)})</strong>.
           </p>
         )}

         {type === 'terminacion' && (
           <p className="mb-6 indent-12 font-medium">
             Se hace constar que cuenta con un Promedio de Nivel Educativo (Certificado) de: <strong className="whitespace-nowrap">{student.manualPromedio || '___'} ({promedioALetras(student.manualPromedio)})</strong>.
           </p>
         )}

          {/* TABLA DE CALIFICACIONES INYECTADA */}
         {type === 'calificaciones' && (
           <div className="mb-2 w-full">
             <p className="mb-1 indent-12">
               A continuación se detalla el historial académico y las calificaciones obtenidas hasta el momento de la expedición de este documento:
             </p>
             <table className="w-full text-[8.5pt] border-collapse border border-slate-300">
               <thead>
                 <tr className="bg-slate-100">
                   <th className="border border-slate-300 px-2 py-0.5 text-left font-bold w-1/2">Asignatura</th>
                   <th className="border border-slate-300 px-1 py-0.5 text-center font-bold">1° Trim.</th>
                   <th className="border border-slate-300 px-1 py-0.5 text-center font-bold">2° Trim.</th>
                   <th className="border border-slate-300 px-1 py-0.5 text-center font-bold">3° Trim.</th>
                   <th className="border border-slate-300 px-1 py-0.5 text-center font-bold bg-slate-200">Final</th>
                 </tr>
               </thead>
               <tbody>
                 {calificacionesData.map((mat, i) => (
                   <tr key={i}>
                     <td className="border border-slate-300 px-2 py-[1px] font-medium leading-tight">{mat.name}</td>
                     <td className="border border-slate-300 px-1 py-[1px] text-center leading-tight">{mat.t1}</td>
                     <td className="border border-slate-300 px-1 py-[1px] text-center leading-tight">{mat.t2}</td>
                     <td className="border border-slate-300 px-1 py-[1px] text-center leading-tight">{mat.t3}</td>
                     <td className="border border-slate-300 px-1 py-[1px] text-center font-bold bg-slate-50 leading-tight">{mat.final}</td>
                   </tr>
                 ))}
                 <tr>
                   <td colSpan="4" className="border border-slate-300 px-2 py-0.5 text-right font-black uppercase">Promedio General:</td>
                   <td className="border border-slate-300 px-1 py-0.5 text-center font-black text-[10pt]">{promedioGeneral}</td>
                 </tr>
               </tbody>
             </table>
            </div>
         )}
         {type === 'calificaciones' && calificacionesData.some(m => m.isRegularizacion) && (
           <p className="text-[8pt] text-slate-500 italic mb-2 -mt-2">
             * Calificación obtenida en periodo de regularización.
           </p>
         )}

         {type === 'calificaciones' && student.manualPromedio && student.grado === '3er Grado' && (
           <p className="mt-4 mb-2 indent-12 text-[10pt] text-justify font-bold">
             Adicionalmente, se hace constar que el (la) alumno(a) cuenta con un Promedio de Nivel Educativo (Certificado) de: <span className="whitespace-nowrap">{student.manualPromedio} ({promedioALetras(student.manualPromedio)})</span>.
           </p>
         )}

         {type === 'terminacion' ? (
           <p className={`indent-12 ${type === 'calificaciones' ? 'mb-2' : 'mb-10'}`}>
             A petición de la parte interesada y para los fines legales que a la misma convenga, se expide la presente constancia en la ciudad sede, <strong>a los 15 días del mes de julio del año 2026</strong>.
           </p>
         ) : (
           <p className={`indent-12 ${type === 'calificaciones' ? 'mb-2' : 'mb-10'}`}>
             A petición de la parte interesada y para los fines legales que a la misma convenga, se expide la presente constancia en la ciudad sede, a los {new Date().getDate()} días del mes de {new Date().toLocaleString('es-MX', { month: 'long' })} del año {new Date().getFullYear()}.
           </p>
         )}

         <div className={`text-center relative ${type === 'calificaciones' ? 'mt-4' : 'mt-10'}`}>
            <p className="font-bold tracking-widest text-[11pt]">A T E N T A M E N T E</p>
            <div className={`border-b border-black w-80 mx-auto ${type === 'calificaciones' ? 'mt-4 mb-2' : 'mt-10 mb-2'}`}></div>
            <p className="font-bold text-[12pt] mt-2 uppercase">Profr. Juan Carlos Taboada Barajas</p>
            <p className="font-sans text-[10pt] mt-1 text-slate-600 font-bold">DIRECTOR DEL PLANTEL</p>
            
            {/* SELLO OFICIAL SIMULADO (Alineado junto a la firma) */}
            <div className="absolute top-10 left-10 w-32 h-32 border-4 border-slate-300 rounded-full flex flex-col items-center justify-center opacity-10 -rotate-12">
               <p className="text-[8px] font-bold uppercase tracking-widest mb-1">SEP</p>
               <div className="w-20 h-px bg-slate-300 mb-1"></div>
               <p className="text-[10px] font-black uppercase text-center leading-tight">Sello de la<br/>Institución</p>
            </div>
         </div>
        </div>
      </div>
    </div>
  );
}
