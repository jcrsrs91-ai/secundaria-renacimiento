import React, { useMemo } from 'react';
import { AlertCircle, Printer, X } from 'lucide-react';
import { truncateTo1Dec } from '../utils/format';

export default function EficienciaTerminalPrint({ activos = [], bajas = [], materiasPorGrado = {}, onClose }) {
  
  // Calculadora de materias reprobadas por alumno
  const getMateriasReprobadas = (student, materias) => {
    let reprobadas = 0;
    const c = student.calificaciones || {};
    materias.forEach(mat => {
      let sum = 0;
      let count = 0;
      ['t1', 't2', 't3'].forEach(t => {
        const val = parseFloat(c[t]?.[mat.id]);
        if (!isNaN(val)) { sum += val; count++; }
      });
      const avg = count > 0 ? sum / count : 0;
      if (avg > 0 && avg < 6.0) {
        reprobadas++;
      }
    });
    return reprobadas;
  };

  const processData = () => {
    const data = {
      Matutino: { insH: 0, insM: 0, insT: 0, egCertH: 0, egCertM: 0, egCertT: 0, egSinCertH: 0, egSinCertM: 0, egSinCertT: 0 },
      Vespertino: { insH: 0, insM: 0, insT: 0, egCertH: 0, egCertM: 0, egCertT: 0, egSinCertH: 0, egSinCertM: 0, egSinCertT: 0 },
      TOTALES: { insH: 0, insM: 0, insT: 0, egCertH: 0, egCertM: 0, egCertT: 0, egSinCertH: 0, egSinCertM: 0, egSinCertT: 0 }
    };
    
    const sinGenero = [];

    // Juntamos activos y bajas, solo nos interesa 3er Grado
    const allTercero = [...activos, ...bajas].filter(s => s.grado === '3er Grado');
    const materiasTercero = materiasPorGrado['3er Grado'] || [];

    allTercero.forEach(s => {
      // Ignorar los que ingresaron por Alta (en 2do o 3ro) según regla E4
      if (s.tipoIngreso === 'Alta') return;

      const turno = s.turno || 'Matutino';
      if (!data[turno]) return;

      const isHombre = s.genero?.toLowerCase().startsWith('h') || s.genero?.toLowerCase() === 'masculino';
      const isMujer = s.genero?.toLowerCase().startsWith('m') || s.genero?.toLowerCase() === 'femenino';
      
      if (!isHombre && !isMujer) {
        sinGenero.push(s);
      }

      // Sumar a inscripción inicial (Todos los que estaban desde 1ro, sean activos o bajas hoy en día)
      data[turno].insT++;
      data.TOTALES.insT++;
      if (isHombre) { data[turno].insH++; data.TOTALES.insH++; }
      if (isMujer) { data[turno].insM++; data.TOTALES.insM++; }

      // Egresados (solo los que llegaron activos hasta el final)
      const isActive = s.status === 'Activo' || s.status === 'Egresado';
      if (isActive) {
        const reprobadas = getMateriasReprobadas(s, materiasTercero);
        
        if (reprobadas === 0) {
          // Con Certificado
          data[turno].egCertT++;
          data.TOTALES.egCertT++;
          if (isHombre) { data[turno].egCertH++; data.TOTALES.egCertH++; }
          if (isMujer) { data[turno].egCertM++; data.TOTALES.egCertM++; }
        } else {
          // Sin Certificado (adeudan disciplinas)
          data[turno].egSinCertT++;
          data.TOTALES.egSinCertT++;
          if (isHombre) { data[turno].egSinCertH++; data.TOTALES.egSinCertH++; }
          if (isMujer) { data[turno].egSinCertM++; data.TOTALES.egSinCertM++; }
        }
      }
    });

    return { data, sinGenero };
  };

  const { data, sinGenero } = useMemo(processData, [activos, bajas, materiasPorGrado]);

  const calcEficiencia = (egresados, inscripcion) => {
    if (inscripcion === 0) return '#DIV/0!';
    return truncateTo1Dec((egresados * 100) / inscripcion) + '%';
  };

  const renderRow = (label, turnoKey, isTotal = false) => {
    const row = data[turnoKey];
    return (
      <tr key={label} className={`text-center ${isTotal ? 'bg-yellow-300 font-black text-black border-t-2 border-black' : 'bg-white font-medium text-slate-800 border-b border-slate-300'}`}>
        <td className="py-2 px-2 border-r border-slate-300 print:py-1 uppercase font-bold">{label}</td>
        
        {/* Inscripción Inicial */}
        <td className="py-2 px-2 border-r border-slate-300 print:py-1">{row.insH}</td>
        <td className="py-2 px-2 border-r border-slate-300 print:py-1">{row.insM}</td>
        <td className="py-2 px-2 border-r border-slate-300 print:py-1 font-bold">{row.insT}</td>
        
        {/* Egresados Con Certificado */}
        <td className="py-2 px-2 border-r border-slate-300 print:py-1">{row.egCertH}</td>
        <td className="py-2 px-2 border-r border-slate-300 print:py-1">{row.egCertM}</td>
        <td className="py-2 px-2 border-r border-slate-300 print:py-1 font-bold">{row.egCertT}</td>
        
        {/* Egresados Sin Certificado */}
        <td className="py-2 px-2 border-r border-slate-300 print:py-1">{row.egSinCertH}</td>
        <td className="py-2 px-2 border-r border-slate-300 print:py-1">{row.egSinCertM}</td>
        <td className="py-2 px-2 border-r border-slate-300 print:py-1 font-bold">{row.egSinCertT}</td>
        
        {/* % Eficiencia Terminal */}
        <td className="py-2 px-2 border-r border-slate-300 print:py-1 font-bold">{calcEficiencia(row.egCertH, row.insH)}</td>
        <td className="py-2 px-2 border-r border-slate-300 print:py-1 font-bold">{calcEficiencia(row.egCertM, row.insM)}</td>
        <td className="py-2 px-2 print:py-1 font-bold">{calcEficiencia(row.egCertT, row.insT)}</td>
      </tr>
    );
  };

  return (
    <div className="w-full bg-slate-100 min-h-screen py-8 print:py-0 print:bg-white print-eficiencia-only">
      
      {/* Controles */}
      <div className="no-print max-w-5xl mx-auto mb-6 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Vista Previa: Eficiencia Terminal (E4)</h2>
          <p className="text-sm text-slate-500">Impresión configurada para Tamaño Carta.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg transition-colors flex items-center">
            <Printer className="w-5 h-5 mr-2" />
            Imprimir Formato
          </button>
          {onClose && (
            <button onClick={onClose} className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg transition-colors flex items-center">
              <X className="w-5 h-5 mr-2" />
              Cerrar Vista Previa
            </button>
          )}
        </div>
      </div>

      <div className="bg-white max-w-5xl mx-auto p-10 rounded-2xl shadow-xl print:shadow-none print:p-0 print:rounded-none">
        <style>{`
          @media print {
            @page { size: letter portrait; margin: 1cm; }
            html, body, #root { height: auto !important; overflow: visible !important; display: block !important; margin: 0; padding: 0; background: white; }
            * { overflow: visible !important; }
            aside, header { display: none !important; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .print-eficiencia-only { display: block !important; margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; }
            .no-print, [role="status"], [class*="toast"] { display: none !important; }
          }
        `}</style>

        {sinGenero.length > 0 && (
          <div className="no-print mb-6 bg-red-50 border-l-4 border-red-500 p-4 shadow-sm">
            <div className="flex items-center">
              <AlertCircle className="w-6 h-6 text-red-500 mr-3" />
              <h3 className="font-bold text-red-800 text-lg">Alerta: Alumnos sin género definido</h3>
            </div>
            <p className="mt-2 text-sm text-red-700">
              Hay {sinGenero.length} alumno(s) que no tienen su género correctamente especificado. 
            </p>
          </div>
        )}

        {/* Encabezado Oficial */}
        <div className="flex items-center justify-between mb-4 border-b-2 border-red-800 pb-2 print:mb-2 text-center">
          <img src="/logo-sep.png" alt="SEP" className="h-16 w-auto object-contain print:h-12" />
          <div className="flex-1 px-4">
            <h1 className="text-sm font-bold text-black uppercase print:text-[10px]">SECRETARIA DE EDUCACIÓN GUERRERO</h1>
            <h2 className="text-xs font-bold text-black uppercase print:text-[9px]">SUBSECRETARÍA DE EDUCACIÓN BÁSICA</h2>
            <h2 className="text-xs font-bold text-black uppercase print:text-[9px]">DIRECCIÓN GENERAL DE EDUCACIÓN SECUNDARIA</h2>
            <h3 className="text-sm font-bold text-black uppercase mt-1 print:text-[10px]">SEGUNDO MOMENTO DE VALORACIÓN DE LOS COLECTIVOS ESCOLARES.</h3>
            <h3 className="text-sm font-bold text-black uppercase mt-1 print:text-[10px]">CICLO ESCOLAR 2025-2026</h3>
          </div>
          <div className="w-16"></div> {/* Espaciador */}
        </div>
        
        {/* Datos de la Escuela */}
        <div className="text-xs print:text-[9px] mb-6 border border-black p-2">
          <div className="grid grid-cols-12 gap-2 mb-1">
            <div className="col-span-5 flex"><span className="font-bold mr-2">ESCUELA SECUNDARIA:</span> <span className="border-b border-black flex-1">EST 68 "RENACIMIENTO"</span></div>
            <div className="col-span-4 flex"><span className="font-bold mr-2">C.C.T.:</span> <span className="border-b border-black flex-1">12DST0068N</span></div>
            <div className="col-span-3 flex"><span className="font-bold mr-2">ZONA ESCOLAR:</span> <span className="border-b border-black flex-1">11</span></div>
          </div>
          <div className="grid grid-cols-12 gap-2 mb-1">
            <div className="col-span-5 flex"><span className="font-bold mr-2">LOCALIDAD:</span> <span className="border-b border-black flex-1">ACAPULCO DE JUÁREZ</span></div>
            <div className="col-span-4 flex"><span className="font-bold mr-2">MUNICIPIO:</span> <span className="border-b border-black flex-1">ACAPULCO</span></div>
            <div className="col-span-3 flex"><span className="font-bold mr-2">REGIÓN:</span> <span className="border-b border-black flex-1">ACAPULCO</span></div>
          </div>
          <div className="grid grid-cols-12 gap-2 mb-1">
            <div className="col-span-7 flex"><span className="font-bold mr-2">NOMBRE DEL DIRECTOR(A):</span> <span className="border-b border-black flex-1">Mtra. MA. GUADALUPE MARTÍNEZ DÍAZ</span></div>
            <div className="col-span-5 flex"><span className="font-bold mr-2">TEL DE LA ESC.:</span> <span className="border-b border-black flex-1">744 442 5580</span></div>
          </div>
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-4 flex"><span className="font-bold mr-2">TEL DEL DIRECTOR:</span> <span className="border-b border-black flex-1"></span></div>
            <div className="col-span-8 flex"><span className="font-bold mr-2">CORREO ELECTRÓNICO:</span> <span className="border-b border-black flex-1">est68renacimiento@gmail.com</span></div>
          </div>
        </div>

        {/* Título de la tabla */}
        <h4 className="text-center font-black text-sm mb-2 print:text-[11px] uppercase">EFICIENCIA TERMINAL</h4>

        {/* Tabla E4 */}
        <div className="w-full overflow-hidden border-2 border-black">
          <table className="w-full text-xs print:text-[9px] border-collapse">
            <thead>
              <tr className="bg-yellow-100 text-black border-b-2 border-black">
                <th rowSpan="2" className="border-r border-black p-2 w-24">TURNO</th>
                <th colSpan="3" className="border-r border-black p-2 font-bold uppercase">INSCRIPCIÓN INICIAL A PRIMERO 2023-2024</th>
                <th colSpan="3" className="border-r border-black p-2 font-bold uppercase">EGRESADOS CON CERTIFICADO 2025-2026</th>
                <th colSpan="3" className="border-r border-black p-2 font-bold uppercase text-[9px] leading-tight">EGRESADOS SIN CERTIFICADO 2025-2026<br/><span className="font-normal">(adeudan disciplinas)</span></th>
                <th colSpan="3" className="p-2 font-bold uppercase text-[9px] leading-tight">% DE EFICIENCIA TERMINAL<br/><span className="font-normal">(Egresados con Cert. X 100 / Insc. a 1° 2023-2024)</span></th>
              </tr>
              <tr className="bg-yellow-50 text-black border-b-2 border-black">
                {/* Inicial */}
                <th className="border-r border-black p-1 w-8">H</th>
                <th className="border-r border-black p-1 w-8">M</th>
                <th className="border-r border-black p-1 w-10 font-bold">TOTAL</th>
                {/* Certificado */}
                <th className="border-r border-black p-1 w-8">H</th>
                <th className="border-r border-black p-1 w-8">M</th>
                <th className="border-r border-black p-1 w-10 font-bold">TOTAL</th>
                {/* Sin Certificado */}
                <th className="border-r border-black p-1 w-8">H</th>
                <th className="border-r border-black p-1 w-8">M</th>
                <th className="border-r border-black p-1 w-10 font-bold">TOTAL</th>
                {/* Eficiencia */}
                <th className="border-r border-black p-1 w-10">H</th>
                <th className="border-r border-black p-1 w-10">M</th>
                <th className="p-1 w-12 font-bold">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {renderRow('MATUTINO', 'Matutino')}
              {renderRow('VESPERTINO', 'Vespertino')}
              {renderRow('TOTALES', 'TOTALES', true)}
            </tbody>
          </table>
        </div>

        {/* Footnote */}
        <p className="mt-3 text-[10px] print:text-[8px] font-bold text-black">
          (1) Para obtener la Eficiencia Terminal de esta generación, no considerar las altas en 2° (ciclo esc. 2024-2025) y 3° (ciclo esc. 2025-2026).
        </p>
        
        {/* Firmas */}
        <div className="mt-20 print:mt-16 w-full flex justify-center">
          <div className="w-64 text-center border-t border-black pt-2">
            <p className="text-xs print:text-[10px] font-bold">Mtra. MA. GUADALUPE MARTÍNEZ DÍAZ</p>
            <p className="text-xs print:text-[9px] mt-1">NOMBRE DEL DIRECTOR(A)</p>
            <p className="text-xs print:text-[9px] mt-1">FIRMA Y SELLO</p>
          </div>
        </div>

      </div>
    </div>
  );
}
