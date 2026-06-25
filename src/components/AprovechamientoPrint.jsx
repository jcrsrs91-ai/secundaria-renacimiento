import React, { useMemo } from 'react';

export default function AprovechamientoPrint({ activos, onClose }) {
  // Configuración de los campos formativos por grado
  const campos = {
    '1er Grado': [
      { name: 'LENGUAJES', span: 3, keys: ['espanol1', 'ingles1', 'artes1'], bg: 'bg-indigo-50 text-indigo-800 border-b-2 border-indigo-200' },
      { name: 'SABERES Y PENSAMIENTO', span: 2, keys: ['matematicas1', 'biologia'], bg: 'bg-emerald-50 text-emerald-800 border-b-2 border-emerald-200' },
      { name: 'ÉTICA, NAT. Y SOCIEDAD', span: 3, keys: ['geografia', 'historia1', 'fce1'], bg: 'bg-amber-50 text-amber-800 border-b-2 border-amber-200' },
      { name: 'DE LO HUMANO', span: 2, keys: ['tecnologia1', 'educfisica1'], bg: 'bg-cyan-50 text-cyan-800 border-b-2 border-cyan-200' }
    ],
    '2do Grado': [
      { name: 'LENGUAJES', span: 3, keys: ['espanol2', 'ingles2', 'artes2'], bg: 'bg-indigo-50 text-indigo-800 border-b-2 border-indigo-200' },
      { name: 'SABERES Y PENSAMIENTO', span: 2, keys: ['matematicas2', 'fisica'], bg: 'bg-emerald-50 text-emerald-800 border-b-2 border-emerald-200' },
      { name: 'ÉTICA, NAT. Y SOCIEDAD', span: 2, keys: ['historia2', 'fce2'], bg: 'bg-amber-50 text-amber-800 border-b-2 border-amber-200' },
      { name: 'DE LO HUMANO', span: 2, keys: ['tecnologia2', 'educfisica2'], bg: 'bg-cyan-50 text-cyan-800 border-b-2 border-cyan-200' }
    ],
    '3er Grado': [
      { name: 'LENGUAJES', span: 3, keys: ['espanol3', 'ingles3', 'artes3'], bg: 'bg-indigo-50 text-indigo-800 border-b-2 border-indigo-200' },
      { name: 'SABERES Y PENSAMIENTO', span: 2, keys: ['matematicas3', 'quimica'], bg: 'bg-emerald-50 text-emerald-800 border-b-2 border-emerald-200' },
      { name: 'ÉTICA, NAT. Y SOCIEDAD', span: 2, keys: ['historia3', 'fce3'], bg: 'bg-amber-50 text-amber-800 border-b-2 border-amber-200' },
      { name: 'DE LO HUMANO', span: 2, keys: ['tecnologia3', 'educfisica3'], bg: 'bg-cyan-50 text-cyan-800 border-b-2 border-cyan-200' }
    ]
  };

  const getMateriaLabel = (key) => {
    const labels = {
      espanol1: 'Español', ingles1: 'Inglés', artes1: 'Artes', matematicas1: 'Matemáticas', biologia: 'Biología', geografia: 'Geografía', historia1: 'Historia', fce1: 'F.C.E.', tecnologia1: 'Tecnología', educfisica1: 'Ed. Física',
      espanol2: 'Español', ingles2: 'Inglés', artes2: 'Artes', matematicas2: 'Matemáticas', fisica: 'Física', historia2: 'Historia', fce2: 'F.C.E.', tecnologia2: 'Tecnología', educfisica2: 'Ed. Física',
      espanol3: 'Español', ingles3: 'Inglés', artes3: 'Artes', matematicas3: 'Matemáticas', quimica: 'Química', historia3: 'Historia', fce3: 'F.C.E.', tecnologia3: 'Tecnología', educfisica3: 'Ed. Física'
    };
    return labels[key] || key;
  };

  const calcularPromedioFinalAlumno = (student, materiaId) => {
    const t1 = parseFloat(student.calificaciones?.['t1']?.[materiaId]);
    const t2 = parseFloat(student.calificaciones?.['t2']?.[materiaId]);
    const t3 = parseFloat(student.calificaciones?.['t3']?.[materiaId]);
    let sum = 0, c = 0;
    if (!isNaN(t1)) { sum += t1; c++; }
    if (!isNaN(t2)) { sum += t2; c++; }
    if (!isNaN(t3)) { sum += t3; c++; }
    return c > 0 ? (sum / c) : null;
  };

  const calcularPromedioGralAlumno = (student, gradoKeys) => {
    let sum = 0, c = 0;
    gradoKeys.forEach(key => {
      const p = calcularPromedioFinalAlumno(student, key);
      if (p !== null) { sum += p; c++; }
    });
    return c > 0 ? (sum / c) : null;
  };

  const reportData = useMemo(() => {
    const turnos = ['Matutino', 'Vespertino'];
    const grados = ['1er Grado', '2do Grado', '3er Grado'];
    
    // keys por grado
    const keysByGrado = {
      '1er Grado': campos['1er Grado'].flatMap(c => c.keys),
      '2do Grado': campos['2do Grado'].flatMap(c => c.keys),
      '3er Grado': campos['3er Grado'].flatMap(c => c.keys),
    };

    const data = { Matutino: {}, Vespertino: {}, Escuela: {} };

    // Calcular por turnos
    turnos.forEach(turno => {
      grados.forEach(grado => {
        const students = activos.filter(a => a.grado === grado && (a.turno || 'Matutino') === turno);
        keysByGrado[grado].forEach(key => {
          let sum = 0, count = 0;
          students.forEach(s => {
            const val = calcularPromedioFinalAlumno(s, key);
            if (val !== null) { sum += val; count++; }
          });
          data[turno][key] = count > 0 ? (sum / count) : null;
        });

        let pgSum = 0, pgCount = 0;
        students.forEach(s => {
          const val = calcularPromedioGralAlumno(s, keysByGrado[grado]);
          if (val !== null) { pgSum += val; pgCount++; }
        });
        data[turno][`pg_${grado}`] = pgCount > 0 ? (pgSum / pgCount) : null;
      });

      // Promedio general del turno
      let tSum = 0, tCount = 0;
      activos.filter(a => (a.turno || 'Matutino') === turno).forEach(s => {
        const val = calcularPromedioGralAlumno(s, keysByGrado[s.grado]);
        if (val !== null) { tSum += val; tCount++; }
      });
      data[turno].promedioGralTurno = tCount > 0 ? (tSum / tCount) : null;
    });

    // Promedios totales escuela
    grados.forEach(grado => {
      const students = activos.filter(a => a.grado === grado);
      keysByGrado[grado].forEach(key => {
        let sum = 0, count = 0;
        students.forEach(s => {
          const val = calcularPromedioFinalAlumno(s, key);
          if (val !== null) { sum += val; count++; }
        });
        data.Escuela[key] = count > 0 ? (sum / count) : null;
      });

      let pgSum = 0, pgCount = 0;
      students.forEach(s => {
        const val = calcularPromedioGralAlumno(s, keysByGrado[grado]);
        if (val !== null) { pgSum += val; pgCount++; }
      });
      data.Escuela[`pg_${grado}`] = pgCount > 0 ? (pgSum / pgCount) : null;
    });

    // Promedio general de toda la escuela
    let escSum = 0, escCount = 0;
    activos.forEach(s => {
      const val = calcularPromedioGralAlumno(s, keysByGrado[s.grado]);
      if (val !== null) { escSum += val; escCount++; }
    });
    data.Escuela.promedioGralEscuela = escCount > 0 ? (escSum / escCount) : null;

    return data;
  }, [activos]);

  const formatPromedio = (val) => val !== null ? val.toFixed(1) : '-';

  const renderTable = (grado, title) => {
    return (
      <div className="mb-10 print:mb-2 break-inside-avoid">
        <h3 className="text-xl font-bold text-slate-800 mb-4 border-b-2 border-indigo-200 pb-2 flex items-center print:text-sm print:mb-1 print:pb-0.5">
          <span className="bg-indigo-600 text-white w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm shadow-sm print:w-5 print:h-5 print:text-[9px] print:mr-1 print:bg-slate-200 print:text-black print:border print:border-black print:shadow-none">{grado[0]}º</span>
          PROMEDIOS DE {title}
        </h3>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-slate-400 print:rounded-none">
          <table className="min-w-full divide-y divide-slate-200 text-sm print:text-[9px]">
            <thead>
              <tr className="bg-slate-50 print:bg-slate-100">
                <th rowSpan="2" className="px-4 py-3 print:px-1 print:py-1 text-left font-bold text-slate-700 border-r border-slate-200 w-32 print:w-16 align-middle print:border-slate-400">TURNO</th>
                {campos[grado].map((c, i) => (
                  <th key={i} colSpan={c.span} className={`px-2 py-2 print:px-1 print:py-0.5 text-center text-xs print:text-[8px] font-bold border-r border-slate-200 ${c.bg} print:border-slate-400 print:bg-white print:text-black`}>
                    {c.name}
                  </th>
                ))}
                <th rowSpan="2" className="px-3 py-3 print:px-1 print:py-1 text-center font-black text-indigo-900 bg-indigo-50 border-l border-indigo-200 align-middle w-28 print:w-16 print:text-[9px] print:border-slate-400 print:bg-slate-200 print:text-black">
                  PROM. GRAL
                </th>
              </tr>
              <tr className="bg-white">
                {campos[grado].flatMap(c => c.keys).map((k, i) => (
                  <th key={k} className={`px-2 py-2 print:px-1 print:py-0.5 text-center text-xs print:text-[8px] font-semibold text-slate-600 border-r border-slate-200 border-t border-slate-200 bg-slate-50/50 print:border-slate-400 print:bg-white`}>
                    {getMateriaLabel(k)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white print:divide-slate-400">
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 print:px-1 print:py-0.5 font-semibold text-slate-700 border-r border-slate-200 print:border-slate-400">Matutino</td>
                {campos[grado].flatMap(c => c.keys).map(k => (
                  <td key={k} className="px-2 py-3 print:px-1 print:py-0.5 text-center text-slate-600 font-medium border-r border-slate-200 print:border-slate-400">{formatPromedio(reportData.Matutino[k])}</td>
                ))}
                <td className="px-3 py-3 print:px-1 print:py-0.5 text-center font-bold text-indigo-700 bg-indigo-50/50 border-l border-indigo-100 print:border-slate-400 print:bg-slate-100 print:text-black">{formatPromedio(reportData.Matutino[`pg_${grado}`])}</td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 print:px-1 print:py-0.5 font-semibold text-slate-700 border-r border-slate-200 print:border-slate-400">Vespertino</td>
                {campos[grado].flatMap(c => c.keys).map(k => (
                  <td key={k} className="px-2 py-3 print:px-1 print:py-0.5 text-center text-slate-600 font-medium border-r border-slate-200 print:border-slate-400">{formatPromedio(reportData.Vespertino[k])}</td>
                ))}
                <td className="px-3 py-3 print:px-1 print:py-0.5 text-center font-bold text-indigo-700 bg-indigo-50/50 border-l border-indigo-100 print:border-slate-400 print:bg-slate-100 print:text-black">{formatPromedio(reportData.Vespertino[`pg_${grado}`])}</td>
              </tr>
              <tr className="bg-slate-100 print:bg-slate-200">
                <td className="px-4 py-3 print:px-1 print:py-0.5 font-black text-slate-800 border-r border-slate-300 print:border-slate-400">TOTAL GRADO</td>
                {campos[grado].flatMap(c => c.keys).map(k => (
                  <td key={k} className="px-2 py-3 print:px-1 print:py-0.5 text-center text-slate-800 font-bold border-r border-slate-300 print:border-slate-400">{formatPromedio(reportData.Escuela[k])}</td>
                ))}
                <td className="px-3 py-3 print:px-1 print:py-0.5 text-center font-black text-indigo-900 bg-indigo-200 border-l border-indigo-300 border-t-2 border-t-indigo-300 print:border-slate-400 print:border-t-2 print:border-t-black print:text-black">{formatPromedio(reportData.Escuela[`pg_${grado}`])}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="print-aprovechamiento-only relative bg-slate-100 min-h-screen py-8 print:py-0 print:bg-white font-sans text-slate-800">
      
      {/* Botones Flotantes para la pantalla */}
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
            @page { size: landscape; margin: 0.5cm; }
            html, body, #root { height: auto !important; overflow: visible !important; display: block !important; margin: 0; padding: 0; background: white; }
            * { overflow: visible !important; }
            aside, header { display: none !important; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .print-aprovechamiento-only { display: block !important; margin: 0; padding: 0; }
          }
        `}</style>

        {/* Encabezado Elegante */}
        <div className="flex items-center justify-between mb-8 border-b-2 border-slate-200 pb-6 print:border-black print:pb-1 print:mb-2">
          <img src="/logo-sep.png" alt="SEP" className="h-16 w-auto object-contain print:h-8" />
          <div className="text-center flex-1 px-4">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase print:text-sm print:leading-tight">REPORTE GLOBAL DE APROVECHAMIENTO</h1>
            <h2 className="text-base font-bold text-slate-600 mt-1 uppercase print:text-[10px] print:mt-0 print:leading-tight">Escuela Secundaria Técnica N° 68 "Renacimiento"</h2>
            <p className="text-sm font-medium text-slate-500 mt-1 print:text-[9px] print:mt-0 print:leading-tight">Ciclo Escolar 2025-2026 • Evaluación hasta el 3er Periodo</p>
          </div>
          <img src="/logo-escuela.png" alt="Escuela" className="h-20 w-auto object-contain print:h-10" />
        </div>

        {/* Tarjetas de Promedios Generales Superiores */}
        <div className="grid grid-cols-3 gap-6 mb-10 print:gap-2 print:mb-3 break-inside-avoid">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl p-5 text-white shadow-md print:border-2 print:border-black print:bg-white print:text-black print:shadow-none print:from-white print:to-white print:p-2 print:flex print:items-center print:justify-between">
            <p className="text-sm font-semibold opacity-90 tracking-wide mb-1 print:mb-0 print:opacity-100 print:text-[10px]">PROMEDIO ESCUELA</p>
            <p className="text-5xl font-black print:text-xl">{formatPromedio(reportData.Escuela.promedioGralEscuela)}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-center print:border-2 print:border-black print:shadow-none print:p-2 print:flex-row print:items-center print:justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 print:mb-0 print:text-black print:text-[10px]">Turno Matutino</p>
            <p className="text-3xl font-black text-slate-800 print:text-xl print:text-black">{formatPromedio(reportData.Matutino.promedioGralTurno)}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-center print:border-2 print:border-black print:shadow-none print:p-2 print:flex-row print:items-center print:justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 print:mb-0 print:text-black print:text-[10px]">Turno Vespertino</p>
            <p className="text-3xl font-black text-slate-800 print:text-xl print:text-black">{formatPromedio(reportData.Vespertino.promedioGralTurno)}</p>
          </div>
        </div>

        {/* Tablas Separadas por Grado */}
        {renderTable('1er Grado', 'PRIMER GRADO')}
        {renderTable('2do Grado', 'SEGUNDO GRADO')}
        {renderTable('3er Grado', 'TERCER GRADO')}

        {/* Pie de Firma */}
        <div className="mt-16 pt-8 flex justify-center break-inside-avoid print:mt-4 print:pt-2">
          <div className="text-center w-80 print:w-64">
            <div className="border-t-2 border-slate-800 pt-2 font-bold text-slate-800 text-sm print:border-black print:text-[10px] print:pt-1">PROFR. JUAN CARLOS TABOADA BARAJAS</div>
            <div className="mt-1 text-slate-500 text-xs font-semibold tracking-wide print:text-black print:text-[8px] print:mt-0">DIRECTOR DE LA ESCUELA</div>
          </div>
        </div>

      </div>
    </div>
  );
}
