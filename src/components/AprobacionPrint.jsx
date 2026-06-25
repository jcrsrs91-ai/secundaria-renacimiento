import React, { useMemo } from 'react';
import { AlertCircle, Printer, X } from 'lucide-react';

export default function AprobacionPrint({ activos, materiasPorGrado, onClose }) {
  // Calculadora de materias reprobadas por alumno
  const getMateriasReprobadas = (student, materias) => {
    let reprobadas = 0;
    materias.forEach(mat => {
      const t1 = parseFloat(student.calificaciones?.['t1']?.[mat.id]);
      const t2 = parseFloat(student.calificaciones?.['t2']?.[mat.id]);
      const t3 = parseFloat(student.calificaciones?.['t3']?.[mat.id]);
      let sum = 0, c = 0;
      if (!isNaN(t1)) { sum += t1; c++; }
      if (!isNaN(t2)) { sum += t2; c++; }
      if (!isNaN(t3)) { sum += t3; c++; }
      
      const pf = c > 0 ? (sum / c) : null;
      if (pf !== null && pf < 6.0) {
        reprobadas++;
      }
    });
    return reprobadas;
  };

  const procesarEstadisticas = () => {
    const grados = ['1er Grado', '2do Grado', '3er Grado'];
    const grupos = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    
    let stats = {};
    let sinGenero = [];

    const initializeRow = () => ({
      extH: 0, extM: 0, extT: 0,
      regH: 0, regM: 0, regT: 0,
      irr1: 0, irr2: 0, irr3: 0, irr4: 0, irrT: 0,
      noaH: 0, noaM: 0, noaT: 0
    });

    const addRow = (a, b) => {
      let res = initializeRow();
      for (let k in res) res[k] = a[k] + b[k];
      return res;
    };

    let totalGeneral = initializeRow();

    grados.forEach(grado => {
      stats[grado] = { grupos: {}, total: initializeRow() };
      const materias = materiasPorGrado[grado] || [];

      grupos.forEach(grupo => {
        let row = initializeRow();
        const students = activos.filter(a => a.grado === grado && a.grupo === grupo);
        
        students.forEach(s => {
          let genStr = s.genero?.toUpperCase().trim() || '';
          let isH = ['H', 'MASCULINO', 'HOMBRE'].includes(genStr);
          let isM = ['M', 'FEMENINO', 'MUJER', 'F'].includes(genStr);
          
          if (!isH && !isM) {
            sinGenero.push(s);
          }

          // Existencia
          if (isH) row.extH++;
          if (isM) row.extM++;
          row.extT++; // Todos suman al total aunque no tengan género

          const reprobadas = getMateriasReprobadas(s, materias);

          if (reprobadas === 0) {
            if (isH) row.regH++;
            if (isM) row.regM++;
            row.regT++;
          } else if (reprobadas >= 1 && reprobadas <= 4) {
            if (reprobadas === 1) row.irr1++;
            if (reprobadas === 2) row.irr2++;
            if (reprobadas === 3) row.irr3++;
            if (reprobadas === 4) row.irr4++;
            row.irrT++;
          } else if (reprobadas >= 5) {
            if (isH) row.noaH++;
            if (isM) row.noaM++;
            row.noaT++;
          }
        });

        stats[grado].grupos[grupo] = row;
        stats[grado].total = addRow(stats[grado].total, row);
      });

      totalGeneral = addRow(totalGeneral, stats[grado].total);
    });

    return { stats, totalGeneral, sinGenero };
  };

  const { stats, totalGeneral, sinGenero } = useMemo(procesarEstadisticas, [activos, materiasPorGrado]);

  const renderRow = (label, row, isTotal = false) => {
    const pct = row.extT > 0 ? ((row.irrT + row.noaT) * 100 / row.extT).toFixed(1) + '%' : '0.0%';
    const comprobacion = row.regT + row.irrT + row.noaT;
    
    return (
      <tr key={label} className={`text-center ${isTotal ? 'bg-[#ffff99] font-bold' : ''}`}>
        <td className="border border-black p-1">{label}</td>
        <td className="border border-black p-1">{row.extH}</td>
        <td className="border border-black p-1">{row.extM}</td>
        <td className="border border-black p-1">{row.extT}</td>
        
        <td className="border border-black p-1">{row.regH}</td>
        <td className="border border-black p-1">{row.regM}</td>
        <td className="border border-black p-1">{row.regT}</td>
        
        <td className="border border-black p-1 bg-[#ffff99]">{row.irr1}</td>
        <td className="border border-black p-1 bg-[#ffff99]">{row.irr2}</td>
        <td className="border border-black p-1 bg-[#ffff99]">{row.irr3}</td>
        <td className="border border-black p-1 bg-[#ffff99]">{row.irr4}</td>
        <td className="border border-black p-1 font-bold">{row.irrT}</td>
        
        <td className="border border-black p-1">{row.noaH}</td>
        <td className="border border-black p-1">{row.noaM}</td>
        <td className="border border-black p-1">{row.noaT}</td>
        
        <td className="border border-black p-1 font-bold bg-[#ffff99]">{pct}</td>
        <td className="border border-black p-1 font-bold bg-[#ffff99]">{comprobacion}</td>
      </tr>
    );
  };

  return (
    <div className="w-full bg-slate-100 min-h-screen py-8 print:py-0 print:bg-white print-aprobacion-only">
      <div className="no-print max-w-6xl mx-auto mb-6 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Vista Previa: Reporte de Aprobación</h2>
          <p className="text-sm text-slate-500">Revisa que la información sea correcta antes de imprimir.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg transition-colors flex items-center">
            <Printer className="w-5 h-5 mr-2" />
            Imprimir Documento
          </button>
          {onClose && (
            <button onClick={onClose} className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg transition-colors flex items-center">
              <X className="w-5 h-5 mr-2" />
              Cerrar Vista Previa
            </button>
          )}
        </div>
      </div>

      <div className="bg-white max-w-[1400px] mx-auto p-10 rounded-2xl shadow-xl print:shadow-none print:p-0 print:rounded-none">
        <style>{`
          @media print {
            @page { size: landscape; margin: 1cm; }
            html, body, #root { height: auto !important; overflow: visible !important; display: block !important; margin: 0; padding: 0; }
            * { overflow: visible !important; }
            aside, header { display: none !important; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; margin: 0; }
            .print-aprobacion-only { display: block !important; margin: 0; padding: 0; font-family: 'Arial', sans-serif; }
            .no-print { display: none !important; }
            table { border-collapse: collapse; width: 100%; border: 2px solid black; }
            th, td { border: 1px solid black; padding: 2px; text-align: center; }
          }
        `}</style>

      {/* Alerta de estudiantes sin género en pantalla */}
      {sinGenero.length > 0 && (
        <div className="no-print mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm">
          <div className="flex items-center">
            <AlertCircle className="w-6 h-6 text-red-500 mr-3" />
            <h3 className="font-bold text-red-800 text-lg">Alerta: Alumnos sin género definido</h3>
          </div>
          <p className="mt-2 text-sm text-red-700">
            Hay {sinGenero.length} alumno(s) que no tienen su género correctamente especificado como "Hombre" o "Mujer". 
            <strong> Fueron contabilizados en el "Total (T)", pero no en H o M.</strong>
            Para que las estadísticas por género cuadren, corrígelos en el Directorio.
          </p>
          <ul className="mt-2 text-xs text-red-600 list-disc list-inside max-h-32 overflow-y-auto">
            {sinGenero.map(s => <li key={s.id}>{s.nombres} {s.apellidoPaterno} - {s.grado} {s.grupo} (Registrado como: '{s.genero || 'Vacío'}')</li>)}
          </ul>
        </div>
      )}

      <div className="w-full text-[10px] font-bold">
        <table className="mb-4">
          <tbody>
            <tr>
              <td colSpan="3" className="text-left border-none pb-2 text-[10px] w-48">NOMBRE DEL DIRECTOR(A)</td>
              <td colSpan="8" className="text-left border-none pb-2 border-b border-black"></td>
              <td colSpan="7" className="border-none"></td>
            </tr>
            <tr>
              <td colSpan="2" className="text-left border-none pb-2 text-[10px] w-32">TEL. DEL DIRECTOR</td>
              <td colSpan="4" className="text-left border-none pb-2 border-b border-black"></td>
              <td colSpan="3" className="text-left border-none pb-2 text-[10px] w-40">CORREO ELECTRÓNICO:</td>
              <td colSpan="9" className="text-left border-none pb-2 border-b border-black"></td>
            </tr>
          </tbody>
        </table>

        <table>
          <thead>
            <tr>
              <th colSpan="17" className="text-center font-black text-[12px] py-2 border-2 border-black bg-white">APROBACIÓN</th>
            </tr>
            <tr className="bg-[#ffff99] text-[9px]">
              <th rowSpan="2" className="border border-black w-8">GRADO</th>
              <th rowSpan="2" className="border border-black w-8">GRUPO</th>
              <th colSpan="3" className="border border-black w-24">EXISTENCIA<br/>(Inicial + altas - bajas)</th>
              <th colSpan="3" className="border border-black w-24">REGULARES<br/>(acreditaron todas las disciplinas)</th>
              <th colSpan="5" className="border border-black w-32">IRREGULARES<br/>(no acreditaron de 1 a 4 disciplinas)</th>
              <th colSpan="3" className="border border-black w-24">NO ACREDITADOS<br/>(no acreditaron 5 o más disciplinas)</th>
              <th rowSpan="2" className="border border-black w-16 text-[7px] leading-tight">% DE NO<br/>ACREDITADOS<br/>(Irreg + No Acred.<br/>X 100 / Exist.)</th>
              <th rowSpan="2" className="border border-black w-16 text-[8px]">Comprobación<br/>(reg+irreg+no<br/>acred.)</th>
            </tr>
            <tr className="bg-white text-[9px]">
              <th className="border border-black w-8">H</th>
              <th className="border border-black w-8">M</th>
              <th className="border border-black w-8 font-black">T</th>
              
              <th className="border border-black w-8">H</th>
              <th className="border border-black w-8">M</th>
              <th className="border border-black w-8 font-black">T</th>
              
              <th className="border border-black w-6">1</th>
              <th className="border border-black w-6">2</th>
              <th className="border border-black w-6">3</th>
              <th className="border border-black w-6">4</th>
              <th className="border border-black w-8 text-[6px] font-black leading-tight">Suma de<br/>Irregulares<br/>(con 1 a 4)</th>

              <th className="border border-black w-8">H</th>
              <th className="border border-black w-8">M</th>
              <th className="border border-black w-8 font-black">T</th>
            </tr>
          </thead>
          <tbody>
            {/* 1er Grado */}
            {['A','B','C','D','E','F','G','H'].map((g, i) => (
              <React.Fragment key={`1-${g}`}>
                {i === 0 && <td rowSpan="9" className="border-2 border-black font-black text-lg bg-white align-middle text-center">1º</td>}
                {renderRow(g, stats['1er Grado'].grupos[g])}
              </React.Fragment>
            ))}
            {renderRow('TOTAL', stats['1er Grado'].total, true)}

            {/* 2do Grado */}
            {['A','B','C','D','E','F','G','H'].map((g, i) => (
              <React.Fragment key={`2-${g}`}>
                {i === 0 && <td rowSpan="9" className="border-2 border-black font-black text-lg bg-white align-middle text-center">2º</td>}
                {renderRow(g, stats['2do Grado'].grupos[g])}
              </React.Fragment>
            ))}
            {renderRow('TOTAL', stats['2do Grado'].total, true)}

            {/* 3er Grado */}
            {['A','B','C','D','E','F','G','H'].map((g, i) => (
              <React.Fragment key={`3-${g}`}>
                {i === 0 && <td rowSpan="9" className="border-2 border-black font-black text-lg bg-white align-middle text-center">3º</td>}
                {renderRow(g, stats['3er Grado'].grupos[g])}
              </React.Fragment>
            ))}
            {renderRow('TOTAL', stats['3er Grado'].total, true)}

            {/* TOTAL GENERAL */}
            <tr className="bg-[#ffff99] font-black text-[12px] border-2 border-black h-10">
              <td colSpan="2" className="border border-black p-1 text-center">TOTAL<br/>GENERAL</td>
              <td className="border border-black p-1">{totalGeneral.extH}</td>
              <td className="border border-black p-1">{totalGeneral.extM}</td>
              <td className="border border-black p-1">{totalGeneral.extT}</td>
              
              <td className="border border-black p-1">{totalGeneral.regH}</td>
              <td className="border border-black p-1">{totalGeneral.regM}</td>
              <td className="border border-black p-1">{totalGeneral.regT}</td>
              
              <td className="border border-black p-1">{totalGeneral.irr1}</td>
              <td className="border border-black p-1">{totalGeneral.irr2}</td>
              <td className="border border-black p-1">{totalGeneral.irr3}</td>
              <td className="border border-black p-1">{totalGeneral.irr4}</td>
              <td className="border border-black p-1">{totalGeneral.irrT}</td>
              
              <td className="border border-black p-1">{totalGeneral.noaH}</td>
              <td className="border border-black p-1">{totalGeneral.noaM}</td>
              <td className="border border-black p-1">{totalGeneral.noaT}</td>
              
              <td className="border border-black p-1">{totalGeneral.extT > 0 ? ((totalGeneral.irrT + totalGeneral.noaT) * 100 / totalGeneral.extT).toFixed(1) + '%' : '0.0%'}</td>
              <td className="border border-black p-1">{totalGeneral.regT + totalGeneral.irrT + totalGeneral.noaT}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-4 bg-[#ffff99] p-2 border border-black text-[9px] font-normal leading-tight">
          <strong>NOTA:</strong><br/>
          1.- En la columna R se encuentra una fórmula de comprobación que debe coincidir con el total de existencia.<br/>
          2.- Se considerará <strong>alumno irregular</strong> a aquel que, al promediar los tres periodos de evaluación, no obtenga una calificación mínima de 6.0 y no acredite entre una y cuatro disciplinas. En este caso, estará sujeto a exámenes de regularización.<br/>
          3.- El alumno será <strong>repetidor</strong> cuando al concluir el ciclo escolar tenga 5 o más disciplinas no acreditadas.
        </div>

        <div className="mt-8 flex justify-center text-[10px]">
          <div className="text-center w-80 print:w-64">
            <div className="border-t-2 border-slate-800 pt-2 font-bold text-slate-800 text-sm print:border-black print:text-[10px] print:pt-1">PROFR. JUAN CARLOS TABOADA BARAJAS</div>
            <div className="mt-1 text-slate-500 text-xs font-semibold tracking-wide print:text-black print:text-[8px] print:mt-0">DIRECTOR DE LA ESCUELA</div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
