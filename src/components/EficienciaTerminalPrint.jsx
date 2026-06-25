import React, { useMemo } from 'react';
import { AlertCircle, Printer, X } from 'lucide-react';
import { truncateTo1Dec } from '../utils/format';

export default function EficienciaTerminalPrint({ activos = [], bajas = [], materiasPorGrado = {}, onClose }) {
  
  // Calculadora de materias reprobadas por alumno
  const getMateriasReprobadas = (student, materias, missingGradesArr, menor5Arr) => {
    let reprobadas = 0;
    let missing = false;
    let hasMenor5 = false;
    const c = student.calificaciones || {};
    materias.forEach(mat => {
      let sum = 0;
      let count = 0;
      ['t1', 't2', 't3'].forEach(t => {
        const val = parseFloat(c[t]?.[mat.id]);
        if (!isNaN(val)) { 
          sum += val; 
          count++;
          if (val < 5.0) {
            hasMenor5 = true;
          }
        }
      });
      const avg = count > 0 ? parseFloat(truncateTo1Dec(sum / count)) : 0;
      if (count === 0 || avg < 6.0) {
        reprobadas++;
      }
      if (count === 0) {
        missing = true;
      }
    });
    
    if (missing && missingGradesArr && !missingGradesArr.find(s => s.id === student.id)) {
      missingGradesArr.push(student);
    }
    
    if (hasMenor5 && menor5Arr && !menor5Arr.find(s => s.id === student.id)) {
      menor5Arr.push(student);
    }
    
    return reprobadas;
  };

  const processData = () => {
    const data = {
      Matutino: { insH: 0, insM: 0, insT: 0, egCertH: 0, egCertM: 0, egCertT: 0, egSinCertH: 0, egSinCertM: 0, egSinCertT: 0 },
      Vespertino: { insH: 0, insM: 0, insT: 0, egCertH: 0, egCertM: 0, egCertT: 0, egSinCertH: 0, egSinCertM: 0, egSinCertT: 0 },
      TOTALES: { insH: 0, insM: 0, insT: 0, egCertH: 0, egCertM: 0, egCertT: 0, egSinCertH: 0, egSinCertM: 0, egSinCertT: 0 }
    };
    
    const sinGenero = [];
    const sinCalificaciones = [];
    const califMenor5 = [];
    const alumnosContabilizados = [];
    const alumnosOmitidos = [];

    // Juntamos activos y bajas, buscando cualquier variante de 3er Grado (espacios, minúsculas, etc.)
    const allTercero = [...activos, ...bajas].filter(s => {
      const g = (s.grado || '').toString().trim().toLowerCase();
      return g.startsWith('3') || g === 'tercero';
    });
    
    const materiasTercero = materiasPorGrado['3er Grado'] || [];

    allTercero.forEach(s => {
      // Ignorar los que ingresaron por Alta (en 2do o 3ro) según regla E4
      if (s.tipoIngreso && s.tipoIngreso.trim().toLowerCase() === 'alta') {
        alumnosOmitidos.push({ ...s, motivo: 'Regla SEP E4: Ingresó por Alta' });
        return;
      }

      // Limpiar turno
      let turnoBruto = (s.turno || 'Matutino').toString().trim().toLowerCase();
      let turno = turnoBruto.startsWith('v') ? 'Vespertino' : 'Matutino';
      
      if (!data[turno]) {
        alumnosOmitidos.push({ ...s, motivo: `Turno inválido: ${s.turno}` });
        return;
      }

      const gen = s.genero?.trim().toLowerCase() || '';
      const isHombre = gen.startsWith('h') || gen === 'masculino';
      const isMujer = gen.startsWith('m') || gen === 'femenino';
      
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
        alumnosContabilizados.push(s);
        const reprobadas = getMateriasReprobadas(s, materiasTercero, sinCalificaciones, califMenor5);
        
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

    // Sobrescribir datos de inscripción inicial con los de la captura (solo por esta vez para la generación 23-26)
    data.Matutino.insH = 98;
    data.Matutino.insM = 91;
    data.Matutino.insT = 189;
    
    data.Vespertino.insH = 0;
    data.Vespertino.insM = 0;
    data.Vespertino.insT = 0;

    data.TOTALES.insH = data.Matutino.insH + data.Vespertino.insH;
    data.TOTALES.insM = data.Matutino.insM + data.Vespertino.insM;
    data.TOTALES.insT = data.Matutino.insT + data.Vespertino.insT;

    return { data, sinGenero, sinCalificaciones, califMenor5, alumnosContabilizados, alumnosOmitidos };
  };

  const { data, sinGenero, sinCalificaciones, califMenor5, alumnosContabilizados, alumnosOmitidos } = useMemo(processData, [activos, bajas, materiasPorGrado]);

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
    <div className="print-eficiencia-only relative bg-slate-100 min-h-screen py-8 print:py-0 print:bg-white font-sans text-slate-800">
      
      {/* Controles de Impresión */}
      <div className="flex justify-center mb-8 gap-4 print:hidden no-print">
        <button onClick={() => window.print()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg transition-colors flex items-center">
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
          Imprimir Reporte
        </button>
        {onClose && (
          <button onClick={onClose} className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg transition-colors flex items-center">
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            Cerrar Vista Previa
          </button>
        )}
      </div>

      <div className="bg-white max-w-6xl mx-auto p-10 rounded-2xl shadow-xl print:shadow-none print:p-0 print:rounded-none">
        
        <style>{`
          @media print {
            @page { size: landscape; margin: 1cm; }
            html, body, #root { height: auto !important; overflow: visible !important; display: block !important; margin: 0; padding: 0; background: white; }
            * { overflow: visible !important; }
            aside, header { display: none !important; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .print-eficiencia-only { display: block !important; margin: 0; padding: 0; }
            .no-print { display: none !important; }
          }
        `}</style>

        {sinGenero.length > 0 && (
          <div className="no-print mb-4 bg-red-50 border-l-4 border-red-500 p-4 shadow-sm">
            <div className="flex items-center">
              <AlertCircle className="w-6 h-6 text-red-500 mr-3" />
              <h3 className="font-bold text-red-800 text-lg">Alerta: Alumnos sin género definido</h3>
            </div>
            <p className="mt-2 text-sm text-red-700">
              Hay {sinGenero.length} alumno(s) que no tienen su género correctamente especificado. 
            </p>
          </div>
        )}

        {sinCalificaciones.length > 0 && (
          <div className="no-print mb-4 bg-amber-50 border-l-4 border-amber-500 p-4 shadow-sm">
            <div className="flex items-center">
              <AlertCircle className="w-6 h-6 text-amber-500 mr-3" />
              <h3 className="font-bold text-amber-800 text-lg">Aviso: Alumnos con materias sin calificar</h3>
            </div>
            <p className="mt-2 text-sm text-amber-700">
              Hay {sinCalificaciones.length} alumno(s) activos de 3er Grado que tienen <strong>al menos una materia totalmente en blanco (sin calificaciones)</strong>. Estos alumnos son contabilizados automáticamente en la columna de "Egresados sin certificado" (adeudan disciplinas).
            </p>
            <div className="mt-3 max-h-32 overflow-y-auto">
              <ul className="list-disc pl-5 text-xs text-amber-900 space-y-1">
                {sinCalificaciones.map(s => (
                  <li key={s.id}>
                    <span className="font-bold">{s.nombre} {s.apellidos}</span> - {s.grado} {s.grupo} ({s.turno})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {califMenor5.length > 0 && (
          <div className="no-print mb-6 bg-red-50 border-l-4 border-red-600 p-4 shadow-sm">
            <div className="flex items-center">
              <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
              <h3 className="font-bold text-red-800 text-lg">Alerta Crítica: Calificaciones menores a 5.0</h3>
            </div>
            <p className="mt-2 text-sm text-red-700">
              Se detectaron {califMenor5.length} alumno(s) con calificaciones capturadas <strong>menores a 5.0</strong>. La SEP no permite calificaciones menores a 5.0 en secundaria; por favor verifica si hubo un error de dedo al capturar.
            </p>
            <div className="mt-3 max-h-32 overflow-y-auto">
              <ul className="list-disc pl-5 text-xs text-red-900 space-y-1">
                {califMenor5.map(s => (
                  <li key={s.id}>
                    <span className="font-bold">{s.nombre} {s.apellidos}</span> - {s.grado} {s.grupo} ({s.turno})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Encabezado */}
        <div className="flex items-center justify-between mb-8 border-b-2 border-slate-200 pb-6 print:border-black print:pb-1 print:mb-2">
          <img src="/logo-sep.png" alt="SEP" className="h-16 w-auto object-contain print:h-8" />
          <div className="text-center flex-1 px-4">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase print:text-sm print:leading-tight">ESTADÍSTICA DE EFICIENCIA TERMINAL (E4)</h1>
            <h2 className="text-base font-bold text-slate-600 mt-1 uppercase print:text-[10px] print:mt-0 print:leading-tight">Escuela Secundaria Técnica N° 68 "Renacimiento"</h2>
            <p className="text-sm font-medium text-slate-500 mt-1 print:text-[9px] print:mt-0 print:leading-tight">Segundo Momento de Valoración • Ciclo Escolar 2025-2026</p>
          </div>
          <img src="/logo-escuela.png" alt="Escuela" className="h-20 w-auto object-contain print:h-10" />
        </div>

        {/* Dashboard de Resumen */}
        <div className="grid grid-cols-4 gap-4 mb-8 print:gap-2 print:mb-3 break-inside-avoid">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl p-4 text-white shadow-md print:border-2 print:border-black print:bg-white print:text-black print:shadow-none print:from-white print:to-white print:p-2 print:flex print:items-center print:justify-between">
            <div className="flex items-center mb-1 print:mb-0">
              <p className="text-xs font-bold opacity-90 uppercase tracking-wide print:opacity-100 print:text-[10px]">Inscripción Inicial</p>
            </div>
            <p className="text-3xl font-black print:text-lg">{data.TOTALES.insT}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 shadow-sm flex flex-col justify-center print:border-2 print:border-black print:shadow-none print:p-2 print:flex-row print:items-center print:justify-between">
             <div className="flex items-center mb-1 print:mb-0 text-emerald-700 print:text-black">
              <p className="text-xs font-bold uppercase tracking-wide print:text-[10px]">Con Certificado</p>
            </div>
            <p className="text-2xl font-black text-emerald-800 print:text-lg print:text-black">{data.TOTALES.egCertT}</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 shadow-sm flex flex-col justify-center print:border-2 print:border-black print:shadow-none print:p-2 print:flex-row print:items-center print:justify-between">
             <div className="flex items-center mb-1 print:mb-0 text-orange-600 print:text-black">
              <p className="text-xs font-bold uppercase tracking-wide print:text-[10px]">Adeudan Materias</p>
            </div>
            <p className="text-2xl font-black text-orange-700 print:text-lg print:text-black">{data.TOTALES.egSinCertT}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm flex flex-col justify-center print:border-2 print:border-black print:bg-white print:shadow-none print:p-2 print:flex-row print:items-center print:justify-between">
             <div className="flex items-center mb-1 print:mb-0 text-blue-700 print:text-black">
              <p className="text-xs font-bold uppercase tracking-wide print:text-[10px]">% Eficiencia Global</p>
            </div>
            <p className="text-2xl font-black text-blue-800 print:text-lg print:text-black">{calcEficiencia(data.TOTALES.egCertT, data.TOTALES.insT)}</p>
          </div>
        </div>

        {/* Tabla Desglosada */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-slate-400 print:rounded-none">
          <table className="min-w-full divide-y divide-slate-200 text-sm print:text-[9px]">
            <thead>
              <tr className="bg-slate-100 print:bg-slate-100 border-b-2 border-slate-300 print:border-black">
                <th rowSpan="2" className="px-3 py-2 text-center font-bold text-slate-700 border-r border-slate-200 print:border-slate-400 align-middle w-24">TURNO</th>
                
                <th colSpan="3" className="px-2 py-2 text-center font-bold text-slate-800 bg-slate-200 border-r border-slate-300 print:bg-transparent print:text-black print:border-slate-400">
                  INSCRIPCIÓN INICIAL A PRIMERO 2023-2024
                </th>
                <th colSpan="3" className="px-2 py-2 text-center font-bold text-emerald-900 bg-emerald-100 border-r border-slate-300 print:bg-transparent print:text-black print:border-slate-400">
                  EGRESADOS CON CERTIFICADO
                </th>
                <th colSpan="3" className="px-2 py-2 text-center font-bold text-orange-900 bg-orange-100 border-r border-slate-300 print:bg-transparent print:text-black print:border-slate-400 leading-tight">
                  EGRESADOS SIN CERTIFICADO<br/><span className="text-[10px] print:text-[8px] font-normal">(adeudan disciplinas)</span>
                </th>
                <th colSpan="3" className="px-2 py-2 text-center font-bold text-blue-900 bg-blue-100 border-r border-slate-300 print:bg-transparent print:text-black print:border-slate-400 leading-tight">
                  % EFICIENCIA TERMINAL
                </th>
              </tr>
              <tr className="bg-slate-50 print:bg-slate-50">
                {/* Inicial */}
                <th className="px-1 py-1 text-center font-semibold text-slate-600 border-r border-slate-200 border-t border-slate-200 print:border-slate-400">H</th>
                <th className="px-1 py-1 text-center font-semibold text-slate-600 border-r border-slate-200 border-t border-slate-200 print:border-slate-400">M</th>
                <th className="px-1 py-1 text-center font-bold text-slate-800 border-r border-slate-300 border-t border-slate-300 print:border-slate-400 bg-slate-200/50 print:bg-transparent">TOTAL</th>
                {/* Con Certificado */}
                <th className="px-1 py-1 text-center font-semibold text-emerald-700 border-r border-slate-200 border-t border-slate-200 print:border-slate-400 print:text-black">H</th>
                <th className="px-1 py-1 text-center font-semibold text-emerald-700 border-r border-slate-200 border-t border-slate-200 print:border-slate-400 print:text-black">M</th>
                <th className="px-1 py-1 text-center font-bold text-emerald-900 border-r border-slate-300 border-t border-slate-300 print:border-slate-400 bg-emerald-50 print:bg-transparent print:text-black">TOTAL</th>
                {/* Sin Certificado */}
                <th className="px-1 py-1 text-center font-semibold text-orange-700 border-r border-slate-200 border-t border-slate-200 print:border-slate-400 print:text-black">H</th>
                <th className="px-1 py-1 text-center font-semibold text-orange-700 border-r border-slate-200 border-t border-slate-200 print:border-slate-400 print:text-black">M</th>
                <th className="px-1 py-1 text-center font-bold text-orange-900 border-r border-slate-300 border-t border-slate-300 print:border-slate-400 bg-orange-50 print:bg-transparent print:text-black">TOTAL</th>
                {/* Eficiencia */}
                <th className="px-1 py-1 text-center font-semibold text-blue-700 border-r border-slate-200 border-t border-slate-200 print:border-slate-400 print:text-black">H</th>
                <th className="px-1 py-1 text-center font-semibold text-blue-700 border-r border-slate-200 border-t border-slate-200 print:border-slate-400 print:text-black">M</th>
                <th className="px-1 py-1 text-center font-bold text-blue-900 border-r border-slate-300 border-t border-slate-300 print:border-slate-400 bg-blue-50 print:bg-transparent print:text-black">TOTAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white print:divide-slate-400">
              
              {(() => {
                const rowM = data.Matutino;
                return (
                  <tr className="hover:bg-slate-50 transition-colors text-slate-600 font-medium print:text-black">
                    <td className="px-3 py-2 border-r border-slate-200 print:border-slate-400 font-bold text-slate-800">MATUTINO</td>
                    {/* Inicial */}
                    <td className="px-2 py-2 text-center border-r border-slate-200 print:border-slate-400 print:px-1">{rowM.insH || '-'}</td>
                    <td className="px-2 py-2 text-center border-r border-slate-200 print:border-slate-400 print:px-1">{rowM.insM || '-'}</td>
                    <td className="px-2 py-2 text-center font-bold bg-slate-50 border-r border-slate-300 print:bg-transparent print:border-slate-400 print:px-1">{rowM.insT || '-'}</td>
                    {/* Con Certificado */}
                    <td className="px-2 py-2 text-center border-r border-slate-200 print:border-slate-400 print:px-1 text-emerald-600 print:text-black">{rowM.egCertH || '-'}</td>
                    <td className="px-2 py-2 text-center border-r border-slate-200 print:border-slate-400 print:px-1 text-emerald-600 print:text-black">{rowM.egCertM || '-'}</td>
                    <td className="px-2 py-2 text-center font-bold bg-emerald-50 border-r border-slate-300 print:bg-transparent print:border-slate-400 print:px-1 text-emerald-700 print:text-black">{rowM.egCertT || '-'}</td>
                    {/* Sin Certificado */}
                    <td className="px-2 py-2 text-center border-r border-slate-200 print:border-slate-400 print:px-1 text-orange-600 print:text-black">{rowM.egSinCertH || '-'}</td>
                    <td className="px-2 py-2 text-center border-r border-slate-200 print:border-slate-400 print:px-1 text-orange-600 print:text-black">{rowM.egSinCertM || '-'}</td>
                    <td className="px-2 py-2 text-center font-bold bg-orange-50 border-r border-slate-300 print:bg-transparent print:border-slate-400 print:px-1 text-orange-700 print:text-black">{rowM.egSinCertT || '-'}</td>
                    {/* Eficiencia */}
                    <td className="px-2 py-2 text-center border-r border-slate-200 print:border-slate-400 print:px-1 text-blue-600 print:text-black">{calcEficiencia(rowM.egCertH, rowM.insH)}</td>
                    <td className="px-2 py-2 text-center border-r border-slate-200 print:border-slate-400 print:px-1 text-blue-600 print:text-black">{calcEficiencia(rowM.egCertM, rowM.insM)}</td>
                    <td className="px-2 py-2 text-center font-bold bg-blue-50 border-slate-300 print:bg-transparent print:border-slate-400 print:px-1 text-blue-800 print:text-black">{calcEficiencia(rowM.egCertT, rowM.insT)}</td>
                  </tr>
                );
              })()}

              {(() => {
                const rowV = data.Vespertino;
                return (
                  <tr className="hover:bg-slate-50 transition-colors text-slate-600 font-medium print:text-black">
                    <td className="px-3 py-2 border-r border-slate-200 print:border-slate-400 font-bold text-slate-800">VESPERTINO</td>
                    {/* Inicial */}
                    <td className="px-2 py-2 text-center border-r border-slate-200 print:border-slate-400 print:px-1">{rowV.insH || '-'}</td>
                    <td className="px-2 py-2 text-center border-r border-slate-200 print:border-slate-400 print:px-1">{rowV.insM || '-'}</td>
                    <td className="px-2 py-2 text-center font-bold bg-slate-50 border-r border-slate-300 print:bg-transparent print:border-slate-400 print:px-1">{rowV.insT || '-'}</td>
                    {/* Con Certificado */}
                    <td className="px-2 py-2 text-center border-r border-slate-200 print:border-slate-400 print:px-1 text-emerald-600 print:text-black">{rowV.egCertH || '-'}</td>
                    <td className="px-2 py-2 text-center border-r border-slate-200 print:border-slate-400 print:px-1 text-emerald-600 print:text-black">{rowV.egCertM || '-'}</td>
                    <td className="px-2 py-2 text-center font-bold bg-emerald-50 border-r border-slate-300 print:bg-transparent print:border-slate-400 print:px-1 text-emerald-700 print:text-black">{rowV.egCertT || '-'}</td>
                    {/* Sin Certificado */}
                    <td className="px-2 py-2 text-center border-r border-slate-200 print:border-slate-400 print:px-1 text-orange-600 print:text-black">{rowV.egSinCertH || '-'}</td>
                    <td className="px-2 py-2 text-center border-r border-slate-200 print:border-slate-400 print:px-1 text-orange-600 print:text-black">{rowV.egSinCertM || '-'}</td>
                    <td className="px-2 py-2 text-center font-bold bg-orange-50 border-r border-slate-300 print:bg-transparent print:border-slate-400 print:px-1 text-orange-700 print:text-black">{rowV.egSinCertT || '-'}</td>
                    {/* Eficiencia */}
                    <td className="px-2 py-2 text-center border-r border-slate-200 print:border-slate-400 print:px-1 text-blue-600 print:text-black">{calcEficiencia(rowV.egCertH, rowV.insH)}</td>
                    <td className="px-2 py-2 text-center border-r border-slate-200 print:border-slate-400 print:px-1 text-blue-600 print:text-black">{calcEficiencia(rowV.egCertM, rowV.insM)}</td>
                    <td className="px-2 py-2 text-center font-bold bg-blue-50 border-slate-300 print:bg-transparent print:border-slate-400 print:px-1 text-blue-800 print:text-black">{calcEficiencia(rowV.egCertT, rowV.insT)}</td>
                  </tr>
                );
              })()}

              {(() => {
                const rowT = data.TOTALES;
                return (
                  <tr className="bg-slate-100 font-bold text-slate-800 border-t-2 border-slate-300 print:bg-slate-200 print:text-black print:border-black">
                    <td className="px-3 py-2 border-r border-slate-300 print:border-slate-400 font-black">TOTALES</td>
                    {/* Inicial */}
                    <td className="px-2 py-2 text-center border-r border-slate-300 print:border-slate-400 print:px-1">{rowT.insH || '-'}</td>
                    <td className="px-2 py-2 text-center border-r border-slate-300 print:border-slate-400 print:px-1">{rowT.insM || '-'}</td>
                    <td className="px-2 py-2 text-center font-black bg-slate-200 border-r border-slate-400 print:bg-transparent print:border-slate-400 print:px-1">{rowT.insT || '-'}</td>
                    {/* Con Certificado */}
                    <td className="px-2 py-2 text-center border-r border-slate-300 print:border-slate-400 print:px-1">{rowT.egCertH || '-'}</td>
                    <td className="px-2 py-2 text-center border-r border-slate-300 print:border-slate-400 print:px-1">{rowT.egCertM || '-'}</td>
                    <td className="px-2 py-2 text-center font-black bg-emerald-100 border-r border-slate-400 print:bg-transparent print:border-slate-400 print:px-1 text-emerald-900 print:text-black">{rowT.egCertT || '-'}</td>
                    {/* Sin Certificado */}
                    <td className="px-2 py-2 text-center border-r border-slate-300 print:border-slate-400 print:px-1">{rowT.egSinCertH || '-'}</td>
                    <td className="px-2 py-2 text-center border-r border-slate-300 print:border-slate-400 print:px-1">{rowT.egSinCertM || '-'}</td>
                    <td className="px-2 py-2 text-center font-black bg-orange-100 border-r border-slate-400 print:bg-transparent print:border-slate-400 print:px-1 text-orange-900 print:text-black">{rowT.egSinCertT || '-'}</td>
                    {/* Eficiencia */}
                    <td className="px-2 py-2 text-center border-r border-slate-300 print:border-slate-400 print:px-1">{calcEficiencia(rowT.egCertH, rowT.insH)}</td>
                    <td className="px-2 py-2 text-center border-r border-slate-300 print:border-slate-400 print:px-1">{calcEficiencia(rowT.egCertM, rowT.insM)}</td>
                    <td className="px-2 py-2 text-center font-black bg-blue-200 border-slate-400 print:bg-transparent print:border-slate-400 print:px-1 text-blue-900 print:text-black">{calcEficiencia(rowT.egCertT, rowT.insT)}</td>
                  </tr>
                );
              })()}

            </tbody>
          </table>
        </div>

        {/* Footnote */}
        <p className="mt-4 text-xs print:text-[9px] font-medium text-slate-500 print:text-black">
          (1) Para obtener la Eficiencia Terminal de esta generación, no considerar las altas en 2° (ciclo esc. 2024-2025) y 3° (ciclo esc. 2025-2026).
        </p>
        {/* Debug: Lista de alumnos contabilizados */}
        <div className="no-print mt-12 bg-slate-50 border border-slate-300 rounded-xl p-6">
          <h3 className="font-bold text-slate-800 text-lg mb-2">
            📊 Auditoría Interna: Alumnos contabilizados en "Egresados" ({alumnosContabilizados.length})
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            Total de egresados mostrados en la tabla: {data.TOTALES.egCertT + data.TOTALES.egSinCertT}. 
            Si este número no cuadra con tu Existencia actual, revisa si falta alguien en la siguiente lista. Los alumnos dados de 'Baja' o que tengan algún error en su Grado/Turno/Estatus no aparecen aquí.
          </p>
          <div className="max-h-64 overflow-y-auto bg-white border border-slate-200 rounded p-4 mb-6">
            <ul className="list-disc pl-5 text-xs text-slate-700 space-y-1">
              {alumnosContabilizados.sort((a,b) => a.apellidos?.localeCompare(b.apellidos)).map(s => (
                <li key={s.id}>
                  <span className="font-bold">{s.apellidos} {s.nombre}</span> - {s.grado} {s.grupo} ({s.turno}) - {s.status} - Género: {s.genero || 'N/A'}
                </li>
              ))}
            </ul>
          </div>

          {alumnosOmitidos.length > 0 && (
            <>
              <h3 className="font-bold text-rose-800 text-lg mb-2 border-t pt-4">
                ⚠️ Alumnos de 3er Grado que fueron IGNORADOS ({alumnosOmitidos.length})
              </h3>
              <p className="text-sm text-rose-600 mb-4">
                El sistema encontró a estos alumnos en la base de datos de 3er Grado, pero NO los sumó al reporte por las siguientes razones:
              </p>
              <div className="max-h-64 overflow-y-auto bg-rose-50 border border-rose-200 rounded p-4">
                <ul className="list-disc pl-5 text-xs text-rose-900 space-y-1">
                  {alumnosOmitidos.sort((a,b) => a.apellidos?.localeCompare(b.apellidos)).map(s => (
                    <li key={s.id}>
                      <span className="font-bold">{s.apellidos} {s.nombre}</span> - {s.grado} {s.grupo} ({s.turno}) <br/>
                      <span className="text-rose-600 bg-rose-100 px-1 rounded ml-2">Motivo: {s.motivo}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
