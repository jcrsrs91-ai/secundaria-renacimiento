import React, { useState, useMemo } from 'react';
import { getCalificacionFinal } from '../utils/format';
import { FileText, Calendar, PlusCircle, X, Save, History } from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

export default function RegularizacionPrint({ activos, materiasPorGrado, onCaptureExtra, onClose }) {
  const [filtroGrado, setFiltroGrado] = useState('Todos');
  
  // Modal Histórico
  const [showHistoricModal, setShowHistoricModal] = useState(false);
  const [histStudentId, setHistStudentId] = useState('');
  const [histMateria, setHistMateria] = useState('');
  const [histGrade, setHistGrade] = useState('');
  const [isSavingHistoric, setIsSavingHistoric] = useState(false);

  const handleSaveHistoric = async () => {
    if (!histStudentId || !histMateria.trim()) return;
    setIsSavingHistoric(true);
    try {
      const studentRef = doc(db, 'students', histStudentId);
      const newAdeudo = {
        id: 'hist_' + Date.now(),
        name: histMateria.trim(),
        finalGrade: histGrade ? parseFloat(histGrade) : 5.0,
        isHistoric: true
      };
      await updateDoc(studentRef, {
        adeudosAnteriores: arrayUnion(newAdeudo)
      });
      setShowHistoricModal(false);
      setHistStudentId('');
      setHistMateria('');
      setHistGrade('');
    } catch (error) {
      console.error(error);
      alert('Error al guardar el adeudo histórico.');
    } finally {
      setIsSavingHistoric(false);
    }
  };
  
  // Computar alumnos con adeudos (materias reprobadas y no regularizadas)
  const adeudosData = useMemo(() => {
    const list = [];
    activos.forEach(student => {
      const materias = materiasPorGrado[student.grado];
      if (!materias) return;

      const adeudos = [];
      const regularizadas = [];
      
      materias.forEach(mat => {
        const calif = getCalificacionFinal(student, mat.id);
        if (calif) {
          if (calif.isRegularizacion) {
            regularizadas.push({ ...mat, finalGrade: calif.valor, fecha: calif.fecha });
          } else if (calif.isReprobada) {
            adeudos.push({ ...mat, finalGrade: calif.valor });
          }
        }
      });

      const adeudosAnteriores = student.adeudosAnteriores || [];
      adeudosAnteriores.forEach(histMat => {
         const reg = student.regularizacion?.[histMat.id];
         if (reg) {
            regularizadas.push({ ...histMat, finalGrade: reg.calificacion, fecha: reg.fecha, isHistoric: true });
         } else {
            adeudos.push({ ...histMat, isHistoric: true });
         }
      });

      // El alumno aparece en la lista SI tiene adeudos (aún no los ha regularizado)
      // O si tiene historial de regularizadas
      if (adeudos.length > 0 || regularizadas.length > 0) {
        list.push({ student, adeudos, regularizadas });
      }
    });

    // Ordenar por grupo y luego alfabéticamente
    return list.sort((a, b) => {
      const grupoA = (a.student.grupo || '').toUpperCase();
      const grupoB = (b.student.grupo || '').toUpperCase();
      if (grupoA !== grupoB) return grupoA.localeCompare(grupoB);

      const nameA = `${a.student.apellidoPaterno || ''} ${a.student.apellidoMaterno || ''} ${a.student.nombres || ''}`.trim().toUpperCase();
      const nameB = `${b.student.apellidoPaterno || ''} ${b.student.apellidoMaterno || ''} ${b.student.nombres || ''}`.trim().toUpperCase();
      return nameA.localeCompare(nameB);
    });
  }, [activos, materiasPorGrado]);

  // Ordenar activos para el selector del modal
  const sortedActivos = useMemo(() => {
    return [...activos].sort((a, b) => {
      const gradoA = (a.grado || '').toString();
      const gradoB = (b.grado || '').toString();
      if (gradoA !== gradoB) return gradoA.localeCompare(gradoB);
      
      const grupoA = (a.grupo || '').toUpperCase();
      const grupoB = (b.grupo || '').toUpperCase();
      if (grupoA !== grupoB) return grupoA.localeCompare(grupoB);
      
      const nameA = `${a.apellidoPaterno || ''} ${a.apellidoMaterno || ''} ${a.nombres || ''}`.trim().toUpperCase();
      const nameB = `${b.apellidoPaterno || ''} ${b.apellidoMaterno || ''} ${b.nombres || ''}`.trim().toUpperCase();
      return nameA.localeCompare(nameB);
    });
  }, [activos]);

  const filteredData = useMemo(() => {
    if (filtroGrado === 'Todos') return adeudosData;
    return adeudosData.filter(item => item.student.grado === filtroGrado);
  }, [adeudosData, filtroGrado]);

  const handleImprimir = () => {
    setTimeout(() => window.print(), 500);
  };

  return (
    <div className="print-regularizacion-only relative bg-slate-100 min-h-screen py-8 print:py-0 print:bg-white font-sans text-slate-800">
      
      {/* Botones Flotantes para la pantalla */}
      <div className="flex justify-center mb-8 gap-4 print:hidden no-print">
        <button onClick={handleImprimir} className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg transition-colors flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Imprimir Lista Oficial
        </button>
        {onClose && (
          <button onClick={onClose} className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg transition-colors flex items-center">
            <X className="w-5 h-5 mr-2" />
            Cerrar Vista Previa
          </button>
        )}
      </div>

      {/* Filtro de Grado */}
      <div className="flex justify-center mb-6 gap-4 print:hidden no-print">
        <div className="bg-white px-4 py-2 rounded-lg shadow-sm flex items-center gap-3">
          <label className="text-sm font-bold text-slate-700">Filtrar por Grado:</label>
          <select 
            value={filtroGrado} 
            onChange={(e) => setFiltroGrado(e.target.value)}
            className="border-slate-300 rounded-md text-sm py-1.5 pl-3 pr-8 focus:border-orange-500 focus:ring-orange-500 font-medium text-slate-700"
          >
            <option value="Todos">Todos los grados</option>
            <option value="1er Grado">1er Grado</option>
            <option value="2do Grado">2do Grado</option>
            <option value="3er Grado">3er Grado</option>
          </select>
        </div>
        
        <button 
          onClick={() => setShowHistoricModal(true)} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-colors flex items-center"
        >
          <History className="w-5 h-5 mr-2" />
          Añadir Adeudo Anterior
        </button>
      </div>

      <div className="bg-white max-w-5xl mx-auto p-10 rounded-2xl shadow-xl print:shadow-none print:p-0 print:rounded-none">
        
        <style>{`
          @media print {
            @page { size: letter portrait; margin: 1cm; }
            html, body, #root { height: auto !important; overflow: visible !important; display: block !important; margin: 0; padding: 0; background: white; zoom: 0.90; }
            * { overflow: visible !important; }
            aside, header { display: none !important; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .print-regularizacion-only { display: block !important; margin: 0; padding: 0; }
            .no-print { display: none !important; }
          }
        `}</style>

        {/* Encabezado Elegante */}
        <div className="flex items-center justify-between mb-8 border-b-2 border-slate-200 pb-6 print:border-black print:pb-2 print:mb-4">
          <img src="/logo-sep.png" alt="SEP" className="h-16 w-auto object-contain print:h-12" />
          <div className="text-center flex-1 px-4">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase print:text-lg print:leading-tight">REPORTE DE ALUMNOS EN REGULARIZACIÓN</h1>
            <h2 className="text-base font-bold text-slate-600 mt-1 uppercase print:text-xs print:mt-0 print:leading-tight">Escuela Secundaria Técnica N° 68 "Renacimiento"</h2>
            <p className="text-sm font-medium text-slate-500 mt-1 print:text-[10px] print:mt-0 print:leading-tight">Ciclo Escolar 2025-2026</p>
          </div>
          <img src="/logo-escuela.png" alt="Escuela" className="h-20 w-auto object-contain print:h-14" />
        </div>

        {filteredData.length === 0 ? (
          <div className="text-center py-20 text-slate-500 font-bold text-lg">
            ¡No hay ningún alumno con adeudos o materias reprobadas en este momento para el filtro seleccionado!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm print:text-[10pt]">
              <thead>
                <tr className="bg-slate-100 print:bg-slate-200 text-slate-700">
                  <th className="border border-slate-300 px-3 py-2 text-left font-bold w-1/4">Alumno (Matrícula)</th>
                  <th className="border border-slate-300 px-3 py-2 text-center font-bold w-1/6">Grupo</th>
                  <th className="border border-slate-300 px-3 py-2 text-left font-bold w-1/3">Materias Adeudadas (Menor a 6)</th>
                  <th className="border border-slate-300 px-3 py-2 text-left font-bold w-1/4">Historial Extraordinarios</th>
                  <th className="border border-slate-300 px-3 py-2 text-center font-bold w-32 no-print">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr key={item.student.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="border border-slate-300 px-3 py-2">
                      <div className="font-bold text-slate-800 uppercase">{item.student.apellidoPaterno} {item.student.apellidoMaterno} {item.student.nombres}</div>
                      <div className="text-xs text-slate-500">{item.student.matricula}</div>
                    </td>
                    <td className="border border-slate-300 px-3 py-2 text-center font-semibold text-slate-700">
                      {item.student.grado} "{item.student.grupo}"
                    </td>
                    <td className="border border-slate-300 px-3 py-2">
                      {item.adeudos.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1">
                          {item.adeudos.map(mat => (
                            <li key={mat.id} className="text-red-600 font-medium text-xs">
                              {mat.name} 
                              <span className="font-bold bg-red-100 px-1 rounded ml-1">({mat.finalGrade})</span>
                              {mat.isHistoric && <span className="ml-2 text-[9px] text-indigo-600 font-bold bg-indigo-100 px-1 rounded uppercase">Histórico</span>}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-emerald-600 font-bold text-xs italic">Ninguno pendiente</span>
                      )}
                    </td>
                    <td className="border border-slate-300 px-3 py-2">
                      {item.regularizadas.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1">
                          {item.regularizadas.map(mat => (
                            <li key={mat.id} className="text-emerald-700 font-medium text-xs">
                              {mat.name} 
                              <span className="font-bold bg-emerald-100 px-1 rounded ml-1">({mat.finalGrade})</span>
                              {mat.isHistoric && <span className="ml-2 text-[9px] text-indigo-600 font-bold bg-indigo-100 px-1 rounded uppercase">Histórico</span>}
                              <div className="text-[10px] text-slate-500 ml-4">Fecha: {mat.fecha}</div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-slate-400 font-medium text-xs italic">Sin historial</span>
                      )}
                    </td>
                    <td className="border border-slate-300 px-3 py-2 text-center no-print">
                      {item.adeudos.length > 0 && (
                        <button 
                          onClick={() => onCaptureExtra(item.student, item.adeudos)}
                          className="bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-1.5 rounded text-xs font-bold transition-colors w-full flex items-center justify-center"
                        >
                          <PlusCircle className="w-3 h-3 mr-1" />
                          Capturar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pie de Firma */}
        <div className="mt-16 pt-8 flex justify-center break-inside-avoid print:mt-10 print:pt-4">
          <div className="text-center w-80 print:w-72">
            <div className="border-t border-slate-800 pt-2 font-bold text-slate-800 text-sm print:border-black print:text-[11pt] print:pt-1">PROFR. JUAN CARLOS TABOADA BARAJAS</div>
            <div className="mt-1 text-slate-500 text-xs font-semibold tracking-wide print:text-black print:text-[9pt] print:mt-0">DIRECTOR DE LA ESCUELA</div>
          </div>
        </div>
      </div>

      {/* Modal para Agregar Adeudo Histórico */}
      {showHistoricModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="text-xl font-black text-slate-800 flex items-center">
                <History className="w-6 h-6 mr-2 text-indigo-600" />
                Adeudo Anterior
              </h3>
              <button onClick={() => setShowHistoricModal(false)} className="text-slate-400 hover:text-red-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Seleccionar Alumno:</label>
                <select 
                  value={histStudentId} 
                  onChange={e => setHistStudentId(e.target.value)}
                  className="w-full border-slate-300 rounded-md shadow-sm p-2 text-sm"
                >
                  <option value="">Selecciona un alumno...</option>
                  {sortedActivos.map(al => (
                    <option key={al.id} value={al.id}>
                      {al.grado} "{al.grupo}" - {al.apellidoPaterno} {al.apellidoMaterno} {al.nombres}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Materia Reprobada:</label>
                <input 
                  type="text" 
                  value={histMateria}
                  onChange={e => setHistMateria(e.target.value)}
                  placeholder="Ej. Matemáticas I"
                  className="w-full border-slate-300 rounded-md shadow-sm p-2 text-sm uppercase"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Calificación (Opcional):</label>
                <input 
                  type="number"
                  step="0.1"
                  max="5.9"
                  value={histGrade}
                  onChange={e => setHistGrade(e.target.value)}
                  placeholder="5.0"
                  className="w-full border-slate-300 rounded-md shadow-sm p-2 text-sm"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3 pt-4 border-t">
              <button onClick={() => setShowHistoricModal(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg text-sm">Cancelar</button>
              <button 
                onClick={handleSaveHistoric} 
                disabled={!histStudentId || !histMateria.trim() || isSavingHistoric}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-bold flex items-center text-sm"
              >
                <Save className="w-4 h-4 mr-2" /> 
                {isSavingHistoric ? 'Guardando...' : 'Guardar Adeudo'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
