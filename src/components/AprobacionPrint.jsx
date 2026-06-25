import React, { useMemo } from 'react';
import { AlertCircle, Printer, X } from 'lucide-react';

export default function AprobacionPrint({ activos, materiasPorGrado, onClose }) {
  // Calculadora de materias reprobadas por alumno
  const getMateriasReprobadas = (student, materias) => {
    let reprobadas = 0;
    materias.forEach(mat => {
      const keys = [`${mat.id}_t1`, `${mat.id}_t2`, `${mat.id}_t3`];
      let sum = 0;
      let count = 0;
      keys.forEach(k => {
        const val = parseFloat(student[k]);
        if (!isNaN(val)) { sum += val; count++; }
      });
      const avg = count > 0 ? sum / count : 0;
      if (avg > 0 && avg < 6.0) {
        reprobadas++;
      }
    });
    return reprobadas;
  };

  // Lógica de procesamiento de datos
  const procesarEstadisticas = () => {
    const grados = ['1er Grado', '2do Grado', '3er Grado'];
    const grupos = ['A','B','C','D','E','F','G','H'];
    const stats = {};
    const sinGenero = [];
    
    const totalGeneral = initializeRow();

    grados.forEach(grado => {
      stats[grado] = { grupos: {}, total: initializeRow() };
      const materias = materiasPorGrado[grado] || [];
      
      grupos.forEach(grupo => {
        let row = initializeRow();
        const students = activos.filter(a => a.grado === grado && a.grupo === grupo);
        
        students.forEach(s => {
          const isHombre = s.genero?.toLowerCase().startsWith('h') || s.genero?.toLowerCase() === 'masculino';
          const isMujer = s.genero?.toLowerCase().startsWith('m') || s.genero?.toLowerCase() === 'femenino';
          
          if (!isHombre && !isMujer) {
            sinGenero.push(s);
          }
          
          row.extT++;
          if (isHombre) row.extH++;
          if (isMujer) row.extM++;
          
          const reprobadas = getMateriasReprobadas(s, materias);
          
          if (reprobadas === 0) {
            row.regT++;
            if (isHombre) row.regH++;
            if (isMujer) row.regM++;
          } else if (reprobadas >= 1 && reprobadas <= 4) {
            row.irrT++;
            if (reprobadas === 1) row.irr1++;
            if (reprobadas === 2) row.irr2++;
            if (reprobadas === 3) row.irr3++;
            if (reprobadas === 4) row.irr4++;
          } else if (reprobadas >= 5) {
            row.noaT++;
            if (isHombre) row.noaH++;
            if (isMujer) row.noaM++;
          }
        });
        
        stats[grado].grupos[grupo] = row;
        sumRows(stats[grado].total, row);
        sumRows(totalGeneral, row);
      });
    });
    
    return { stats, totalGeneral, sinGenero };
  };

  const initializeRow = () => ({
    extH: 0, extM: 0, extT: 0,
    regH: 0, regM: 0, regT: 0,
    irr1: 0, irr2: 0, irr3: 0, irr4: 0, irrT: 0,
    noaH: 0, noaM: 0, noaT: 0
  });

  const sumRows = (target, source) => {
    Object.keys(source).forEach(k => target[k] += source[k]);
  };

  const { stats, totalGeneral, sinGenero } = useMemo(procesarEstadisticas, [activos, materiasPorGrado]);

  const renderTable = (gradoName, title) => {
    const data = stats[gradoName];
    const renderRow = (label, row, isTotal = false) => {
      const pct = row.extT > 0 ? ((row.irrT + row.noaT) * 100 / row.extT).toFixed(1) + '%' : '0.0%';
      const comprobacion = row.regT + row.irrT + row.noaT;
      return (
        <tr key={label} className={`text-center ${isTotal ? 'bg-indigo-50 font-bold border-t-2 border-indigo-200' : 'border-b border-slate-100 hover:bg-slate-50'}`}>
          <td className="py-2 px-1 font-bold text-slate-700">{label}</td>
          <td className="py-2 px-1">{row.extH}</td>
          <td className="py-2 px-1">{row.extM}</td>
          <td className="py-2 px-1 font-bold text-slate-800 bg-slate-50 print:bg-transparent">{row.extT}</td>
          <td className="py-2 px-1">{row.regH}</td>
          <td className="py-2 px-1">{row.regM}</td>
          <td className="py-2 px-1 font-bold text-emerald-600 bg-emerald-50/50 print:bg-transparent">{row.regT}</td>
          <td className="py-2 px-1">{row.irr1}</td>
          <td className="py-2 px-1">{row.irr2}</td>
          <td className="py-2 px-1">{row.irr3}</td>
          <td className="py-2 px-1">{row.irr4}</td>
          <td className="py-2 px-1 font-bold text-amber-600 bg-amber-50/50 print:bg-transparent">{row.irrT}</td>
          <td className="py-2 px-1">{row.noaH}</td>
          <td className="py-2 px-1">{row.noaM}</td>
          <td className="py-2 px-1 font-bold text-red-600 bg-red-50/50 print:bg-transparent">{row.noaT}</td>
          <td className={`py-2 px-1 font-bold ${row.irrT + row.noaT > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{pct}</td>
          <td className={`py-2 px-1 font-bold ${comprobacion === row.extT ? 'text-slate-700' : 'text-red-600'}`}>{comprobacion}</td>
        </tr>
      );
    };

    return (
      <div className="mb-8 print:mb-4">
        <h3 className="text-lg font-bold text-indigo-900 mb-3 uppercase tracking-wider print:text-sm print:mb-1 border-b-2 border-indigo-100 pb-1">{title}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm print:text-[10px]">
            <thead>
              <tr className="bg-slate-800 text-white font-semibold">
                <th rowSpan="2" className="py-2 px-1 rounded-tl-lg">Grupo</th>
                <th colSpan="3" className="py-2 px-1 border-x border-slate-700">Existencia (Inscritos)</th>
                <th colSpan="3" className="py-2 px-1 border-r border-slate-700 bg-emerald-800">Alumnos Regulares</th>
                <th colSpan="5" className="py-2 px-1 border-r border-slate-700 bg-amber-700">Adeudan Disciplinas (Irregulares)</th>
                <th colSpan="3" className="py-2 px-1 border-r border-slate-700 bg-red-800">No Acreditados (5+)</th>
                <th rowSpan="2" className="py-2 px-1 border-r border-slate-700 w-16">% Rep.</th>
                <th rowSpan="2" className="py-2 px-1 rounded-tr-lg w-16">Comp.</th>
              </tr>
              <tr className="bg-slate-700 text-white font-medium text-xs">
                <th className="py-1 px-1 border-r border-slate-600">H</th>
                <th className="py-1 px-1 border-r border-slate-600">M</th>
                <th className="py-1 px-1 border-r border-slate-800 font-bold text-slate-200">T</th>
                
                <th className="py-1 px-1 border-r border-slate-600 bg-emerald-700">H</th>
                <th className="py-1 px-1 border-r border-slate-600 bg-emerald-700">M</th>
                <th className="py-1 px-1 border-r border-slate-800 bg-emerald-700 font-bold text-emerald-100">T</th>
                
                <th className="py-1 px-1 border-r border-slate-600 bg-amber-600">1</th>
                <th className="py-1 px-1 border-r border-slate-600 bg-amber-600">2</th>
                <th className="py-1 px-1 border-r border-slate-600 bg-amber-600">3</th>
                <th className="py-1 px-1 border-r border-slate-600 bg-amber-600">4</th>
                <th className="py-1 px-1 border-r border-slate-800 bg-amber-600 font-bold text-amber-100">T</th>
                
                <th className="py-1 px-1 border-r border-slate-600 bg-red-700">H</th>
                <th className="py-1 px-1 border-r border-slate-600 bg-red-700">M</th>
                <th className="py-1 px-1 border-r border-slate-800 bg-red-700 font-bold text-red-100">T</th>
              </tr>
            </thead>
            <tbody>
              {['A','B','C','D','E','F','G','H'].map((g) => renderRow(g, data.grupos[g]))}
              {renderRow('TOTAL', data.total, true)}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-slate-100 min-h-screen py-8 print:py-0 print:bg-white print-aprobacion-only">
      <div className="no-print max-w-6xl mx-auto mb-6 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Vista Previa: Reporte de Aprobación</h2>
          <p className="text-sm text-slate-500">Formato E2 modernizado. Revisa que la información sea correcta antes de imprimir.</p>
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

      <div className="bg-white max-w-6xl mx-auto p-10 rounded-2xl shadow-xl print:shadow-none print:p-0 print:rounded-none">
        <style>{`
          @media print {
            @page { size: landscape; margin: 0.5cm; }
            html, body, #root { height: auto !important; overflow: visible !important; display: block !important; margin: 0; padding: 0; background: white; }
            * { overflow: visible !important; }
            aside, header { display: none !important; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .print-aprobacion-only { display: block !important; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
            .no-print { display: none !important; }
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

        {/* Encabezado Elegante */}
        <div className="flex items-center justify-between mb-8 border-b-2 border-slate-200 pb-6 print:border-slate-300 print:pb-2 print:mb-4">
          <img src="/logo-sep.png" alt="SEP" className="h-16 w-auto object-contain print:h-10" />
          <div className="text-center flex-1 px-4">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase print:text-lg print:leading-tight">ESTADÍSTICA DE APROBACIÓN (FORMATO E2)</h1>
            <h2 className="text-base font-bold text-slate-600 mt-1 uppercase print:text-xs print:mt-0 print:leading-tight">Escuela Secundaria Técnica N° 68 "Renacimiento"</h2>
            <p className="text-sm font-medium text-slate-500 mt-1 print:text-[10px] print:mt-0 print:leading-tight">Ciclo Escolar 2025-2026 • Cierre del 3er Periodo</p>
          </div>
          <img src="/logo-escuela.png" alt="Escuela" className="h-20 w-auto object-contain print:h-12" />
        </div>

        {/* Tarjetas de Resumen Global */}
        <div className="grid grid-cols-4 gap-4 mb-10 print:gap-2 print:mb-4 break-inside-avoid">
          {/* Total Evaluados */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-center print:border print:border-slate-300 print:shadow-none print:p-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 print:text-[9px]">Alumnos Evaluados</p>
            <p className="text-3xl font-black text-slate-800 print:text-lg">{totalGeneral.extT}</p>
            <div className="flex gap-2 mt-2 text-xs font-semibold text-slate-500 print:text-[8px] print:mt-1">
              <span>H: {totalGeneral.extH}</span><span>M: {totalGeneral.extM}</span>
            </div>
          </div>
          
          {/* Aprobación (Regulares) */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 shadow-sm flex flex-col justify-center print:border print:border-emerald-300 print:shadow-none print:p-2">
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1 print:text-[9px]">Índice de Aprobación</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-emerald-700 print:text-lg">
                {totalGeneral.extT > 0 ? ((totalGeneral.regT / totalGeneral.extT) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <p className="mt-1 text-xs font-semibold text-emerald-600 print:text-[8px]">{totalGeneral.regT} Alumnos Regulares</p>
          </div>

          {/* Irregulares */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm flex flex-col justify-center print:border print:border-amber-300 print:shadow-none print:p-2">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1 print:text-[9px]">Riesgo (1 a 4 Materias)</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-amber-700 print:text-lg">
                {totalGeneral.extT > 0 ? ((totalGeneral.irrT / totalGeneral.extT) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <p className="mt-1 text-xs font-semibold text-amber-600 print:text-[8px]">{totalGeneral.irrT} Alumnos Irregulares</p>
          </div>

          {/* No Acreditados */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm flex flex-col justify-center print:border print:border-red-300 print:shadow-none print:p-2">
            <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1 print:text-[9px]">No Acreditados (5+)</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-red-700 print:text-lg">
                {totalGeneral.extT > 0 ? ((totalGeneral.noaT / totalGeneral.extT) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <p className="mt-1 text-xs font-semibold text-red-600 print:text-[8px]">{totalGeneral.noaT} Alumnos Repetidores</p>
          </div>
        </div>

        {/* Tablas Separadas por Grado */}
        {renderTable('1er Grado', 'PRIMER GRADO')}
        {renderTable('2do Grado', 'SEGUNDO GRADO')}
        {renderTable('3er Grado', 'TERCER GRADO')}

        {/* Totales Generales Escuela */}
        <div className="mt-8 mb-4 break-inside-avoid print:mt-4">
          <h3 className="text-xl font-black text-slate-800 mb-3 border-b-2 border-slate-800 pb-1 uppercase print:text-sm print:mb-1">TOTAL ESCUELA</h3>
          <div className="bg-indigo-600 text-white rounded-xl p-4 shadow-md flex justify-around text-center print:bg-slate-800 print:p-2 print:rounded-lg">
            <div>
              <p className="text-xs text-indigo-200 font-bold uppercase tracking-wide print:text-[8px]">Inscritos</p>
              <p className="text-2xl font-black">{totalGeneral.extT}</p>
            </div>
            <div>
              <p className="text-xs text-emerald-300 font-bold uppercase tracking-wide print:text-[8px]">Regulares</p>
              <p className="text-2xl font-black">{totalGeneral.regT}</p>
            </div>
            <div>
              <p className="text-xs text-amber-300 font-bold uppercase tracking-wide print:text-[8px]">Irregulares</p>
              <p className="text-2xl font-black">{totalGeneral.irrT}</p>
            </div>
            <div>
              <p className="text-xs text-red-300 font-bold uppercase tracking-wide print:text-[8px]">Repetidores</p>
              <p className="text-2xl font-black">{totalGeneral.noaT}</p>
            </div>
          </div>
        </div>

        {/* Pie de Firma */}
        <div className="mt-16 pt-8 flex justify-center break-inside-avoid print:mt-8 print:pt-4">
          <div className="text-center w-80 print:w-64">
            <div className="border-t-2 border-slate-800 pt-2 font-bold text-slate-800 text-sm print:border-slate-800 print:text-[10px] print:pt-1">PROFR. JUAN CARLOS TABOADA BARAJAS</div>
            <div className="mt-1 text-slate-500 text-xs font-semibold tracking-wide print:text-slate-700 print:text-[8px] print:mt-0">DIRECTOR DE LA ESCUELA</div>
          </div>
        </div>

      </div>
    </div>
  );
}
