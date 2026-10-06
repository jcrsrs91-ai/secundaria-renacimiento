import React, { useState, useMemo } from 'react';
import { useGlobalConfig } from '../hooks/useGlobalConfig';
import { Printer, X, GraduationCap, Users, UserRound, Award } from 'lucide-react';

export default function BecasReport({ activos = [], onClose }) {
  const { config } = useGlobalConfig();

  // Filtrar solo los que tienen beca
  const becados = useMemo(() => {
    return activos.filter(s => {
      // Si no hay dato en tieneBeca, no descartamos inmediatamente, evaluamos nombreBeca más abajo
      const tiene = (s.tieneBeca || '').toUpperCase().trim();
      

      
      // Si explícitamente seleccionaron NO, descartar
      if (tiene === 'NO') return false;
      
      // Si empieza con S (SÍ, SI, S?), es un rotundo sí
      if (tiene.startsWith('S')) return true;
      
      // ¿Qué pasa si se saltaron la primera pregunta pero sí escribieron un nombre de beca válido?
      // Lo incluimos si el texto en nombreBeca es válido
      if (s.nombreBeca) {
        const nombreStr = s.nombreBeca.toUpperCase().trim();
        if (nombreStr !== '' && nombreStr !== 'NO' && nombreStr !== 'NINGUNA' && nombreStr !== 'N/A') {
          return true;
        }
      }
      
      return false;
    });
  }, [activos]);

  const stats = useMemo(() => {
    const data = {
      total: becados.length,
      hombres: 0,
      mujeres: 0,
      porTipo: {},
      porGrupo: {}
    };

    becados.forEach(s => {
      // Determinar género (M = Mujer, H = Hombre)
      const sexoUpper = s.sexo?.toUpperCase() || '';
      const isM = sexoUpper.startsWith('M');
      const isH = sexoUpper.startsWith('H');
      
      // Contar globales
      if (isM) {
        data.mujeres++;
      } else {
        // Por defecto o si es H, contamos como hombre para cuadrar el 100%
        data.hombres++;
      }

      // Normalizar nombre de beca
      let rawTipo = (s.nombreBeca || 'NO ESPECIFICADO').trim();
      if (rawTipo.toUpperCase() === 'NO' || rawTipo.toUpperCase() === 'NINGUNA' || rawTipo.toUpperCase() === 'N/A' || rawTipo === '') {
        rawTipo = 'NO ESPECIFICADO';
      }
      
      // Quitar acentos para la comparación y agrupación
      let tipoNormalized = rawTipo.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      let tipo = rawTipo.toUpperCase();
      
      // Agrupar nombres comunes (incluyendo errores ortográficos comunes)
      if (tipoNormalized.includes('RITA') || tipoNormalized.includes('CETINA') || tipoNormalized.includes('SETINA')) {
        tipo = 'BECA RITA CETINA';
      } else if (tipoNormalized.includes('ESTATAL') || tipoNormalized.includes('ESTADO') || tipoNormalized.includes('IGUALDAD')) {
        tipo = 'BECA ESTATAL';
      } else if (tipoNormalized.includes('BENITO') || tipoNormalized.includes('JUAREZ')) {
        tipo = 'BECA BENITO JUÁREZ';
      } else if (tipoNormalized.includes('DISCAPACIDAD') || tipoNormalized.includes('DIF')) {
        tipo = 'BECA POR DISCAPACIDAD / DIF';
      } else if (tipoNormalized.includes('MUNICIPAL') || tipoNormalized.includes('AYUNTAMIENTO') || tipoNormalized.includes('ACAPULCO')) {
        tipo = 'BECA MUNICIPAL';
      } else if (tipoNormalized.includes('PROSPERA') || tipoNormalized.includes('OPORTUNIDADES')) {
        tipo = 'BECA PROSPERA (SEDATU)';
      }

      if (!data.porTipo[tipo]) data.porTipo[tipo] = { total: 0, h: 0, m: 0 };
      data.porTipo[tipo].total++;
      if (isM) data.porTipo[tipo].m++; else data.porTipo[tipo].h++;

      // Grado y grupo a prueba de errores
      const grado = s.grado || '?';
      const grupo = s.grupo || '?';
      const turnoStr = s.turno === 'Vespertino' ? 'Vesp.' : (s.turno === 'Matutino' ? 'Mat.' : 'Sin Turno');
      
      const gkey = `${grado}° "${grupo}" ${turnoStr}`;
      
      if (!data.porGrupo[gkey]) data.porGrupo[gkey] = { total: 0, h: 0, m: 0 };
      data.porGrupo[gkey].total++;
      if (isM) data.porGrupo[gkey].m++; else data.porGrupo[gkey].h++;
    });

    return data;
  }, [becados]);

  const [searchTerm, setSearchTerm] = useState('');

  const filteredBecados = useMemo(() => {
    return becados.filter(s => 
      `${s.nombre} ${s.apellidos} ${s.nombreBeca} ${s.grado} ${s.grupo}`.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a,b) => {
        // Ordenar primero por grado, grupo y turno
        const ga = `${a.grado || '?'}${a.grupo || '?'}${a.turno || '?'}`;
        const gb = `${b.grado || '?'}${b.grupo || '?'}${b.turno || '?'}`;
        if (ga !== gb) return ga.localeCompare(gb);
        // Luego alfabéticamente por apellidos
        return (a.apellidos || '').localeCompare(b.apellidos || '');
    });
  }, [becados, searchTerm]);

  return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[calc(100vh-120px)] animate-in fade-in zoom-in-95 duration-200">
         
         <div className="no-print flex justify-between items-center p-6 border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
            <div>
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <Award className="text-emerald-600" />
                Control y Padrón de Becas
              </h2>
              <p className="text-sm text-slate-500 mt-1">Desglose de alumnos beneficiarios por programa, género y grupo.</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold shadow-sm hover:bg-emerald-700 transition-colors"
              >
                <Printer size={18} />
                Imprimir Reporte
              </button>
              <button 
                onClick={onClose}
                className="flex items-center gap-2 px-4 py-2 bg-white text-slate-600 border border-slate-300 rounded-lg font-medium shadow-sm hover:bg-slate-50 transition-colors"
              >
                <X size={18} />
                Cerrar
              </button>
            </div>
         </div>

         <div className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible bg-slate-50/30">
            <style>{`
                @media print {
                  @page { size: letter portrait; margin: 1.5cm; }
                  .print-section { display: block !important; width: 100%; background: white; }
                  .no-print { display: none !important; }
                }
            `}</style>
            
            <div className="print-section max-w-5xl mx-auto space-y-8">
                
                {/* Cabecera de impresión */}
                <div className="hidden print:flex items-center justify-between border-b-2 border-slate-800 pb-4 mb-8">
                  <div className="flex-1">
                    <h1 className="text-2xl font-black text-slate-900 uppercase">Padrón de Becas Escolar</h1>
                    <h2 className="text-sm font-bold text-slate-600 uppercase mt-1">{config?.escuela || "Escuela Secundaria"} - CCT: {config?.cct || "N/A"}</h2>
                    <p className="text-xs text-slate-500 mt-2">Fecha de emisión: {new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>

                {/* Tarjetas Resumen */}
                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5 print:shadow-none print:border-slate-300">
                    <div className="p-4 bg-emerald-100 text-emerald-600 rounded-full print:bg-transparent print:p-0 print:text-slate-800">
                      <GraduationCap size={32} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Becados</p>
                      <p className="text-4xl font-black text-slate-800">{stats.total}</p>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5 print:shadow-none print:border-slate-300">
                    <div className="p-4 bg-blue-100 text-blue-600 rounded-full print:bg-transparent print:p-0 print:text-slate-800">
                      <UserRound size={32} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Hombres</p>
                      <p className="text-4xl font-black text-slate-800">{stats.hombres}</p>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5 print:shadow-none print:border-slate-300">
                    <div className="p-4 bg-pink-100 text-pink-600 rounded-full print:bg-transparent print:p-0 print:text-slate-800">
                      <UserRound size={32} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Mujeres</p>
                      <p className="text-4xl font-black text-slate-800">{stats.mujeres}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2 print:gap-4 print:break-inside-avoid">
                  {/* Desglose por Tipo de Beca */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:shadow-none print:border-slate-300">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 print:bg-slate-100">
                      <h3 className="font-bold text-slate-700 flex items-center gap-2">
                         <Award size={18}/> Desglose por Tipo de Beca
                      </h3>
                    </div>
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50/50 text-slate-500 text-xs uppercase border-b border-slate-200">
                        <tr>
                          <th className="p-3">Programa / Tipo</th>
                          <th className="p-3 text-center">Hombres</th>
                          <th className="p-3 text-center">Mujeres</th>
                          <th className="p-3 text-center font-bold">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {Object.entries(stats.porTipo).sort((a,b) => b[1].total - a[1].total).map(([tipo, counts]) => (
                          <tr key={tipo} className="hover:bg-slate-50">
                            <td className="p-3 font-medium text-slate-700">{tipo}</td>
                            <td className="p-3 text-center text-slate-600">{counts.h}</td>
                            <td className="p-3 text-center text-slate-600">{counts.m}</td>
                            <td className="p-3 text-center font-bold text-emerald-600">{counts.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Desglose por Grado y Grupo */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:shadow-none print:border-slate-300">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 print:bg-slate-100">
                      <h3 className="font-bold text-slate-700 flex items-center gap-2">
                         <Users size={18}/> Distribución por Grupo
                      </h3>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto print:max-h-none print:overflow-visible">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50/50 text-slate-500 text-xs uppercase border-b border-slate-200 sticky top-0 print:static">
                          <tr>
                            <th className="p-3">Grado y Grupo</th>
                            <th className="p-3 text-center">Hombres</th>
                            <th className="p-3 text-center">Mujeres</th>
                            <th className="p-3 text-center font-bold">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {Object.entries(stats.porGrupo).sort((a,b) => a[0].localeCompare(b[0])).map(([grupo, counts]) => (
                            <tr key={grupo} className="hover:bg-slate-50">
                              <td className="p-3 font-medium text-slate-700">{grupo}</td>
                              <td className="p-3 text-center text-slate-600">{counts.h}</td>
                              <td className="p-3 text-center text-slate-600">{counts.m}</td>
                              <td className="p-3 text-center font-bold text-emerald-600">{counts.total}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Lista detallada */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-8 print:shadow-none print:border-none print:mt-12">
                   
                   <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center print:hidden">
                      <h3 className="font-bold text-slate-800">Padrón Detallado de Beneficiarios</h3>
                      <input 
                        type="text" 
                        placeholder="Buscar alumno o beca..." 
                        className="px-4 py-2 border border-slate-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                   </div>

                   {/* Encabezado alternativo para impresión */}
                   <div className="hidden print:block p-2 border-b-2 border-slate-400 mb-4 mt-8 break-before-page">
                     <h3 className="font-black text-lg text-slate-800 uppercase text-center">Relación Nominal de Becarios</h3>
                   </div>

                   <table className="w-full text-sm text-left">
                      <thead className="bg-slate-100 text-slate-600 text-xs uppercase border-b border-slate-200">
                        <tr>
                          <th className="p-3 w-12 text-center">No.</th>
                          <th className="p-3">Nombre del Alumno</th>
                          <th className="p-3 text-center">Grado</th>
                          <th className="p-3 text-center">Grupo</th>
                          <th className="p-3 text-center">Turno</th>
                          <th className="p-3 text-center">Género</th>
                          <th className="p-3">Programa / Tipo de Beca</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {filteredBecados.map((s, i) => (
                           <tr key={s.id} className="hover:bg-slate-50 print:break-inside-avoid">
                             <td className="p-3 text-center text-slate-400">{i + 1}</td>
                             <td className="p-3 font-bold text-slate-800">{s.apellidos} {s.nombre}</td>
                             <td className="p-3 text-center text-slate-600">{s.grado}°</td>
                             <td className="p-3 text-center font-bold text-slate-700">"{s.grupo || '-'}"</td>
                             <td className="p-3 text-center text-xs uppercase tracking-wider text-slate-500">{s.turno}</td>
                             <td className="p-3 text-center text-slate-600">{s.sexo?.toUpperCase().startsWith('M') ? 'M' : 'H'}</td>
                             <td className="p-3 font-medium text-emerald-700">{s.nombreBeca ? s.nombreBeca.toUpperCase() : 'NO ESPECIFICADO'}</td>
                           </tr>
                        ))}
                        {filteredBecados.length === 0 && (
                          <tr>
                            <td colSpan="7" className="p-8 text-center text-slate-500">No se encontraron beneficiarios que coincidan con la búsqueda.</td>
                          </tr>
                        )}
                      </tbody>
                   </table>
                </div>

            </div>
         </div>
      </div>
  );
}
