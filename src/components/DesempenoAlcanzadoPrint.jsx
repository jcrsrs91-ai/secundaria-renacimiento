import React, { useMemo } from 'react';
import { Award, Printer, X } from 'lucide-react';
import { truncateTo1Dec } from '../utils/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

export default function DesempenoAlcanzadoPrint({ activos = [], materiasPorGrado, onClose }) {

  // Lógica de cálculo de promedios generales
  const stats = useMemo(() => {
    const grados = ['1er Grado', '2do Grado', '3er Grado'];
    const turnos = ['Matutino', 'Vespertino'];
    
    const data = {};
    const initializeRow = () => ({
      matricula: 0,
      asis: { 0: 0, 1_5: 0, 6_10: 0, mas_10: 0, total: 0 },
      nivel: { 5: 0, 6: 0, 7: 0, 8: 0 }
    });

    // Inicializar data
    grados.forEach(g => {
      turnos.forEach(t => {
        data[`${g}-${t}`] = initializeRow();
      });
      data[`total-${g}`] = initializeRow();
    });
    data['total-Escuela'] = initializeRow();

    activos.forEach(student => {
      const g = student.grado || '1er Grado';
      const t = student.turno || 'Matutino';
      const key = `${g}-${t}`;
      if (!data[key]) return;

      const materias = materiasPorGrado[g] || [];
      if (materias.length === 0) return;

      // Calcular promedio general del alumno
      let sumaFinalMaterias = 0;
      let countMateriasValidas = 0;
      
      const c = student.calificaciones || {};
      
      materias.forEach(mat => {
        let sumTrim = 0;
        let countTrim = 0;
        ['t1', 't2', 't3'].forEach(trim => {
          const val = parseFloat(c[trim]?.[mat.id]);
          if (!isNaN(val)) { sumTrim += val; countTrim++; }
        });
        
        if (countTrim > 0) {
          const avgMateria = parseFloat(truncateTo1Dec(sumTrim / countTrim));
          sumaFinalMaterias += avgMateria;
          countMateriasValidas++;
        }
      });

      // El promedio general se calcula con todos los decimales y luego se trunca a 1 décima (o centésima si se requiere)
      const rawPromedio = countMateriasValidas > 0 ? (sumaFinalMaterias / countMateriasValidas) : 0;
      const promedioGeneral = parseFloat(truncateTo1Dec(rawPromedio));
      
      // Clasificación
      let bucket = 5;
      if (promedioGeneral >= 8.0) bucket = 8;
      else if (promedioGeneral >= 7.0) bucket = 7;
      else if (promedioGeneral >= 6.0) bucket = 6;
      else bucket = 5;

      // Sumar al bucket correspondiente
      [key, `total-${g}`, 'total-Escuela'].forEach(k => {
        data[k].matricula++;
        data[k].nivel[bucket]++;
      });
    });

    return data;
  }, [activos, materiasPorGrado]);

  const chartData = useMemo(() => {
    const row = stats['total-Escuela']?.nivel;
    if (!row) return [];
    return [
      { name: '≤ 5.9', value: row[5], fill: '#ef4444' },
      { name: '6.0 a 6.9', value: row[6], fill: '#f59e0b' },
      { name: '7.0 a 7.9', value: row[7], fill: '#3b82f6' },
      { name: '8.0 a 10', value: row[8], fill: '#10b981' }
    ];
  }, [stats]);

  const renderRow = (label, turnoOrTotal, key, isTotalGrado = false, isGlobal = false) => {
    const row = stats[key];
    const baseClasses = isGlobal 
      ? 'bg-amber-100 font-black text-amber-900 border-t-2 border-amber-400 print:bg-slate-300 print:text-black print:border-t-2 print:border-black' 
      : isTotalGrado 
        ? 'bg-slate-100 font-bold text-slate-800 border-t-2 border-slate-300 print:bg-slate-200 print:text-black print:border-black' 
        : 'hover:bg-slate-50 transition-colors text-slate-600 font-medium print:text-black';

    const getPct = (val) => row.matricula > 0 ? truncateTo1Dec((val / row.matricula) * 100) + '%' : '0.0%';
    const asisComprobacion = row.asis[0] + row.asis['1_5'] + row.asis['6_10'] + row.asis['mas_10'];
    const nivelComprobacion = row.nivel[5] + row.nivel[6] + row.nivel[7] + row.nivel[8];

    return (
      <tr className={baseClasses} key={key}>
        {!isTotalGrado && !isGlobal && (
          <td className="px-2 py-2 border-r border-slate-200 font-bold text-slate-700 print:border-slate-400 print:px-1 print:py-1">
            {label.replace(' Grado', '')}
          </td>
        )}
        {isTotalGrado && <td colSpan="2" className="px-2 py-2 text-right pr-4 border-r border-slate-200 print:border-slate-400 print:px-1 print:py-1">{label}</td>}
        {isGlobal && <td colSpan="2" className="px-2 py-2 text-center uppercase border-r border-slate-200 print:border-slate-400 print:px-1 print:py-1">{label}</td>}
        
        {!isTotalGrado && !isGlobal && (
          <td className="px-2 py-2 border-r border-slate-200 print:border-slate-400 print:px-1 print:py-1">{turnoOrTotal}</td>
        )}

        <td className="px-2 py-2 text-center font-bold text-slate-800 bg-slate-50 border-r border-slate-300 print:bg-transparent print:border-slate-400 print:px-1 print:py-1">{row.matricula}</td>

        {/* ASISTENCIA (Hardcoded to 0 as we don't have electronic attendance tracking) */}
        <td className="px-2 py-2 text-center print:px-1 print:py-1 border-l border-slate-200 print:border-slate-400">{row.asis[0]}</td>
        <td className="px-2 py-2 text-center text-xs text-slate-400 border-r border-slate-200 print:border-slate-400 print:px-1 print:py-1 print:text-slate-500">{getPct(row.asis[0])}</td>
        
        <td className="px-2 py-2 text-center print:px-1 print:py-1">{row.asis['1_5']}</td>
        <td className="px-2 py-2 text-center text-xs text-slate-400 border-r border-slate-200 print:border-slate-400 print:px-1 print:py-1 print:text-slate-500">{getPct(row.asis['1_5'])}</td>
        
        <td className="px-2 py-2 text-center print:px-1 print:py-1">{row.asis['6_10']}</td>
        <td className="px-2 py-2 text-center text-xs text-slate-400 border-r border-slate-200 print:border-slate-400 print:px-1 print:py-1 print:text-slate-500">{getPct(row.asis['6_10'])}</td>
        
        <td className="px-2 py-2 text-center print:px-1 print:py-1">{row.asis['mas_10']}</td>
        <td className="px-2 py-2 text-center text-xs text-slate-400 border-r border-slate-200 print:border-slate-400 print:px-1 print:py-1 print:text-slate-500">{getPct(row.asis['mas_10'])}</td>
        
        <td className="px-2 py-2 text-center print:px-1 print:py-1 font-bold">{row.asis.total}</td>
        <td className="px-2 py-2 text-center text-xs text-slate-400 border-r border-slate-200 print:border-slate-400 print:px-1 print:py-1 print:text-slate-500">{getPct(row.asis.total)}</td>
        
        <td className="px-2 py-2 text-center bg-emerald-50/50 print:bg-transparent border-r-2 border-emerald-200 font-bold print:border-slate-400 print:px-1 print:py-1">
          <span className="flex justify-between w-full">
            <span>{asisComprobacion}</span>
            <span className="text-emerald-600 text-[10px]">{row.matricula > 0 && asisComprobacion === row.matricula ? '100%' : '0%'}</span>
          </span>
        </td>

        {/* NIVEL DE DESEMPEÑO ALCANZADO */}
        <td className="px-2 py-2 text-center print:px-1 print:py-1">{row.nivel[5]}</td>
        <td className="px-2 py-2 text-center text-xs text-slate-400 border-r border-slate-200 print:border-slate-400 print:px-1 print:py-1 print:text-slate-500">{getPct(row.nivel[5])}</td>
        
        <td className="px-2 py-2 text-center print:px-1 print:py-1">{row.nivel[6]}</td>
        <td className="px-2 py-2 text-center text-xs text-slate-400 border-r border-slate-200 print:border-slate-400 print:px-1 print:py-1 print:text-slate-500">{getPct(row.nivel[6])}</td>
        
        <td className="px-2 py-2 text-center print:px-1 print:py-1">{row.nivel[7]}</td>
        <td className="px-2 py-2 text-center text-xs text-slate-400 border-r border-slate-200 print:border-slate-400 print:px-1 print:py-1 print:text-slate-500">{getPct(row.nivel[7])}</td>
        
        <td className="px-2 py-2 text-center print:px-1 print:py-1">{row.nivel[8]}</td>
        <td className="px-2 py-2 text-center text-xs text-slate-400 border-r border-slate-200 print:border-slate-400 print:px-1 print:py-1 print:text-slate-500">{getPct(row.nivel[8])}</td>
        
        <td className="px-2 py-2 text-center font-bold bg-amber-50/50 print:bg-transparent border-l border-amber-200 print:border-slate-400 print:px-1 print:py-1">
          <span className="flex justify-between w-full">
            <span>{nivelComprobacion}</span>
            <span className="text-amber-600 text-[10px]">{row.matricula > 0 && nivelComprobacion === row.matricula ? '100%' : '0%'}</span>
          </span>
        </td>
      </tr>
    );
  };

  return (
    <div className="print-desempeno-only relative bg-slate-100 min-h-screen py-8 print:py-0 print:bg-white font-sans text-slate-800">
      
      {/* Controles de Impresión */}
      <div className="flex justify-center mb-8 gap-4 print:hidden no-print">
        <button onClick={() => window.print()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg transition-colors flex items-center">
          <Printer className="w-5 h-5 mr-2" />
          Imprimir Reporte
        </button>
        {onClose && (
          <button onClick={onClose} className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg transition-colors flex items-center">
            <X className="w-5 h-5 mr-2" />
            Cerrar Vista Previa
          </button>
        )}
      </div>

      <div className="bg-white max-w-7xl mx-auto p-10 rounded-2xl shadow-xl print:shadow-none print:p-0 print:rounded-none">
        
        <style>{`
          @media print {
            @page { size: landscape; margin: 0.5cm; }
            html, body, #root { height: auto !important; overflow: visible !important; display: block !important; margin: 0; padding: 0; background: white; }
            * { overflow: visible !important; }
            aside, header { display: none !important; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .print-desempeno-only { display: block !important; margin: 0; padding: 0; }
          }
        `}</style>

        {/* Encabezado */}
        <div className="flex items-center justify-between border-b-2 border-slate-200 pb-6 mb-8 print:mb-4 print:pb-2">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center print:hidden">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight print:text-xl">INDICADORES DE LOGRO Y DESEMPEÑO</h1>
              <p className="text-slate-500 font-medium print:text-sm">Estadística global de inasistencias y promedios alcanzados</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest print:text-xs">Ciclo Escolar</p>
            <p className="text-xl font-black text-indigo-600 print:text-sm">2025 - 2026</p>
          </div>
        </div>

        {/* Gráfica Interactiva (No imprimible) */}
        <div className="mb-8 p-6 bg-white border border-slate-200 rounded-xl shadow-sm no-print print:hidden">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
            <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            Nivel de Desempeño Alcanzado (Toda la Escuela)
          </h3>
          <div className="h-80 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <defs>
                  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.15" />
                  </filter>
                  <linearGradient id="colorFail" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={1}/>
                    <stop offset="95%" stopColor="#991b1b" stopOpacity={0.9}/>
                  </linearGradient>
                  <linearGradient id="colorWarn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={1}/>
                    <stop offset="95%" stopColor="#b45309" stopOpacity={0.9}/>
                  </linearGradient>
                  <linearGradient id="colorOk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={1}/>
                    <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.9}/>
                  </linearGradient>
                  <linearGradient id="colorGood" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={1}/>
                    <stop offset="95%" stopColor="#047857" stopOpacity={0.9}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontWeight: 600, dy: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <RechartsTooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px', fontWeight: 'bold'}}
                  labelStyle={{color: '#1e293b', marginBottom: '8px'}}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={50} animationDuration={1500} filter="url(#shadow)">
                  {chartData.map((entry, index) => {
                    const grad = index === 0 ? "url(#colorFail)" : index === 1 ? "url(#colorWarn)" : index === 2 ? "url(#colorOk)" : "url(#colorGood)";
                    return <Cell key={`cell-${index}`} fill={grad} />
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 print:border-none print:rounded-none">
          <table className="w-full text-sm print:text-[8px]">
            <thead>
              <tr>
                <th rowSpan="2" className="bg-slate-800 text-white py-3 px-2 print:bg-slate-200 print:text-black border-r border-slate-700 print:border-slate-400 print:py-1">GRADO</th>
                <th rowSpan="2" className="bg-slate-800 text-white py-3 px-2 print:bg-slate-200 print:text-black border-r border-slate-700 print:border-slate-400 print:py-1">TURNO</th>
                <th rowSpan="2" className="bg-slate-800 text-white py-3 px-2 print:bg-slate-200 print:text-black border-r border-slate-700 print:border-slate-400 print:py-1 w-16">MATRÍCULA</th>
                
                <th colSpan="11" className="bg-emerald-700 text-emerald-50 py-2 print:bg-emerald-100 print:text-black border-b border-emerald-600 print:border-slate-400 font-black tracking-widest print:py-1 border-r-2 border-emerald-800">ASISTENCIA</th>
                
                <th colSpan="9" className="bg-indigo-700 text-indigo-50 py-2 print:bg-indigo-100 print:text-black border-b border-indigo-600 print:border-slate-400 font-black tracking-widest print:py-1">NIVEL DE DESEMPEÑO ALCANZADO</th>
              </tr>
              <tr>
                {/* Asistencia headers */}
                <th colSpan="2" className="bg-emerald-600 text-emerald-50 text-[10px] print:text-[7px] p-1 print:p-0 border-r border-emerald-500 print:border-slate-400 print:bg-slate-100 print:text-black">No han faltado</th>
                <th colSpan="2" className="bg-emerald-600 text-emerald-50 text-[10px] print:text-[7px] p-1 print:p-0 border-r border-emerald-500 print:border-slate-400 print:bg-slate-100 print:text-black">De 1 a 5 días</th>
                <th colSpan="2" className="bg-emerald-600 text-emerald-50 text-[10px] print:text-[7px] p-1 print:p-0 border-r border-emerald-500 print:border-slate-400 print:bg-slate-100 print:text-black">De 6 a 10 días</th>
                <th colSpan="2" className="bg-emerald-600 text-emerald-50 text-[10px] print:text-[7px] p-1 print:p-0 border-r border-emerald-500 print:border-slate-400 print:bg-slate-100 print:text-black">Más de 10 días</th>
                <th colSpan="2" className="bg-emerald-600 text-emerald-50 text-[10px] print:text-[7px] p-1 print:p-0 border-r border-emerald-500 print:border-slate-400 print:bg-slate-100 print:text-black font-bold">TOTAL Faltas</th>
                <th className="bg-emerald-800 text-emerald-50 text-[10px] print:text-[7px] p-1 print:p-0 border-r-2 border-emerald-900 print:border-slate-400 print:bg-slate-200 print:text-black font-black">COMPROB.</th>

                {/* Desempeño headers */}
                <th colSpan="2" className="bg-indigo-600 text-indigo-50 text-[10px] print:text-[7px] p-1 print:p-0 border-r border-indigo-500 print:border-slate-400 print:bg-slate-100 print:text-black">Promedio &le; 5.9</th>
                <th colSpan="2" className="bg-indigo-600 text-indigo-50 text-[10px] print:text-[7px] p-1 print:p-0 border-r border-indigo-500 print:border-slate-400 print:bg-slate-100 print:text-black">Promedio 6.0 a 6.9</th>
                <th colSpan="2" className="bg-indigo-600 text-indigo-50 text-[10px] print:text-[7px] p-1 print:p-0 border-r border-indigo-500 print:border-slate-400 print:bg-slate-100 print:text-black">Promedio 7.0 a 7.9</th>
                <th colSpan="2" className="bg-indigo-600 text-indigo-50 text-[10px] print:text-[7px] p-1 print:p-0 border-r border-indigo-500 print:border-slate-400 print:bg-slate-100 print:text-black">Promedio 8.0 a 10</th>
                <th className="bg-indigo-800 text-indigo-50 text-[10px] print:text-[7px] p-1 print:p-0 border-l border-indigo-900 print:border-slate-400 print:bg-slate-200 print:text-black font-black">COMPROB.</th>
              </tr>
            </thead>
            <tbody>
              {/* PRIMERO */}
              {renderRow('1er Grado', 'Matutino', '1er Grado-Matutino')}
              {renderRow('1er Grado', 'Vespertino', '1er Grado-Vespertino')}
              {renderRow('TOTAL 1ER GRADO', '', 'total-1er Grado', true)}

              {/* SEGUNDO */}
              {renderRow('2do Grado', 'Matutino', '2do Grado-Matutino')}
              {renderRow('2do Grado', 'Vespertino', '2do Grado-Vespertino')}
              {renderRow('TOTAL 2DO GRADO', '', 'total-2do Grado', true)}

              {/* TERCERO */}
              {renderRow('3er Grado', 'Matutino', '3er Grado-Matutino')}
              {renderRow('3er Grado', 'Vespertino', '3er Grado-Vespertino')}
              {renderRow('TOTAL 3ER GRADO', '', 'total-3er Grado', true)}

              {/* GLOBAL */}
              {renderRow('TOTAL DE LA ESCUELA', '', 'total-Escuela', false, true)}
            </tbody>
          </table>
        </div>
        
        {/* Firmas de impresión */}
        <div className="hidden print:flex justify-between items-end mt-12 px-10">
          <div className="w-64">
            <div className="border-b border-black mb-2"></div>
            <p className="text-center text-xs font-bold">FECHA</p>
          </div>
          <div className="w-80">
            <div className="border-b border-black mb-2 h-16"></div>
            <p className="text-center text-xs font-bold uppercase">Nombre y Firma del Director(a)</p>
            <p className="text-center text-[10px] mt-1">SELLO DE LA ESCUELA</p>
          </div>
        </div>

      </div>
    </div>
  );
}
