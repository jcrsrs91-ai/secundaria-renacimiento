import React from 'react';
import { useGlobalConfig } from '../hooks/useGlobalConfig';
import { truncateTo1Dec, getCalificacionFinal } from '../utils/format';
import { getStudentGender } from './ListaAsistenciaPrint';

export default function CuadroParcialPrint({ alumnos = [], materias = [], grado = '', grupo = '' }) {
  const { config } = useGlobalConfig();
  if (!alumnos || alumnos.length === 0) return null;

  const getPromedioFinalObj = (student, materiaId) => {
    return getCalificacionFinal(student, materiaId);
  };

  const getPromedioGeneralAlumno = (student) => {
    let sum = 0, count = 0;
    materias.forEach(mat => {
      const finalObj = getPromedioFinalObj(student, mat.id);
      if (finalObj !== null) { sum += finalObj.valor; count++; }
    });
    return count > 0 ? truncateTo1Dec(sum / count) : '-';
  };

  // Estadísticas automáticas del grupo
  let existenciaH = 0, existenciaM = 0;
  let regularesH = 0, regularesM = 0;
  let irregularesH = 0, irregularesM = 0;
  let sumaPromedios = 0, alumnosEvaluados = 0;

  alumnos.forEach(al => {
    const gen = getStudentGender(al);
    if (gen === 'M') existenciaM++;
    else existenciaH++;

    let matRep = 0;
    let sumMat = 0, cntMat = 0;
    materias.forEach(mat => {
      const finalObj = getPromedioFinalObj(al, mat.id);
      if (finalObj !== null) {
        sumMat += finalObj.valor;
        cntMat++;
        if (finalObj.valor < 6.0) matRep++;
      }
    });

    if (cntMat > 0) {
      alumnosEvaluados++;
      sumaPromedios += (sumMat / cntMat);
      if (matRep === 0) {
        if (gen === 'M') regularesM++;
        else regularesH++;
      } else {
        if (gen === 'M') irregularesM++;
        else irregularesH++;
      }
    }
  });

  const existenciaT = existenciaH + existenciaM;
  const regularesT = regularesH + regularesM;
  const irregularesT = irregularesH + irregularesM;
  const promedioAprovechamiento = alumnosEvaluados > 0 ? truncateTo1Dec(sumaPromedios / alumnosEvaluados) : '-';
  const porcentajeAprobacion = alumnosEvaluados > 0 ? `${truncateTo1Dec((regularesT / alumnosEvaluados) * 100)} %` : '-';
  const cleanGrupo = (grupo || 'A').trim().toUpperCase();
  const turno = ['G', 'H', 'I', 'J', 'K', 'L'].includes(cleanGrupo) ? 'Vespertino' : 'Matutino';

  return (
    <div className="print-concentrado-parcial-only">
      <style>{`
        @media print {
          @page { size: legal landscape; margin: 0.45cm 0.6cm; }
          html, body, #root { height: auto !important; overflow: visible !important; display: block !important; margin: 0; padding: 0; }
          * { overflow: visible !important; }
          aside, header { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; margin: 0; }
          .print-concentrado-parcial-only { display: block !important; margin: 0; padding: 0; font-family: sans-serif; }
          .landscape-page { page-break-after: always; break-after: page; width: 100%; box-sizing: border-box; }
          .landscape-page:last-child { page-break-after: auto; break-after: auto; }
          table { width: 100%; border-collapse: collapse; page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
        }
        @media screen {
          .print-concentrado-parcial-only { display: none !important; }
        }
      `}</style>

      <div className="landscape-page">
        <div className="flex justify-between items-center mb-1.5">
          <img src="/logo-sep.png" alt="SEP" className="h-10 object-contain" />
          <div className="text-center">
            <h1 className="font-black text-base tracking-wider uppercase">Cuadro de Concentración (Calificaciones Parciales)</h1>
            <h2 className="font-bold text-xs text-slate-700 uppercase">Escuela Secundaria Técnica N° 68 "Renacimiento"</h2>
            <p className="text-[10px] font-bold text-slate-600 mt-0.5 uppercase">Grado: {grado} | Grupo: "{grupo}" | Turno: {turno} | Ciclo Escolar {config?.cicloEscolarActual || '2025-2026'}</p>
          </div>
          <img src="/logo-escuela.png" alt="Escuela" className="h-12 object-contain" />
        </div>

        <table className="w-full text-[8px] border border-black mb-2">
          <thead>
            <tr className="bg-slate-200">
              <th rowSpan="2" className="border border-black p-0.5 text-center w-4">N.</th>
              <th rowSpan="2" className="border border-black p-1 text-left w-40">Nombre del Alumno</th>
              {materias.map(mat => (
                <th key={mat.id} colSpan="4" className="border border-black p-0.5 text-center truncate overflow-hidden max-w-[60px]" title={mat.name}>
                  {mat.name.replace('Formación Cívica y Ética', 'F.C.E.').replace('Educación', 'Educ.').replace('Ciencias', 'Cien.')}
                </th>
              ))}
              <th rowSpan="2" className="border border-black p-1 text-center bg-slate-300 w-8">PROM<br/>GRAL</th>
              <th rowSpan="2" className="border border-black p-1 text-center bg-red-100 text-red-800 text-[6px] w-6">MAT<br/>REP</th>
            </tr>
            <tr className="bg-slate-100">
              {materias.map(mat => (
                <React.Fragment key={`sub-${mat.id}`}>
                  <th className="border border-black p-0.5 text-center w-5">T1</th>
                  <th className="border border-black p-0.5 text-center w-5">T2</th>
                  <th className="border border-black p-0.5 text-center w-5">T3</th>
                  <th className="border border-black p-0.5 text-center bg-slate-200 font-bold w-6">PF</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {alumnos.map((al, idx) => {
              let matRepAlumno = 0;
              return (
                <tr key={al.id}>
                  <td className="border border-black p-0.5 text-center font-bold">{idx + 1}</td>
                  <td className="border border-black p-0.5 font-medium truncate uppercase whitespace-nowrap">{al.apellidoPaterno} {al.apellidoMaterno} {al.nombres}</td>
                  {materias.map(mat => {
                    const t1 = al.calificaciones?.['t1']?.[mat.id] || '-';
                    const t2 = al.calificaciones?.['t2']?.[mat.id] || '-';
                    const t3 = al.calificaciones?.['t3']?.[mat.id] || '-';
                    
                    const finalObj = getPromedioFinalObj(al, mat.id);
                    let val = null;
                    let isReg = false;
                    
                    if (finalObj !== null) {
                      val = finalObj.valor;
                      isReg = finalObj.isRegularizacion;
                      if (val < 6.0) matRepAlumno++;
                    }
                    
                    const isFailing = val !== null && val < 6.0;
                    
                    return (
                      <React.Fragment key={`td-${mat.id}`}>
                        <td className="border border-black p-0.5 text-center">{t1}</td>
                        <td className="border border-black p-0.5 text-center">{t2}</td>
                        <td className="border border-black p-0.5 text-center">{t3}</td>
                        <td className={`border border-black p-0.5 text-center font-bold bg-slate-50 ${isFailing ? 'text-red-600' : ''}`}>
                          {val !== null ? `${truncateTo1Dec(val)}${isReg ? '*' : ''}` : '-'}
                        </td>
                      </React.Fragment>
                    );
                  })}
                  <td className="border border-black p-0.5 text-center font-black bg-slate-200">{getPromedioGeneralAlumno(al)}</td>
                  <td className={`border border-black p-0.5 text-center font-black ${matRepAlumno > 0 ? 'text-red-700 bg-red-50' : 'text-slate-300'}`}>
                    {matRepAlumno}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Cuadro Estadístico Automático */}
        <table className="w-full text-[8px] border border-black text-center mb-4">
          <thead>
            <tr className="bg-slate-200 font-black uppercase">
              <th colSpan="3" className="border border-black py-0.5">Existencia (Activos)</th>
              <th colSpan="3" className="border border-black py-0.5">Alumnos Regulares (0 Reprobadas)</th>
              <th colSpan="3" className="border border-black py-0.5">Alumnos Irregulares (1+ Reprobadas)</th>
              <th rowSpan="2" className="border border-black py-0.5">Promedio de<br/>Aprovechamiento</th>
              <th rowSpan="2" className="border border-black py-0.5">% de<br/>Aprobación</th>
            </tr>
            <tr className="bg-slate-100 font-bold">
              <th className="border border-black py-0.5">Hombres</th>
              <th className="border border-black py-0.5">Mujeres</th>
              <th className="border border-black py-0.5 bg-slate-200">Total</th>
              <th className="border border-black py-0.5">Hombres</th>
              <th className="border border-black py-0.5">Mujeres</th>
              <th className="border border-black py-0.5 bg-slate-200">Total</th>
              <th className="border border-black py-0.5">Hombres</th>
              <th className="border border-black py-0.5">Mujeres</th>
              <th className="border border-black py-0.5 bg-slate-200">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr className="font-bold text-[9px]">
              <td className="border border-black py-1">{existenciaH}</td>
              <td className="border border-black py-1">{existenciaM}</td>
              <td className="border border-black py-1 bg-slate-100 font-black">{existenciaT}</td>
              <td className="border border-black py-1">{alumnosEvaluados > 0 ? regularesH : ''}</td>
              <td className="border border-black py-1">{alumnosEvaluados > 0 ? regularesM : ''}</td>
              <td className="border border-black py-1 bg-slate-100 font-black">{alumnosEvaluados > 0 ? regularesT : ''}</td>
              <td className="border border-black py-1">{alumnosEvaluados > 0 ? irregularesH : ''}</td>
              <td className="border border-black py-1">{alumnosEvaluados > 0 ? irregularesM : ''}</td>
              <td className="border border-black py-1 bg-slate-100 font-black">{alumnosEvaluados > 0 ? irregularesT : ''}</td>
              <td className="border border-black py-1 font-black">{promedioAprovechamiento}</td>
              <td className="border border-black py-1 font-black">{porcentajeAprobacion}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-5 flex justify-around px-10 text-[9.5px] font-bold uppercase">
          <div className="text-center w-52 border-t border-black pt-1">
            Profr. / Profra.<br/>Tutor de Grupo
          </div>
          <div className="text-center w-56 border-t border-black pt-1">
            {turno === 'Matutino'
              ? (config?.coordinadorMatutino || 'Profra. Lucila Rodríguez Martínez')
              : (config?.coordinadorVespertino || 'Profr. José Barrera Vázquez')}
            <br/><span className="text-[8px] font-semibold text-slate-600">Vo. Bo. Coordinación Académica</span>
          </div>
          <div className="text-center w-52 border-t border-black pt-1">
            Profr. Juan Carlos Taboada Barajas<br/><span className="text-[8px] font-semibold text-slate-600">Director del Plantel</span>
          </div>
        </div>
      </div>
    </div>
  );
}
