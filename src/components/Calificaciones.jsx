import React, { useState, useMemo } from 'react';
import { Download, Upload, Save, CheckCircle, AlertTriangle } from 'lucide-react';
import Papa from 'papaparse';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { truncateTo1Dec } from '../utils/format';

export default function Calificaciones({ activos, materiasPorGrado, onPrintBoleta, onPrintConcentradoFinal, onPrintConcentradoParcial }) {
  const [grado, setGrado] = useState('1er Grado');
  const [grupo, setGrupo] = useState('A');
  const [trimestre, setTrimestre] = useState('t1');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [showConcentradoMenu, setShowConcentradoMenu] = useState(false);

  // Filtrar alumnos por grado y grupo
  const alumnos = useMemo(() => {
    return activos
      .filter(a => a.grado === grado && a.grupo === grupo)
      .sort((a, b) => a.apellidoPaterno.localeCompare(b.apellidoPaterno));
  }, [activos, grado, grupo]);

  const materias = materiasPorGrado[grado] || [];

  // Estado local para editar calificaciones antes de guardar
  // Estructura: localGrades[studentId][materiaId] = valor
  const [localGrades, setLocalGrades] = useState({});

  // Sincronizar estado local cuando cambia el filtro o los alumnos
  React.useEffect(() => {
    const grades = {};
    alumnos.forEach(al => {
      grades[al.id] = {};
      materias.forEach(mat => {
        // Asumiendo que guardamos en bd: al.calificaciones.t1.espanol1 = 8
        const calif = al.calificaciones?.[trimestre]?.[mat.id] || '';
        grades[al.id][mat.id] = calif;
      });
    });
    setLocalGrades(grades);
  }, [alumnos, materias, trimestre]);

  const handleGradeChange = (studentId, materiaId, value) => {
    setLocalGrades(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [materiaId]: value
      }
    }));
  };

  const calcularPromedio = (studentId) => {
    const grades = localGrades[studentId];
    if (!grades) return '-';
    let sum = 0;
    let count = 0;
    materias.forEach(mat => {
      const val = parseFloat(grades[mat.id]);
      if (!isNaN(val)) {
        sum += val;
        count++;
      }
    });
    return count === 0 ? '-' : truncateTo1Dec(sum / count);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const promises = alumnos.map(al => {
        const docRef = doc(db, 'students', al.id);
        const gradesToSave = localGrades[al.id];
        // Merge with existing calificaciones
        const currentCalif = al.calificaciones || {};
        const newTrimestreData = { ...currentCalif[trimestre], ...gradesToSave };
        
        return updateDoc(docRef, {
          [`calificaciones.${trimestre}`]: newTrimestreData
        });
      });
      await Promise.all(promises);
      setSuccessMsg('Calificaciones guardadas exitosamente.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error(error);
      alert('Error al guardar calificaciones.');
    }
    setIsSaving(false);
  };

  const handleDownloadTemplate = () => {
    if (alumnos.length === 0) {
      alert("No hay alumnos en este grupo para generar plantilla.");
      return;
    }
    const headers = ['Matricula', 'Nombre Completo', ...materias.map(m => m.name)];
    const data = alumnos.map(al => {
      const row = [
        al.matricula,
        `${al.apellidoPaterno} ${al.apellidoMaterno} ${al.nombres}`
      ];
      materias.forEach(mat => {
        row.push(localGrades[al.id]?.[mat.id] || '');
      });
      return row;
    });

    const csvContent = "\uFEFF" + Papa.unparse({ fields: headers, data }, { delimiter: ";" });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Plantilla_Calificaciones_${grado}_${grupo}_${trimestre}.csv`;
    link.click();
  };

  const getPromedioFinal = (student, materiaId) => {
    const t1 = parseFloat(student.calificaciones?.['t1']?.[materiaId]);
    const t2 = parseFloat(student.calificaciones?.['t2']?.[materiaId]);
    const t3 = parseFloat(student.calificaciones?.['t3']?.[materiaId]);
    let sum = 0, c = 0;
    if (!isNaN(t1)) { sum += t1; c++; }
    if (!isNaN(t2)) { sum += t2; c++; }
    if (!isNaN(t3)) { sum += t3; c++; }
    return c > 0 ? truncateTo1Dec(sum / c, '') : '';
  };

  const handleExportarExcelFinales = () => {
    if (alumnos.length === 0) return;
    const headers = ['Matrícula', 'Nombre del Alumno', ...materias.map(m => m.name), 'Promedio General', 'Materias Reprobadas'];
    const data = alumnos.map(al => {
      const row = [al.matricula, `${al.apellidoPaterno} ${al.apellidoMaterno} ${al.nombres}`];
      let sum = 0, count = 0, reprobadas = 0;
      materias.forEach(mat => {
        const pf = getPromedioFinal(al, mat.id);
        row.push(pf);
        if (pf !== '') {
          sum += parseFloat(pf);
          count++;
          if (parseFloat(pf) < 6.0) reprobadas++;
        }
      });
      row.push(count > 0 ? truncateTo1Dec(sum / count, '') : '');
      row.push(reprobadas);
      return row;
    });
    const csvContent = "\uFEFF" + Papa.unparse({ fields: headers, data }, { delimiter: ";" });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Concentrado_Finales_${grado}_${grupo}.csv`;
    link.click();
  };

  const handleExportarExcelParciales = () => {
    if (alumnos.length === 0) return;
    const headers = ['Matrícula', 'Nombre del Alumno'];
    materias.forEach(mat => {
      headers.push(`${mat.name} T1`, `${mat.name} T2`, `${mat.name} T3`, `${mat.name} Final`);
    });
    headers.push('Promedio General');

    const data = alumnos.map(al => {
      const row = [al.matricula, `${al.apellidoPaterno} ${al.apellidoMaterno} ${al.nombres}`];
      let sum = 0, count = 0;
      materias.forEach(mat => {
        const t1 = al.calificaciones?.['t1']?.[mat.id] || '';
        const t2 = al.calificaciones?.['t2']?.[mat.id] || '';
        const t3 = al.calificaciones?.['t3']?.[mat.id] || '';
        const pf = getPromedioFinal(al, mat.id);
        row.push(t1, t2, t3, pf);
        if (pf !== '') {
          sum += parseFloat(pf);
          count++;
        }
      });
      row.push(count > 0 ? truncateTo1Dec(sum / count, '') : '');
      return row;
    });
    const csvContent = "\uFEFF" + Papa.unparse({ fields: headers, data }, { delimiter: ";" });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Concentrado_Parciales_${grado}_${grupo}.csv`;
    link.click();
  };

  const handleUploadCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const newLocalGrades = { ...localGrades };
        let matchCount = 0;

        results.data.forEach(row => {
          const matricula = row['Matricula'];
          const student = alumnos.find(a => a.matricula === matricula);
          if (student) {
            matchCount++;
            materias.forEach(mat => {
              if (row[mat.name] !== undefined) {
                newLocalGrades[student.id][mat.id] = row[mat.name];
              }
            });
          }
        });

        if (matchCount > 0) {
          setLocalGrades(newLocalGrades);
          alert(`Se cargaron calificaciones para ${matchCount} alumnos. ¡No olvides darle al botón Guardar!`);
        } else {
          alert("No se encontraron coincidencias de matrícula en este grupo.");
        }
      },
      error: (err) => {
        alert("Error al leer el archivo CSV.");
        console.error(err);
      }
    });
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Controles de Filtro */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-end">
        <div className="w-full md:w-1/4">
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Grado</label>
          <select value={grado} onChange={e => setGrado(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg font-medium text-slate-700 bg-slate-50">
            <option value="1er Grado">1er Grado</option>
            <option value="2do Grado">2do Grado</option>
            <option value="3er Grado">3er Grado</option>
          </select>
        </div>
        <div className="w-full md:w-1/4">
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Grupo</label>
          <select value={grupo} onChange={e => setGrupo(e.target.value)} translate="no" className="notranslate w-full p-2.5 border border-slate-300 rounded-lg font-medium text-slate-700 bg-slate-50">
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
            <option value="E">E</option>
            <option value="F">F</option>
          </select>
        </div>
        <div className="w-full md:w-1/4">
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Trimestre</label>
          <select value={trimestre} onChange={e => setTrimestre(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg font-bold text-primary-700 bg-primary-50">
            <option value="t1">Trimestre 1</option>
            <option value="t2">Trimestre 2</option>
            <option value="t3">Trimestre 3</option>
          </select>
        </div>
        <div className="flex-1 flex justify-end gap-2">
          <button onClick={handleDownloadTemplate} className="flex items-center px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium text-sm">
            <Download className="w-4 h-4 mr-2 text-slate-500" /> Plantilla
          </button>
          <label className="cursor-pointer flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition font-medium text-sm">
            <Upload className="w-4 h-4 mr-2" /> Subir CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleUploadCSV} />
          </label>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg border border-emerald-200 flex items-center font-medium">
          <CheckCircle className="w-5 h-5 mr-2" /> {successMsg}
        </div>
      )}

      {alumnos.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-500 flex flex-col items-center">
          <AlertTriangle className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-lg font-medium">No hay alumnos registrados en este grado y grupo.</p>
          <p className="text-sm mt-1">Intenta seleccionar otro filtro o inscribe alumnos primero.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-200 uppercase tracking-wider sticky left-0 z-10 bg-slate-900 border-r border-slate-700">Alumno</th>
                  {materias.map(mat => (
                    <th key={mat.id} className="px-2 py-3 text-center text-[10px] font-bold text-slate-300 uppercase w-16 whitespace-normal leading-tight" title={mat.name}>
                      {mat.name.replace('Formación Cívica y Ética', 'F.C.E.').replace('Ciencias', 'Cien.')}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-xs font-black text-amber-400 uppercase tracking-wider bg-slate-900 border-l border-slate-700">PROM</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-300 uppercase tracking-wider bg-slate-900 border-l border-slate-700 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {alumnos.map((al, idx) => {
                  const prom = parseFloat(calcularPromedio(al.id));
                  const isReprobado = !isNaN(prom) && prom < 6.0;

                  return (
                    <tr key={al.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-4 py-3 whitespace-nowrap text-xs font-bold text-slate-800 sticky left-0 z-10 bg-inherit border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                        {al.apellidoPaterno} {al.apellidoMaterno} <span className="font-medium">{al.nombres}</span>
                      </td>
                      {materias.map(mat => {
                        const val = localGrades[al.id]?.[mat.id] || '';
                        const isFailing = parseFloat(val) < 6.0 && val !== '';
                        return (
                          <td key={mat.id} className="px-1 py-2 text-center">
                            <input 
                              type="number" 
                              min="5" max="10" step="0.1"
                              value={val}
                              onChange={(e) => handleGradeChange(al.id, mat.id, e.target.value)}
                              className={`w-14 text-center p-1.5 border rounded font-bold text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-colors
                                ${isFailing ? 'bg-rose-50 border-rose-300 text-rose-700' : 'bg-white border-slate-300 text-slate-700'}
                              `}
                            />
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center bg-inherit border-l border-slate-200">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-sm font-black ${isReprobado ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'}`}>
                          {calcularPromedio(al.id)}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-center bg-inherit border-l border-slate-200">
                        <button onClick={() => onPrintBoleta && onPrintBoleta(al)} className="text-slate-500 hover:text-slate-800 transition" title="Imprimir Boleta">
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Action Bar */}
          <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4 relative">
              <span className="text-sm font-medium text-slate-500">{alumnos.length} alumnos listados</span>
              
              <div className="relative">
                <button 
                  onClick={() => setShowConcentradoMenu(!showConcentradoMenu)}
                  className="flex items-center px-4 py-2 border-2 border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg font-bold transition text-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  Generar Cuadro de Concentración
                </button>
                
                {showConcentradoMenu && (
                  <div className="absolute bottom-full mb-2 left-0 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 overflow-hidden">
                    <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 mb-1">Tipo de Cuadro</div>
                    
                    <div className="mb-2">
                      <div className="px-3 py-1 text-xs font-bold text-indigo-600">Con Promedios Finales</div>
                      <button onClick={() => { onPrintConcentradoFinal && onPrintConcentradoFinal(alumnos, grado, grupo); setShowConcentradoMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded flex items-center">
                        <svg className="w-4 h-4 mr-2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg> Imprimir PDF
                      </button>
                      <button onClick={() => { handleExportarExcelFinales(); setShowConcentradoMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded flex items-center">
                        <svg className="w-4 h-4 mr-2 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line></svg> Exportar Excel
                      </button>
                    </div>

                    <div>
                      <div className="px-3 py-1 text-xs font-bold text-indigo-600">Con Calificaciones Parciales</div>
                      <button onClick={() => { onPrintConcentradoParcial && onPrintConcentradoParcial(alumnos, grado, grupo); setShowConcentradoMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded flex items-center">
                        <svg className="w-4 h-4 mr-2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg> Imprimir PDF
                      </button>
                      <button onClick={() => { handleExportarExcelParciales(); setShowConcentradoMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded flex items-center">
                        <svg className="w-4 h-4 mr-2 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line></svg> Exportar Excel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => onPrintBoleta && onPrintBoleta(alumnos)}
                className="flex items-center px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-100 transition shadow-sm text-sm"
              >
                 Imprimir Grupo (Boletas)
              </button>
              <button 
                onClick={handleSaveAll}
                disabled={isSaving}
                className="flex items-center px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition shadow-md disabled:opacity-50"
              >
                <Save className="w-5 h-5 mr-2" /> {isSaving ? 'Guardando...' : 'Guardar Calificaciones'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
