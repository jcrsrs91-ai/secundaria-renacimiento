import React, { useMemo } from 'react';

export default function AprovechamientoPrint({ activos, onClose }) {
  // Configuración de los campos formativos por grado
  const campos = {
    '1er Grado': [
      { name: 'LENGUAJES', span: 3, keys: ['espanol1', 'ingles1', 'artes1'], bg: 'bg-[#f4c7f0]' },
      { name: 'SABERES Y PENSAMIENTO CIENTÍFICO', span: 2, keys: ['matematicas1', 'biologia'], bg: 'bg-[#b6e5b4]' },
      { name: 'ÉTICA, NATURALEZA Y SOCIEDAD', span: 3, keys: ['geografia', 'historia1', 'fce1'], bg: 'bg-[#eec3b0]' },
      { name: 'DE LO HUMANO Y LO COMUNITARIO', span: 2, keys: ['tecnologia1', 'educfisica1'], bg: 'bg-[#6ee6f2]' }
    ],
    '2do Grado': [
      { name: 'LENGUAJES', span: 3, keys: ['espanol2', 'ingles2', 'artes2'], bg: 'bg-[#f4c7f0]' },
      { name: 'SABERES Y PENSAMIENTO CIENTÍFICO', span: 2, keys: ['matematicas2', 'fisica'], bg: 'bg-[#b6e5b4]' },
      { name: 'ÉTICA, NATURALEZA Y SOCIEDAD', span: 2, keys: ['historia2', 'fce2'], bg: 'bg-[#eec3b0]' },
      { name: 'DE LO HUMANO Y LO COMUNITARIO', span: 2, keys: ['tecnologia2', 'educfisica2'], bg: 'bg-[#6ee6f2]' }
    ],
    '3er Grado': [
      { name: 'LENGUAJES', span: 3, keys: ['espanol3', 'ingles3', 'artes3'], bg: 'bg-[#f4c7f0]' },
      { name: 'SABERES Y PENSAMIENTO CIENTÍFICO', span: 2, keys: ['matematicas3', 'quimica'], bg: 'bg-[#b6e5b4]' },
      { name: 'ÉTICA, NATURALEZA Y SOCIEDAD', span: 2, keys: ['historia3', 'fce3'], bg: 'bg-[#eec3b0]' },
      { name: 'DE LO HUMANO Y LO COMUNITARIO', span: 2, keys: ['tecnologia3', 'educfisica3'], bg: 'bg-[#6ee6f2]' }
    ]
  };

  const getMateriaLabel = (key) => {
    const labels = {
      espanol1: 'ESPAÑOL', ingles1: 'INGLÉS', artes1: 'ARTES', matematicas1: 'MATEMÁTICAS', biologia: 'BIOLOGÍA', geografia: 'GEOGRAFÍA', historia1: 'HISTORIA', fce1: 'FORMACIÓN CÍVICA Y ÉTICA', tecnologia1: 'TECNOLOGÍA', educfisica1: 'EDUCACIÓN FÍSICA',
      espanol2: 'ESPAÑOL', ingles2: 'INGLÉS', artes2: 'ARTES', matematicas2: 'MATEMÁTICAS', fisica: 'FÍSICA', historia2: 'HISTORIA', fce2: 'FORMACIÓN CÍVICA Y ÉTICA', tecnologia2: 'TECNOLOGÍA', educfisica2: 'EDUCACIÓN FÍSICA',
      espanol3: 'ESPAÑOL', ingles3: 'INGLÉS', artes3: 'ARTES', matematicas3: 'MATEMÁTICAS', quimica: 'QUÍMICA', historia3: 'HISTORIA', fce3: 'FORMACIÓN CÍVICA Y ÉTICA', tecnologia3: 'TECNOLOGÍA', educfisica3: 'EDUCACIÓN FÍSICA'
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

    // Promedios escuela
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

  const formatPromedio = (val) => val !== null ? val.toFixed(1) : '#¡DIV/0!';

  return (
    <div className="print-aprovechamiento-only relative bg-slate-100 min-h-screen py-8 print:py-0 print:bg-white">
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

      <div className="bg-white max-w-full mx-auto p-4 shadow-xl print:shadow-none print:p-0">
      <style>{`
        @media print {
          @page { size: landscape; margin: 0.5cm; }
          html, body, #root { height: auto !important; overflow: visible !important; display: block !important; margin: 0; padding: 0; }
          * { overflow: visible !important; }
          aside, header { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; margin: 0; }
          .print-aprovechamiento-only { display: block !important; margin: 0; padding: 0; font-family: 'Arial', sans-serif; }
          table { border-collapse: collapse; width: 100%; border: 2px solid black; }
          th, td { border: 1px solid black; padding: 2px; text-align: center; }
          .vertical-text { writing-mode: vertical-rl; transform: rotate(180deg); }
        }
        @media screen {
          .print-aprovechamiento-only { display: none !important; }
        }
      `}</style>

      <div className="w-full text-[9px] font-bold">
        <table className="mb-4">
          <tbody>
            <tr>
              <td colSpan="4" className="text-left border-none pb-2 text-[10px]">NOMBRE DEL DIRECTOR(A)</td>
              <td colSpan="10" className="text-left border-none pb-2 border-b border-black"></td>
            </tr>
            <tr>
              <td colSpan="2" className="text-left border-none pb-2 text-[10px]">TEL. DEL DIRECTOR</td>
              <td colSpan="8" className="text-left border-none pb-2 border-b border-black"></td>
              <td colSpan="3" className="text-left border-none pb-2 text-[10px]">CORREO ELECTRÓNICO:</td>
              <td colSpan="8" className="text-left border-none pb-2 border-b border-black"></td>
            </tr>
          </tbody>
        </table>

        <table>
          <thead>
            <tr>
              <th colSpan="32" className="text-center font-black text-[12px] py-1 border-2 border-black">APROVECHAMIENTO (PROMEDIOS)</th>
            </tr>
            <tr>
              <th rowSpan="4" className="bg-[#ffff99] text-center w-20 border-2 border-black">TURNO</th>
              <th colSpan="31" className="text-center font-black py-1">CAMPOS FORMATIVOS</th>
            </tr>
            <tr>
              <th colSpan="11" className="bg-[#ffff99] text-center font-black py-1 border-r-2 border-black border-l-2">PRIMER GRADO</th>
              <th colSpan="10" className="bg-[#ffff99] text-center font-black py-1 border-r-2 border-black">SEGUNDO GRADO</th>
              <th colSpan="10" className="bg-[#ffff99] text-center font-black py-1 border-r-2 border-black">TERCER GRADO</th>
            </tr>
            
            <tr className="text-[7px]">
              {/* 1er Grado Campos */}
              {campos['1er Grado'].map((c, i) => (
                <th key={`c1-${i}`} colSpan={c.span} className={`${c.bg} vertical-text h-32 align-middle border border-black border-t-2 border-b-2 ${i===0?'border-l-2':''}`}>{c.name}</th>
              ))}
              <th className="bg-[#ffff99] vertical-text h-32 align-middle border border-black border-r-2 border-t-2 border-b-2">PROM. GRAL. DE 1º</th>
              
              {/* 2do Grado Campos */}
              {campos['2do Grado'].map((c, i) => (
                <th key={`c2-${i}`} colSpan={c.span} className={`${c.bg} vertical-text h-32 align-middle border border-black border-t-2 border-b-2`}>{c.name}</th>
              ))}
              <th className="bg-[#ffff99] vertical-text h-32 align-middle border border-black border-r-2 border-t-2 border-b-2">PROM. GRAL. DE 2º</th>

              {/* 3er Grado Campos */}
              {campos['3er Grado'].map((c, i) => (
                <th key={`c3-${i}`} colSpan={c.span} className={`${c.bg} vertical-text h-32 align-middle border border-black border-t-2 border-b-2`}>{c.name}</th>
              ))}
              <th className="bg-[#ffff99] vertical-text h-32 align-middle border border-black border-r-2 border-t-2 border-b-2">PROM. GRAL. DE 3º</th>

              {/* Escuela */}
              <th className="bg-[#ffff99] vertical-text h-32 align-middle border-2 border-black">PROM. GRAL DE LA ESCUELA</th>
            </tr>

            <tr className="text-[7px]">
              {/* Materias 1er grado */}
              {campos['1er Grado'].flatMap(c => c.keys).map((k, i) => (
                <th key={k} className={`vertical-text h-24 align-middle border border-black ${i===0?'border-l-2':''}`}>{getMateriaLabel(k)}</th>
              ))}
              <th className="bg-[#ffff99] border border-black border-r-2"></th>
              
              {/* Materias 2do grado */}
              {campos['2do Grado'].flatMap(c => c.keys).map(k => (
                <th key={k} className="vertical-text h-24 align-middle border border-black">{getMateriaLabel(k)}</th>
              ))}
              <th className="bg-[#ffff99] border border-black border-r-2"></th>

              {/* Materias 3er grado */}
              {campos['3er Grado'].flatMap(c => c.keys).map(k => (
                <th key={k} className="vertical-text h-24 align-middle border border-black">{getMateriaLabel(k)}</th>
              ))}
              <th className="bg-[#ffff99] border border-black border-r-2"></th>

              <th className="bg-[#ffff99] border-2 border-black"></th>
            </tr>
          </thead>

          <tbody>
            <tr className="h-8">
              <td className="bg-white border-2 border-black font-black">MATUTINO</td>
              {campos['1er Grado'].flatMap(c => c.keys).map(k => (
                <td key={k} className="bg-white border border-black">{formatPromedio(reportData.Matutino[k])}</td>
              ))}
              <td className="bg-[#ffff99] border border-black border-r-2">{formatPromedio(reportData.Matutino['pg_1er Grado'])}</td>
              {campos['2do Grado'].flatMap(c => c.keys).map(k => (
                <td key={k} className="bg-white border border-black">{formatPromedio(reportData.Matutino[k])}</td>
              ))}
              <td className="bg-[#ffff99] border border-black border-r-2">{formatPromedio(reportData.Matutino['pg_2do Grado'])}</td>
              {campos['3er Grado'].flatMap(c => c.keys).map(k => (
                <td key={k} className="bg-white border border-black">{formatPromedio(reportData.Matutino[k])}</td>
              ))}
              <td className="bg-[#ffff99] border border-black border-r-2">{formatPromedio(reportData.Matutino['pg_3er Grado'])}</td>
              <td className="bg-[#ffff99] border-2 border-black">{formatPromedio(reportData.Matutino.promedioGralTurno)}</td>
            </tr>

            <tr className="h-8">
              <td className="bg-white border-2 border-black font-black">VESPERTINO</td>
              {campos['1er Grado'].flatMap(c => c.keys).map(k => (
                <td key={k} className="bg-white border border-black">{formatPromedio(reportData.Vespertino[k])}</td>
              ))}
              <td className="bg-[#ffff99] border border-black border-r-2">{formatPromedio(reportData.Vespertino['pg_1er Grado'])}</td>
              {campos['2do Grado'].flatMap(c => c.keys).map(k => (
                <td key={k} className="bg-white border border-black">{formatPromedio(reportData.Vespertino[k])}</td>
              ))}
              <td className="bg-[#ffff99] border border-black border-r-2">{formatPromedio(reportData.Vespertino['pg_2do Grado'])}</td>
              {campos['3er Grado'].flatMap(c => c.keys).map(k => (
                <td key={k} className="bg-white border border-black">{formatPromedio(reportData.Vespertino[k])}</td>
              ))}
              <td className="bg-[#ffff99] border border-black border-r-2">{formatPromedio(reportData.Vespertino['pg_3er Grado'])}</td>
              <td className="bg-[#ffff99] border-2 border-black">{formatPromedio(reportData.Vespertino.promedioGralTurno)}</td>
            </tr>

            <tr className="h-8 border-2 border-black">
              <td className="bg-[#ffff99] font-black leading-tight text-[8px]">PROM. GRAL DE<br/>ESCUELA</td>
              {campos['1er Grado'].flatMap(c => c.keys).map(k => (
                <td key={k} className="bg-[#ffff99] border border-black">{formatPromedio(reportData.Escuela[k])}</td>
              ))}
              <td className="bg-[#ffff99] border border-black border-r-2">{formatPromedio(reportData.Escuela['pg_1er Grado'])}</td>
              {campos['2do Grado'].flatMap(c => c.keys).map(k => (
                <td key={k} className="bg-[#ffff99] border border-black">{formatPromedio(reportData.Escuela[k])}</td>
              ))}
              <td className="bg-[#ffff99] border border-black border-r-2">{formatPromedio(reportData.Escuela['pg_2do Grado'])}</td>
              {campos['3er Grado'].flatMap(c => c.keys).map(k => (
                <td key={k} className="bg-[#ffff99] border border-black">{formatPromedio(reportData.Escuela[k])}</td>
              ))}
              <td className="bg-[#ffff99] border border-black border-r-2">{formatPromedio(reportData.Escuela['pg_3er Grado'])}</td>
              <td className="bg-[#ffff99] border-2 border-black">{formatPromedio(reportData.Escuela.promedioGralEscuela)}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-4 text-[10px]">
          <strong>NOTA:</strong> Se considerarán las evaluaciones hasta el 3er. Periodo, las calificaciones y promedios se expresarán en número entero y decimal.
        </div>

        <div className="mt-16 flex justify-center text-[10px]">
          <div className="text-center">
            <div className="border-t border-black w-64 pt-1 font-bold">NOMBRE DEL DIRECTOR</div>
            <div className="mt-4">FIRMA Y SELLO</div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
