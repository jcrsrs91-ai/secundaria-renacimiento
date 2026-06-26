import React, { useMemo } from 'react';
import { Users, TrendingDown, BookOpen, Printer, X } from 'lucide-react';
import { truncateTo1Dec } from '../utils/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function MatriculaPrint({ alumnos = [], onClose }) {
  
  // Procesar datos para la tabla
  const matriculaData = useMemo(() => {
    const grados = ['1er Grado', '2do Grado', '3er Grado'];
    const turnos = ['Matutino', 'Vespertino'];
    
    // Objeto inicial
    const data = {
      global: { grupos: new Set(), inicial: { h:0, m:0, t:0 }, altas: { h:0, m:0, t:0 }, bajas: { h:0, m:0, t:0 }, existencia: { h:0, m:0, t:0 } }
    };

    grados.forEach(grado => {
      data[grado] = { grupos: new Set(), inicial: { h:0, m:0, t:0 }, altas: { h:0, m:0, t:0 }, bajas: { h:0, m:0, t:0 }, existencia: { h:0, m:0, t:0 } };
      turnos.forEach(turno => {
        data[`${grado}-${turno}`] = { grupos: new Set(), inicial: { h:0, m:0, t:0 }, altas: { h:0, m:0, t:0 }, bajas: { h:0, m:0, t:0 }, existencia: { h:0, m:0, t:0 } };
      });
    });

    alumnos.forEach(a => {
      const grado = a.grado || '1er Grado';
      const turno = a.turno || 'Matutino';
      const grupo = a.grupo || 'A';
      const status = (a.status || 'Activo').toLowerCase();
      // Normalizar genero a H o M
      const genRaw = (a.genero || a.sexo || 'H').toUpperCase();
      const genero = genRaw.startsWith('M') && genRaw !== 'MASCULINO' ? 'M' : 
                     genRaw.startsWith('F') ? 'M' : 'H';

      const key = `${grado}-${turno}`;
      if (!data[key]) return;

      // Registrar grupo
      if (status === 'activo' || status === 'egresado') {
        data[key].grupos.add(grupo);
        data[grado].grupos.add(`${turno}-${grupo}`);
        data.global.grupos.add(`${grado}-${turno}-${grupo}`);
      }

      const isAlta = a.tipoIngreso === 'Alta';
      const isBaja = status === 'baja';
      const isActivo = status === 'activo' || status === 'egresado'; // Consideramos egresados como activos que terminaron

      if (isAlta) {
        data[key].altas[genero.toLowerCase()]++;
        data[key].altas.t++;
        data[grado].altas[genero.toLowerCase()]++;
        data[grado].altas.t++;
        data.global.altas[genero.toLowerCase()]++;
        data.global.altas.t++;
      }

      if (isBaja) {
        // BAJAS
        data[key].bajas[genero.toLowerCase()]++;
        data[key].bajas.t++;
        data[grado].bajas[genero.toLowerCase()]++;
        data[grado].bajas.t++;
        data.global.bajas[genero.toLowerCase()]++;
        data.global.bajas.t++;
      } else if (isActivo) {
        // EXISTENCIA
        data[key].existencia[genero.toLowerCase()]++;
        data[key].existencia.t++;
        data[grado].existencia[genero.toLowerCase()]++;
        data[grado].existencia.t++;
        data.global.existencia[genero.toLowerCase()]++;
        data.global.existencia.t++;
      }
    });

    // Calcular Inicial = Existencia + Bajas - Altas(0)
    [...grados.map(g => turnos.map(t => `${g}-${t}`)).flat(), ...grados, 'global'].forEach(k => {
      ['h', 'm', 't'].forEach(g => {
        data[k].inicial[g] = data[k].existencia[g] + data[k].bajas[g] - data[k].altas[g];
      });
    });

    return data;
  }, [alumnos]);

  const chartData = useMemo(() => {
    return [
      {
        name: '1er Grado',
        Hombres: matriculaData['1er Grado'].existencia.h,
        Mujeres: matriculaData['1er Grado'].existencia.m,
      },
      {
        name: '2do Grado',
        Hombres: matriculaData['2do Grado'].existencia.h,
        Mujeres: matriculaData['2do Grado'].existencia.m,
      },
      {
        name: '3er Grado',
        Hombres: matriculaData['3er Grado'].existencia.h,
        Mujeres: matriculaData['3er Grado'].existencia.m,
      }
    ];
  }, [matriculaData]);

  const calcDesercion = (bajas, inicial, altas) => {
    const totalBase = inicial + altas;
    if (totalBase === 0) return '0.0%';
    return truncateTo1Dec((bajas / totalBase) * 100) + '%';
  };

  const renderRow = (label, key, isTotal = false, isGlobal = false) => {
    const d = matriculaData[key];
    const baseClasses = isGlobal 
      ? 'bg-amber-100 font-black text-amber-900 border-t-2 border-amber-400 print:bg-slate-300 print:text-black print:border-t-2 print:border-black' 
      : isTotal 
        ? 'bg-slate-100 font-bold text-slate-800 border-t-2 border-slate-300 print:bg-slate-200 print:text-black print:border-black' 
        : 'hover:bg-slate-50 transition-colors text-slate-600 font-medium print:text-black';

    return (
      <tr className={baseClasses} key={key}>
        <td colSpan={isTotal ? 2 : 1} className="px-3 py-2 border-r border-slate-200 print:border-slate-400 print:px-1 print:py-1">{label}</td>
        <td className="px-2 py-2 text-center border-r border-slate-200 print:border-slate-400 print:px-1 print:py-1">{d.grupos.size || '-'}</td>
        
        {/* Inicial */}
        <td className="px-2 py-2 text-center bg-blue-50/30 print:bg-transparent border-r border-slate-200 print:border-slate-400 print:px-1 print:py-1">{d.inicial.h || '-'}</td>
        <td className="px-2 py-2 text-center bg-pink-50/30 print:bg-transparent border-r border-slate-200 print:border-slate-400 print:px-1 print:py-1">{d.inicial.m || '-'}</td>
        <td className="px-2 py-2 text-center font-bold bg-slate-50 border-r border-slate-300 print:bg-transparent print:border-slate-400 print:px-1 print:py-1">{d.inicial.t || '-'}</td>
        
        {/* Altas */}
        <td className="px-2 py-2 text-center border-r border-slate-200 print:border-slate-400 print:px-1 print:py-1">{d.altas.h || '-'}</td>
        <td className="px-2 py-2 text-center border-r border-slate-200 print:border-slate-400 print:px-1 print:py-1">{d.altas.m || '-'}</td>
        <td className="px-2 py-2 text-center font-bold bg-slate-50 border-r border-slate-300 print:bg-transparent print:border-slate-400 print:px-1 print:py-1">{d.altas.t || '-'}</td>
        
        {/* Bajas */}
        <td className="px-2 py-2 text-center text-red-600 print:text-black border-r border-slate-200 print:border-slate-400 print:px-1 print:py-1">{d.bajas.h || '-'}</td>
        <td className="px-2 py-2 text-center text-red-600 print:text-black border-r border-slate-200 print:border-slate-400 print:px-1 print:py-1">{d.bajas.m || '-'}</td>
        <td className="px-2 py-2 text-center font-bold text-red-700 bg-red-50 print:bg-transparent print:text-black border-r border-slate-300 print:border-slate-400 print:px-1 print:py-1">{d.bajas.t || '-'}</td>
        
        {/* Existencia */}
        <td className="px-2 py-2 text-center text-emerald-600 print:text-black border-r border-slate-200 print:border-slate-400 print:px-1 print:py-1">{d.existencia.h || '-'}</td>
        <td className="px-2 py-2 text-center text-emerald-600 print:text-black border-r border-slate-200 print:border-slate-400 print:px-1 print:py-1">{d.existencia.m || '-'}</td>
        <td className="px-2 py-2 text-center font-bold text-emerald-700 bg-emerald-50 print:bg-transparent print:text-black border-r border-slate-300 print:border-slate-400 print:px-1 print:py-1">{d.existencia.t || '-'}</td>
        
        {/* Deserción */}
        <td className="px-2 py-2 text-center font-bold text-orange-600 print:text-black print:px-1 print:py-1">{calcDesercion(d.bajas.t, d.inicial.t, d.altas.t)}</td>
      </tr>
    );
  };

  return (
    <div className="print-matricula-only relative bg-slate-100 min-h-screen py-8 print:py-0 print:bg-white font-sans text-slate-800">
      
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
            @page { size: landscape; margin: 0.5cm; }
            html, body, #root { height: auto !important; overflow: visible !important; display: block !important; margin: 0; padding: 0; background: white; }
            * { overflow: visible !important; }
            aside, header { display: none !important; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .print-matricula-only { display: block !important; margin: 0; padding: 0; }
          }
        `}</style>

        {/* Encabezado */}
        <div className="flex items-center justify-between mb-8 border-b-2 border-slate-200 pb-6 print:border-black print:pb-1 print:mb-2">
          <img src="/logo-sep.png" alt="SEP" className="h-16 w-auto object-contain print:h-8" />
          <div className="text-center flex-1 px-4">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase print:text-sm print:leading-tight">ESTADÍSTICA DE MATRÍCULA GENERAL</h1>
            <h2 className="text-base font-bold text-slate-600 mt-1 uppercase print:text-[10px] print:mt-0 print:leading-tight">Escuela Secundaria Técnica N° 68 "Renacimiento"</h2>
            <p className="text-sm font-medium text-slate-500 mt-1 print:text-[9px] print:mt-0 print:leading-tight">Segundo Momento de Valoración • Ciclo Escolar 2025-2026</p>
          </div>
          <img src="/logo-escuela.png" alt="Escuela" className="h-20 w-auto object-contain print:h-10" />
        </div>

        {/* Dashboard de Resumen */}
        <div className="grid grid-cols-4 gap-4 mb-8 print:gap-2 print:mb-3 break-inside-avoid">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl p-4 text-white shadow-md print:border-2 print:border-black print:bg-white print:text-black print:shadow-none print:from-white print:to-white print:p-2 print:flex print:items-center print:justify-between">
            <div className="flex items-center mb-1 print:mb-0">
              <Users className="w-4 h-4 mr-2 print:hidden" />
              <p className="text-xs font-bold opacity-90 uppercase tracking-wide print:opacity-100 print:text-[10px]">Existencia Total</p>
            </div>
            <p className="text-3xl font-black print:text-lg">{matriculaData.global.existencia.t}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-center print:border-2 print:border-black print:shadow-none print:p-2 print:flex-row print:items-center print:justify-between">
             <div className="flex items-center mb-1 print:mb-0 text-slate-500 print:text-black">
              <BookOpen className="w-4 h-4 mr-2 print:hidden" />
              <p className="text-xs font-bold uppercase tracking-wide print:text-[10px]">Total Matutino</p>
            </div>
            <p className="text-2xl font-black text-slate-800 print:text-lg print:text-black">{matriculaData['1er Grado-Matutino'].existencia.t + matriculaData['2do Grado-Matutino'].existencia.t + matriculaData['3er Grado-Matutino'].existencia.t}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-center print:border-2 print:border-black print:shadow-none print:p-2 print:flex-row print:items-center print:justify-between">
             <div className="flex items-center mb-1 print:mb-0 text-slate-500 print:text-black">
              <BookOpen className="w-4 h-4 mr-2 print:hidden" />
              <p className="text-xs font-bold uppercase tracking-wide print:text-[10px]">Total Vespertino</p>
            </div>
            <p className="text-2xl font-black text-slate-800 print:text-lg print:text-black">{matriculaData['1er Grado-Vespertino'].existencia.t + matriculaData['2do Grado-Vespertino'].existencia.t + matriculaData['3er Grado-Vespertino'].existencia.t}</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 shadow-sm flex flex-col justify-center print:border-2 print:border-black print:bg-white print:shadow-none print:p-2 print:flex-row print:items-center print:justify-between">
             <div className="flex items-center mb-1 print:mb-0 text-orange-600 print:text-black">
              <TrendingDown className="w-4 h-4 mr-2 print:hidden" />
              <p className="text-xs font-bold uppercase tracking-wide print:text-[10px]">Deserción Global</p>
            </div>
            <p className="text-2xl font-black text-orange-700 print:text-lg print:text-black">{calcDesercion(matriculaData.global.bajas.t, matriculaData.global.inicial.t, matriculaData.global.altas.t)}</p>
          </div>
        </div>

        {/* Gráfica Interactiva (No imprimible) */}
        <div className="mb-8 p-6 bg-white border border-slate-200 rounded-xl shadow-sm no-print print:hidden">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
            <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            Distribución de Existencia por Género y Grado
          </h3>
          <div className="h-80 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorHombre" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={1}/>
                    <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.9}/>
                  </linearGradient>
                  <linearGradient id="colorMujer" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={1}/>
                    <stop offset="95%" stopColor="#be185d" stopOpacity={0.9}/>
                  </linearGradient>
                  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.15" />
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontWeight: 600, dy: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px'}}
                  labelStyle={{fontWeight: 'bold', color: '#1e293b', marginBottom: '8px'}}
                />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontWeight: 600}} />
                <Bar dataKey="Hombres" fill="url(#colorHombre)" radius={[6, 6, 0, 0]} barSize={40} animationDuration={1500} filter="url(#shadow)" />
                <Bar dataKey="Mujeres" fill="url(#colorMujer)" radius={[6, 6, 0, 0]} barSize={40} animationDuration={1500} filter="url(#shadow)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabla Desglosada */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-slate-400 print:rounded-none">
          <table className="min-w-full divide-y divide-slate-200 text-sm print:text-[9px]">
            <thead>
              <tr className="bg-slate-100 print:bg-slate-100 border-b-2 border-slate-300 print:border-black">
                <th rowSpan="2" className="px-3 py-2 text-center font-bold text-slate-700 border-r border-slate-200 print:border-slate-400 align-middle w-24">GRADO</th>
                <th rowSpan="2" className="px-3 py-2 text-left font-bold text-slate-700 border-r border-slate-200 print:border-slate-400 align-middle w-28">TURNO</th>
                <th rowSpan="2" className="px-2 py-2 text-center font-bold text-slate-700 border-r border-slate-200 print:border-slate-400 align-middle w-12 text-xs">Nº DE GRUPOS</th>
                <th colSpan="3" className="px-2 py-2 text-center font-bold text-blue-900 bg-blue-100 border-r border-slate-300 print:bg-transparent print:text-black print:border-slate-400">INSCRIPCIÓN INICIAL</th>
                <th colSpan="3" className="px-2 py-2 text-center font-bold text-slate-800 bg-slate-100 border-r border-slate-300 print:bg-transparent print:text-black print:border-slate-400">ALTAS</th>
                <th colSpan="3" className="px-2 py-2 text-center font-bold text-red-900 bg-red-100 border-r border-slate-300 print:bg-transparent print:text-black print:border-slate-400">BAJAS</th>
                <th colSpan="3" className="px-2 py-2 text-center font-bold text-emerald-900 bg-emerald-100 border-r border-slate-300 print:bg-transparent print:text-black print:border-slate-400">EXISTENCIA</th>
                <th rowSpan="2" className="px-2 py-2 text-center font-bold text-slate-700 align-middle w-20">% DESERCIÓN</th>
              </tr>
              <tr className="bg-slate-50 print:bg-slate-50">
                {/* Inicial */}
                <th className="px-1 py-1 text-center font-semibold text-slate-600 border-r border-slate-200 border-t border-slate-200 print:border-slate-400">H</th>
                <th className="px-1 py-1 text-center font-semibold text-slate-600 border-r border-slate-200 border-t border-slate-200 print:border-slate-400">M</th>
                <th className="px-1 py-1 text-center font-bold text-slate-800 border-r border-slate-300 border-t border-slate-300 print:border-slate-400 bg-slate-200/50 print:bg-transparent">TOTAL</th>
                {/* Altas */}
                <th className="px-1 py-1 text-center font-semibold text-slate-600 border-r border-slate-200 border-t border-slate-200 print:border-slate-400">H</th>
                <th className="px-1 py-1 text-center font-semibold text-slate-600 border-r border-slate-200 border-t border-slate-200 print:border-slate-400">M</th>
                <th className="px-1 py-1 text-center font-bold text-slate-800 border-r border-slate-300 border-t border-slate-300 print:border-slate-400 bg-slate-200/50 print:bg-transparent">TOTAL</th>
                {/* Bajas */}
                <th className="px-1 py-1 text-center font-semibold text-red-700 border-r border-slate-200 border-t border-slate-200 print:border-slate-400 print:text-black">H</th>
                <th className="px-1 py-1 text-center font-semibold text-red-700 border-r border-slate-200 border-t border-slate-200 print:border-slate-400 print:text-black">M</th>
                <th className="px-1 py-1 text-center font-bold text-red-900 border-r border-slate-300 border-t border-slate-300 print:border-slate-400 bg-red-50 print:bg-transparent print:text-black">TOTAL</th>
                {/* Existencia */}
                <th className="px-1 py-1 text-center font-semibold text-emerald-700 border-r border-slate-200 border-t border-slate-200 print:border-slate-400 print:text-black">H</th>
                <th className="px-1 py-1 text-center font-semibold text-emerald-700 border-r border-slate-200 border-t border-slate-200 print:border-slate-400 print:text-black">M</th>
                <th className="px-1 py-1 text-center font-bold text-emerald-900 border-r border-slate-300 border-t border-slate-300 print:border-slate-400 bg-emerald-50 print:bg-transparent print:text-black">TOTAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white print:divide-slate-400">
              
              {/* PRIMER GRADO */}
              <tr>
                <td rowSpan="3" className="px-3 py-2 text-center font-bold text-slate-800 border-r border-slate-200 bg-slate-50 print:border-slate-400 print:bg-slate-100 align-middle">1ER GRADO</td>
              </tr>
              {renderRow('Matutino', '1er Grado-Matutino')}
              {renderRow('Vespertino', '1er Grado-Vespertino')}
              {renderRow('TOTALES 1ER GRADO', '1er Grado', true)}

              {/* SEGUNDO GRADO */}
              <tr>
                <td rowSpan="3" className="px-3 py-2 text-center font-bold text-slate-800 border-r border-slate-200 border-t border-slate-300 bg-slate-50 print:border-slate-400 print:bg-slate-100 align-middle">2DO GRADO</td>
              </tr>
              {renderRow('Matutino', '2do Grado-Matutino')}
              {renderRow('Vespertino', '2do Grado-Vespertino')}
              {renderRow('TOTALES 2DO GRADO', '2do Grado', true)}

              {/* TERCER GRADO */}
              <tr>
                <td rowSpan="3" className="px-3 py-2 text-center font-bold text-slate-800 border-r border-slate-200 border-t border-slate-300 bg-slate-50 print:border-slate-400 print:bg-slate-100 align-middle">3ER GRADO</td>
              </tr>
              {renderRow('Matutino', '3er Grado-Matutino')}
              {renderRow('Vespertino', '3er Grado-Vespertino')}
              {renderRow('TOTALES 3ER GRADO', '3er Grado', true)}

              {/* TOTAL GLOBAL */}
              <tr>
                <td colSpan="2" className="px-3 py-3 text-right font-black text-amber-900 bg-amber-100 border-r border-amber-300 border-t-2 border-amber-400 print:border-slate-400 print:bg-slate-300 print:text-black print:border-t-2 print:border-t-black">TOTAL DE LA ESCUELA</td>
                <td className="px-2 py-2 text-center font-black bg-amber-100 border-r border-amber-300 border-t-2 border-amber-400 text-amber-900 print:border-slate-400 print:bg-slate-300 print:text-black print:border-t-2 print:border-t-black">{matriculaData.global.grupos.size}</td>
                {/* Inicial */}
                <td className="px-2 py-2 text-center font-bold bg-amber-100 border-r border-amber-300 border-t-2 border-amber-400 text-amber-900 print:border-slate-400 print:bg-slate-300 print:text-black print:border-t-2 print:border-t-black">{matriculaData.global.inicial.h}</td>
                <td className="px-2 py-2 text-center font-bold bg-amber-100 border-r border-amber-300 border-t-2 border-amber-400 text-amber-900 print:border-slate-400 print:bg-slate-300 print:text-black print:border-t-2 print:border-t-black">{matriculaData.global.inicial.m}</td>
                <td className="px-2 py-2 text-center font-black bg-amber-200 border-r border-amber-400 border-t-2 border-amber-400 text-amber-900 print:border-slate-400 print:bg-slate-300 print:text-black print:border-t-2 print:border-t-black">{matriculaData.global.inicial.t}</td>
                {/* Altas */}
                <td className="px-2 py-2 text-center font-bold bg-amber-100 border-r border-amber-300 border-t-2 border-amber-400 text-amber-900 print:border-slate-400 print:bg-slate-300 print:text-black print:border-t-2 print:border-t-black">{matriculaData.global.altas.h}</td>
                <td className="px-2 py-2 text-center font-bold bg-amber-100 border-r border-amber-300 border-t-2 border-amber-400 text-amber-900 print:border-slate-400 print:bg-slate-300 print:text-black print:border-t-2 print:border-t-black">{matriculaData.global.altas.m}</td>
                <td className="px-2 py-2 text-center font-black bg-amber-200 border-r border-amber-400 border-t-2 border-amber-400 text-amber-900 print:border-slate-400 print:bg-slate-300 print:text-black print:border-t-2 print:border-t-black">{matriculaData.global.altas.t}</td>
                {/* Bajas */}
                <td className="px-2 py-2 text-center font-bold bg-amber-100 border-r border-amber-300 border-t-2 border-amber-400 text-red-700 print:border-slate-400 print:bg-slate-300 print:text-black print:border-t-2 print:border-t-black">{matriculaData.global.bajas.h}</td>
                <td className="px-2 py-2 text-center font-bold bg-amber-100 border-r border-amber-300 border-t-2 border-amber-400 text-red-700 print:border-slate-400 print:bg-slate-300 print:text-black print:border-t-2 print:border-t-black">{matriculaData.global.bajas.m}</td>
                <td className="px-2 py-2 text-center font-black bg-amber-200 border-r border-amber-400 border-t-2 border-amber-400 text-red-700 print:border-slate-400 print:bg-slate-300 print:text-black print:border-t-2 print:border-t-black">{matriculaData.global.bajas.t}</td>
                {/* Existencia */}
                <td className="px-2 py-2 text-center font-bold bg-amber-100 border-r border-amber-300 border-t-2 border-amber-400 text-emerald-700 print:border-slate-400 print:bg-slate-300 print:text-black print:border-t-2 print:border-t-black">{matriculaData.global.existencia.h}</td>
                <td className="px-2 py-2 text-center font-bold bg-amber-100 border-r border-amber-300 border-t-2 border-amber-400 text-emerald-700 print:border-slate-400 print:bg-slate-300 print:text-black print:border-t-2 print:border-t-black">{matriculaData.global.existencia.m}</td>
                <td className="px-2 py-2 text-center font-black bg-amber-200 border-r border-amber-400 border-t-2 border-amber-400 text-emerald-700 print:border-slate-400 print:bg-slate-300 print:text-black print:border-t-2 print:border-t-black">{matriculaData.global.existencia.t}</td>
                {/* Deserción */}
                <td className="px-2 py-2 text-center font-black bg-amber-100 border-t-2 border-amber-400 text-orange-700 print:border-slate-400 print:bg-slate-300 print:text-black print:border-t-2 print:border-t-black">{calcDesercion(matriculaData.global.bajas.t, matriculaData.global.inicial.t, matriculaData.global.altas.t)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Firmas */}
        <div className="mt-12 pt-8 flex justify-center break-inside-avoid print:mt-6 print:pt-4">
          <div className="text-center w-80 print:w-64">
            <div className="border-t-2 border-slate-800 pt-2 font-bold text-slate-800 text-sm print:border-black print:text-[10px] print:pt-1">PROFR. JUAN CARLOS TABOADA BARAJAS</div>
            <div className="mt-1 text-slate-500 text-xs font-semibold tracking-wide print:text-black print:text-[8px] print:mt-0">DIRECTOR DE LA ESCUELA</div>
          </div>
        </div>

      </div>
    </div>
  );
}
