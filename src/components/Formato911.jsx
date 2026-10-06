import React from 'react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';
import { FileText, Download, Filter } from 'lucide-react';

export default function Formato911({ rawActivos }) {
  
  const [shiftFilter, setShiftFilter] = useState('Ambos');
  const [isSaving, setIsSaving] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    // Load saved data
    const loadData = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'configuracion', 'formato911_historico'));
        if (docSnap.exists() && containerRef.current) {
          const { tablesData } = docSnap.data();
          const tables = containerRef.current.querySelectorAll('table');
          tablesData.forEach((tableData, tIdx) => {
            const table = tables[tIdx];
            if (table) {
              const trs = table.querySelectorAll('tbody tr');
              tableData.forEach((rowData, rIdx) => {
                const tr = trs[rIdx];
                if (tr) {
                  const tds = tr.querySelectorAll('td');
                  let dataCellIndex = 0;
                  // Only restore values to the data cells
                  tds.forEach((td) => {
                    if (td.classList.contains('data-cell') || td.hasAttribute('contenteditable')) {
                      if (rowData[dataCellIndex] !== undefined) {
                        td.innerText = rowData[dataCellIndex];
                      }
                      dataCellIndex++;
                    }
                  });
                }
              });
            }
          });
        }
      } catch (err) {
        console.error("Error loading 911 data", err);
      }
    };
    loadData();
  }, []);

  const handleSave = async () => {
    if (!containerRef.current) return;
    setIsSaving(true);
    try {
      const tables = containerRef.current.querySelectorAll('table');
      const data = Array.from(tables).map(table => {
        return Array.from(table.querySelectorAll('tbody tr')).map(tr => {
          return Array.from(tr.querySelectorAll('td'))
            .filter(td => td.classList.contains('data-cell') || td.hasAttribute('contenteditable'))
            .map(td => td.innerText.trim());
        });
      });
      await setDoc(doc(db, 'configuracion', 'formato911_historico'), { tablesData: data, updatedAt: new Date().toISOString() });
      toast.success('Datos guardados correctamente.');
        alert('¡Los datos manuales de la 911 se han guardado con éxito en la nube!');
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar los datos.');
        alert('Hubo un error al guardar. Revisa tu conexión a internet.');
    } finally {
      setIsSaving(false);
    }
  };


  const activos = useMemo(() => {
    if (!rawActivos) return [];
    if (shiftFilter === 'Ambos') return rawActivos;
    return rawActivos.filter(a => a.turno === shiftFilter);
  }, [rawActivos, shiftFilter]);
  // En la Fase 2, aquÃ­ irÃ¡n todas las lÃ³gicas matemÃ¡ticas para procesar "activos"
  
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <FileText className="w-7 h-7 text-emerald-600" />
            EstadÃ­stica 911 (Secundaria 911.5)
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Formatos oficiales para captura. Selecciona el turno a consultar.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-4 items-center">
          <div className="flex items-center bg-white rounded-lg border border-slate-300 p-1 shadow-sm">
             <Filter className="w-4 h-4 text-slate-400 mx-2" />
             <span className="text-xs font-medium text-slate-500 pr-2 border-r border-slate-200">Turno de Reporte:</span>
             <select 
               className="bg-transparent border-none text-sm font-bold text-slate-700 outline-none cursor-pointer pl-2 pr-4 py-1"
               value={shiftFilter}
               onChange={e => setShiftFilter(e.target.value)}
             >
                <option value="Ambos">Global (Ambos Turnos)</option>
                <option value="Matutino">Matutino</option>
                <option value="Vespertino">Vespertino</option>
             </select>
          </div>
          <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50">
            {isSaving ? 'Guardando...' : 'Guardar Datos'}
          </button>
          <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
            <Download className="w-4 h-4" /> Imprimir Formatos
          </button>
        </div>
      </div>

      <div className="space-y-12">
        
        {/* I. EXISTENCIA Y PROMOVIDOS */}
        <section>
          <h3 className="text-xl font-bold text-slate-800 mb-4 bg-slate-100 p-2 rounded">I. EXISTENCIA Y PROMOVIDOS</h3>
          
          <div className="mb-6">
            <p className="text-sm font-semibold mb-2">1. Existentes al final del ciclo (por grado, sexo, y condiciones)</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-center border-collapse border border-slate-300 min-w-[800px]">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-300 p-2">Grado</th>
                    <th className="border border-slate-300 p-2">Hombres</th>
                    <th className="border border-slate-300 p-2">Mujeres</th>
                    <th className="border border-slate-300 p-2 bg-slate-100">Total</th>
                    <th className="border border-slate-300 p-2">Grupos</th>
                    <th className="border border-slate-300 p-2">Hablantes IndÃ­genas</th>
                    <th className="border border-slate-300 p-2">Nacidos fuera MX</th>
                    <th className="border border-slate-300 p-2">Afrodescendientes</th>
                    <th className="border border-slate-300 p-2">Con discapacidad</th>
                    <th className="border border-slate-300 p-2">Con trastorno</th>
                    <th className="border border-slate-300 p-2">Aptitudes Sobresal.</th>
                    <th className="border border-slate-300 p-2">Otras condiciones</th>
                  </tr>
                </thead>
                <tbody>
                  {['1o.', '2o.', '3o.', 'Total'].map((g, i) => (
                    <tr key={i} className={g === 'Total' ? 'font-bold bg-slate-50' : ''}>
                      <td className="border border-slate-300 p-2">{g}</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold mb-2">2. Promovidos (por grado, sexo, y condiciones)</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-center border-collapse border border-slate-300 min-w-[800px]">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-300 p-2">Grado</th>
                    <th className="border border-slate-300 p-2">Hombres</th>
                    <th className="border border-slate-300 p-2">Mujeres</th>
                    <th className="border border-slate-300 p-2 bg-slate-100">Total</th>
                    <th className="border border-slate-300 p-2">Hablantes IndÃ­genas</th>
                    <th className="border border-slate-300 p-2">Nacidos fuera MX</th>
                    <th className="border border-slate-300 p-2">Afrodescendientes</th>
                    <th className="border border-slate-300 p-2">Con discapacidad</th>
                    <th className="border border-slate-300 p-2">Con trastorno</th>
                    <th className="border border-slate-300 p-2">Aptitudes Sobresal.</th>
                    <th className="border border-slate-300 p-2">Otras condiciones</th>
                  </tr>
                </thead>
                <tbody>
                  {['1o.', '2o.', '3o.', 'Total'].map((g, i) => (
                    <tr key={i} className={g === 'Total' ? 'font-bold bg-slate-50' : ''}>
                      <td className="border border-slate-300 p-2">{g}</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* II. ALUMNADO QUE PROVIENE DE OTRA ESCUELA */}
        <section>
          <h3 className="text-xl font-bold text-slate-800 mb-4 bg-slate-100 p-2 rounded">II. ALUMNADO QUE PROVIENE DE OTRA ESCUELA</h3>
          
          <div className="mb-6">
            <p className="text-sm font-semibold mb-2">1. Procedencia por grado y sexo</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-center border-collapse border border-slate-300 min-w-[700px]">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-300 p-2" rowSpan="2">Grado / Tipo</th>
                    <th className="border border-slate-300 p-2" colSpan="2">Misma entidad</th>
                    <th className="border border-slate-300 p-2" colSpan="2">Otra entidad</th>
                    <th className="border border-slate-300 p-2" colSpan="2">Otro paÃ­s</th>
                    <th className="border border-slate-300 p-2 bg-slate-100" colSpan="2">Total</th>
                  </tr>
                  <tr>
                    <th className="border border-slate-300 p-1">Hombres</th>
                    <th className="border border-slate-300 p-1">Mujeres</th>
                    <th className="border border-slate-300 p-1">Hombres</th>
                    <th className="border border-slate-300 p-1">Mujeres</th>
                    <th className="border border-slate-300 p-1">Hombres</th>
                    <th className="border border-slate-300 p-1">Mujeres</th>
                    <th className="border border-slate-300 p-1 bg-slate-100">Hombres</th>
                    <th className="border border-slate-300 p-1 bg-slate-100">Mujeres</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 p-2 text-left">1o. Nvo. Ingreso</td>
                    <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td><td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                    <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td><td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                    <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td><td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                    <td className="border border-slate-300 p-2 bg-slate-100 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td><td className="border border-slate-300 p-2 bg-slate-100 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 text-left">1o. Repetidor</td>
                    <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td><td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                    <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td><td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                    <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td><td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                    <td className="border border-slate-300 p-2 bg-slate-100 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td><td className="border border-slate-300 p-2 bg-slate-100 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 text-left">2o.</td>
                    <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td><td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                    <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td><td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                    <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td><td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                    <td className="border border-slate-300 p-2 bg-slate-100 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td><td className="border border-slate-300 p-2 bg-slate-100 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 text-left">3o.</td>
                    <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td><td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                    <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td><td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                    <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td><td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                    <td className="border border-slate-300 p-2 bg-slate-100 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td><td className="border border-slate-300 p-2 bg-slate-100 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                  </tr>
                  <tr className="font-bold bg-slate-50">
                    <td className="border border-slate-300 p-2 text-left">Total</td>
                    <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td><td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                    <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td><td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                    <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td><td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                    <td className="border border-slate-300 p-2 bg-slate-100 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td><td className="border border-slate-300 p-2 bg-slate-100 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

          <div className="mt-8 mb-6">
            <p className="text-sm font-semibold mb-2">2. De las alumnas y alumnos provenientes de escuelas de otro paÃ­s reportados en la pregunta anterior, desglÃ³selos segÃºn el paÃ­s o lugar y sexo.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-center border-collapse border border-slate-300 max-w-2xl">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-300 p-2 text-left">PaÃ­s o lugar</th>
                    <th className="border border-slate-300 p-2">Hombres</th>
                    <th className="border border-slate-300 p-2">Mujeres</th>
                    <th className="border border-slate-300 p-2 bg-slate-100">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {['Estados Unidos', 'CanadÃ¡', 'CentroamÃ©rica y el Caribe', 'SudamÃ©rica', 'Ãfrica', 'Asia', 'Europa', 'OceanÃ­a', 'Total'].map((lugar, i) => (
                    <tr key={i} className={lugar === 'Total' ? 'font-bold bg-slate-50' : ''}>
                      <td className="border border-slate-300 p-2 text-left">{lugar}</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        {/* III. BECAS */}
        <section>
          <h3 className="text-xl font-bold text-slate-800 mb-4 bg-slate-100 p-2 rounded">III. BECAS</h3>
          
          <div className="mb-6">
            <p className="text-sm font-semibold mb-2">1. Alumnado con y sin beca</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-center border-collapse border border-slate-300 max-w-4xl">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-300 p-2">Estatus</th>
                    <th className="border border-slate-300 p-2">Hombres</th>
                    <th className="border border-slate-300 p-2">Mujeres</th>
                    <th className="border border-slate-300 p-2 bg-slate-100">Total</th>
                    <th className="border border-slate-300 p-2">Con discapacidad</th>
                    <th className="border border-slate-300 p-2">Hablantes IndÃ­genas</th>
                    <th className="border border-slate-300 p-2">Nacidos fuera MX</th>
                  </tr>
                </thead>
                <tbody>
                  {['Con Beca', 'Sin Beca', 'Total'].map((g, i) => (
                    <tr key={i} className={g === 'Total' ? 'font-bold bg-slate-50' : ''}>
                      <td className="border border-slate-300 p-2 text-left">{g}</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8 mb-6">
            <p className="text-sm font-semibold mb-2">2. Escriba por sexo, el nÃºmero de alumnas y alumnos con beca reportados en la pregunta anterior, y desglÃ³selos segÃºn el origen de la beca.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-center border-collapse border border-slate-300 max-w-4xl">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-300 p-2 text-left">Origen de la beca</th>
                    <th className="border border-slate-300 p-2">Hombres</th>
                    <th className="border border-slate-300 p-2">Mujeres</th>
                    <th className="border border-slate-300 p-2 bg-slate-100">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Becas federales', isHeader: true },
                    { label: 'Beca Rita Cetina' },
                    { label: 'Otra* (*Especifique: _________)' },
                    { label: 'Total becas federales', isSubtotal: true },
                    { label: 'Otras becas', isHeader: true },
                    { label: 'Beca estatal' },
                    { label: 'Beca de fundaciones y asociaciones civiles' },
                    { label: 'Beca de la propia escuela' },
                    { label: 'Beca particular' },
                    { label: 'Beca municipal' },
                    { label: 'Otras* (*Especifique: _________)' },
                    { label: 'Total de becas', isSubtotal: true }
                  ].map((beca, i) => (
                    <tr key={i} className={beca.isSubtotal ? 'font-bold bg-slate-50' : beca.isHeader ? 'font-bold bg-slate-100' : ''}>
                      <td className={`border border-slate-300 p-2 text-left ${beca.isHeader ? 'uppercase text-slate-700' : beca.isSubtotal ? '' : 'pl-6'}`}>{beca.label}</td>
                      <td className="border border-slate-300 p-2">{beca.isHeader ? '' : '0'}</td>
                      <td className="border border-slate-300 p-2">{beca.isHeader ? '' : '0'}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100">{beca.isHeader ? '' : '0'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* IV. ABANDONO ESCOLAR Y SUS CAUSAS */}
        <section>
          <h3 className="text-xl font-bold text-slate-800 mb-4 bg-slate-100 p-2 rounded">IV. ABANDONO ESCOLAR Y SUS CAUSAS</h3>
          
          <div className="mb-6">
            <p className="text-sm font-semibold mb-2">1. Escriba por sexo el nÃºmero de alumnos que no concluyeron el ciclo escolar en esta escuela.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-center border-collapse border border-slate-300 max-w-lg">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-300 p-2">Hombres</th>
                    <th className="border border-slate-300 p-2">Mujeres</th>
                    <th className="border border-slate-300 p-2 bg-slate-100">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                    <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                    <td className="border border-slate-300 p-2 bg-slate-100 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm font-semibold mb-2">2. Escriba por sexo, el nÃºmero de alumnos reportados en la pregunta anterior, segÃºn el motivo principal por el que no concluyeron el ciclo escolar. (Registre a cada alumno en un solo motivo).</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-center border-collapse border border-slate-300 max-w-4xl">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-300 p-2 text-left">Motivo por el que no concluyÃ³ el ciclo escolar</th>
                    <th className="border border-slate-300 p-2">Hombres</th>
                    <th className="border border-slate-300 p-2">Mujeres</th>
                    <th className="border border-slate-300 p-2 bg-slate-100">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    'Acoso escolar (Bullying)',
                    'Baja administrativa (disciplina)',
                    'Baja temporal',
                    'Cambio de escuela',
                    'Cambio de residencia',
                    'Consumo y/o abuso de sustancias',
                    'DesinterÃ©s/falta de motivaciÃ³n',
                    'Desplazamiento forzado o crisis humanitaria',
                    'DesvinculaciÃ³n de la familia con la escuela',
                    'Distancia o dificultad para llegar a la escuela',
                    'Embarazo o uniÃ³n conyugal temprana',
                    'Enfermedad o incapacidad sin apoyo suficiente',
                    'Falta de recursos para transporte, uniforme, materiales o alimentaciÃ³n',
                    'Falta de tiempo para brindar atenciÃ³n diferenciada',
                    'Malas condiciones de las instalaciones escolares',
                    'MigraciÃ³n del alumno o de la familia',
                    'Necesidad de trabajar para apoyar la economÃ­a familiar',
                    'Problemas con el bienestar emocional o autoestima',
                    'Problemas familiares/violencia intrafamiliar',
                    'Rezago en los aprendizajes',
                    'Violencia/inseguridad del entorno',
                    'Se desconoce el motivo',
                    'Otros* (* Especifique: ___________________)'
                  ].map((motivo, i) => (
                    <tr key={i}>
                      <td className="border border-slate-300 p-2 text-left">{motivo}</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* V. ALUMNADO Y GRUPOS (Edades) */}
        <section>
          <h3 className="text-xl font-bold text-slate-800 mb-4 bg-slate-100 p-2 rounded">V. ALUMNADO Y GRUPOS POR EDAD</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-center border-collapse border border-slate-300 min-w-[900px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="border border-slate-300 p-2">Grado / Sexo</th>
                  <th className="border border-slate-300 p-2">Menos 12</th>
                  <th className="border border-slate-300 p-2">12 aÃ±os</th>
                  <th className="border border-slate-300 p-2">13 aÃ±os</th>
                  <th className="border border-slate-300 p-2">14 aÃ±os</th>
                  <th className="border border-slate-300 p-2">15 aÃ±os</th>
                  <th className="border border-slate-300 p-2">16 aÃ±os</th>
                  <th className="border border-slate-300 p-2">17 aÃ±os</th>
                  <th className="border border-slate-300 p-2">18 o mÃ¡s</th>
                  <th className="border border-slate-300 p-2 bg-slate-100">Total</th>
                  <th className="border border-slate-300 p-2">Grupos</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "1Â° Hombres Nvo.", g: '1' }, { label: "1Â° Hombres Rep.", g: '1' },
                  { label: "1Â° Mujeres Nvo.", g: '1' }, { label: "1Â° Mujeres Rep.", g: '1' },
                  { label: "Subtotal 1Â°", g: '1', sub: true },
                  { label: "2Â° Hombres Nvo.", g: '2' }, { label: "2Â° Hombres Rep.", g: '2' },
                  { label: "2Â° Mujeres Nvo.", g: '2' }, { label: "2Â° Mujeres Rep.", g: '2' },
                  { label: "Subtotal 2Â°", g: '2', sub: true },
                  { label: "3Â° Hombres Nvo.", g: '3' }, { label: "3Â° Hombres Rep.", g: '3' },
                  { label: "3Â° Mujeres Nvo.", g: '3' }, { label: "3Â° Mujeres Rep.", g: '3' },
                  { label: "Subtotal 3Â°", g: '3', sub: true },
                ].map((row, i) => (
                  <tr key={i} className={row.sub ? 'font-bold bg-slate-50' : ''}>
                    <td className="border border-slate-300 p-2 text-left">{row.label}</td>
                    <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                    <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                    <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                    <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                    <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                    <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                    <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                    <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                    <td className="border border-slate-300 p-2 bg-slate-100 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                    <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable={row.sub} suppressContentEditableWarning>{row.sub ? '0' : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CONTINUACIÃ“N SECCIÃ“N V (PÃ¡ginas 6 a 11) */}
          <div className="mt-8 space-y-12">
            {/* Pregunta 2 */}
            <div>
              <p className="text-sm font-semibold mb-2">2. Escriba por sexo, la cantidad de alumnas y alumnos indÃ­genas o hablantes de lengua indÃ­gena.</p>
              <table className="text-xs text-center border-collapse border border-slate-300 w-full max-w-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-300 p-2">Hombres</th>
                    <th className="border border-slate-300 p-2">Mujeres</th>
                    <th className="border border-slate-300 p-2 bg-slate-100">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                    <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                    <td className="border border-slate-300 p-2 bg-slate-100 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Pregunta 3 */}
            <div className="overflow-x-auto">
              <p className="text-sm font-semibold mb-2">3. Escriba el nÃºmero de alumnas y alumnos que proceden de escuela primaria general, indÃ­gena y/o comunitaria desglosÃ¡ndolo por grado y sexo.</p>
              <table className="w-full text-xs text-center border-collapse border border-slate-300 min-w-[600px]">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-300 p-2" rowSpan="2"></th>
                    <th className="border border-slate-300 p-2" rowSpan="2">Sexo</th>
                    <th className="border border-slate-300 p-2" colSpan="2">Primero</th>
                    <th className="border border-slate-300 p-2" rowSpan="2">Segundo</th>
                    <th className="border border-slate-300 p-2" rowSpan="2">Tercero</th>
                    <th className="border border-slate-300 p-2 bg-slate-100" rowSpan="2">Total</th>
                  </tr>
                  <tr>
                    <th className="border border-slate-300 p-2">Nvo. Ingreso</th>
                    <th className="border border-slate-300 p-2">Repetidor</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {tipo: 'Primaria General'},
                    {tipo: 'Primaria IndÃ­gena'},
                    {tipo: 'Primaria Comunitaria'}
                  ].map((row, i) => (
                    <React.Fragment key={i}>
                      <tr>
                        <td className="border border-slate-300 p-2 text-left font-semibold" rowSpan="2">{row.tipo}</td>
                        <td className="border border-slate-300 p-2">Hombres</td>
                        <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                        <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                        <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                        <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                        <td className="border border-slate-300 p-2 bg-slate-100 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-2">Mujeres</td>
                        <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                        <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                        <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                        <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                        <td className="border border-slate-300 p-2 bg-slate-100 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pregunta 4 y 5 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-sm font-semibold mb-2">4. Escriba el nombre de la lengua materna que hablan las alumnas y alumnos procedentes de escuela primaria indÃ­gena.</p>
                <div className="flex gap-2 items-center">
                  <span className="text-sm">Clave</span>
                  <input type="text" className="w-16 border border-slate-300 rounded px-2 py-1" />
                  <span className="text-sm ml-4">Lengua materna</span>
                  <input type="text" className="flex-1 border border-slate-300 rounded px-2 py-1 border-b-2" />
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold mb-2">5. Escriba la cantidad de alumnas y alumnos que son atendidos por la Unidad de Servicios de Apoyo a la EducaciÃ³n Regular (USAER), desglosÃ¡ndola por sexo.</p>
                <table className="text-xs text-center border-collapse border border-slate-300 w-full max-w-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="border border-slate-300 p-2">Hombres</th>
                      <th className="border border-slate-300 p-2">Mujeres</th>
                      <th className="border border-slate-300 p-2 bg-slate-100">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pregunta 6 */}
            <div className="overflow-x-auto">
              <p className="text-sm font-semibold mb-2">6. Escriba la cantidad de alumnas y alumnos con discapacidades, neurodivergencia u otras condiciones, desglosÃ¡ndolos por grado y sexo.</p>
              <table className="w-full text-xs text-center border-collapse border border-slate-300 min-w-[900px]">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-300 p-2" rowSpan="2">CondiciÃ³n del alumnado</th>
                    <th className="border border-slate-300 p-2" colSpan="3">Primero</th>
                    <th className="border border-slate-300 p-2" colSpan="3">Segundo</th>
                    <th className="border border-slate-300 p-2" colSpan="3">Tercero</th>
                    <th className="border border-slate-300 p-2 bg-slate-100" colSpan="3">Total</th>
                  </tr>
                  <tr>
                    <th className="border border-slate-300 p-1">Hom</th>
                    <th className="border border-slate-300 p-1">Muj</th>
                    <th className="border border-slate-300 p-1">Total</th>
                    <th className="border border-slate-300 p-1">Hom</th>
                    <th className="border border-slate-300 p-1">Muj</th>
                    <th className="border border-slate-300 p-1">Total</th>
                    <th className="border border-slate-300 p-1">Hom</th>
                    <th className="border border-slate-300 p-1">Muj</th>
                    <th className="border border-slate-300 p-1">Total</th>
                    <th className="border border-slate-300 p-1 bg-slate-100">Hom</th>
                    <th className="border border-slate-300 p-1 bg-slate-100">Muj</th>
                    <th className="border border-slate-300 p-1 bg-slate-100">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    'Ceguera', 'Baja visiÃ³n', 'Sordera', 'Hipoacusia', 'Sordoceguera',
                    'Discapacidad motriz', 'Discapacidad intelectual', 'Discapacidad psicosocial',
                    'Trastorno del espectro autista', 'Discapacidad mÃºltiple', 'TDAH*',
                    'Aptitudes sobresalientes', 'Otras condiciones', 'Total'
                  ].map((cond, i) => (
                    <tr key={i} className={cond === 'Total' ? 'font-bold bg-slate-50' : ''}>
                      <td className="border border-slate-300 p-2 text-left">{cond}</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td><td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td><td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td><td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td><td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td><td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td><td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td><td className="border border-slate-300 p-2 bg-slate-100 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td><td className="border border-slate-300 p-2 bg-slate-100 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pregunta 7 */}
            <div>
              <p className="text-sm font-semibold mb-2">7. Escriba el nÃºmero de alumnas y alumnos nacidos fuera de MÃ©xico, desglosÃ¡ndolos por sexo.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-center border-collapse border border-slate-300 max-w-lg">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="border border-slate-300 p-2 text-left">PaÃ­s o lugar</th>
                      <th className="border border-slate-300 p-2">Hombres</th>
                      <th className="border border-slate-300 p-2">Mujeres</th>
                      <th className="border border-slate-300 p-2 bg-slate-100">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['Estados Unidos', 'CanadÃ¡', 'CentroamÃ©rica y el Caribe', 'SudamÃ©rica', 'Ãfrica', 'Asia', 'Europa', 'OceanÃ­a', 'Total'].map((lugar, i) => (
                      <tr key={i} className={lugar === 'Total' ? 'font-bold bg-slate-50' : ''}>
                        <td className="border border-slate-300 p-2 text-left">{lugar}</td>
                        <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                        <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                        <td className="border border-slate-300 p-2 bg-slate-100 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pregunta 8 */}
            <div className="overflow-x-auto">
              <p className="text-sm font-semibold mb-2">8. Escriba el nÃºmero de alumnas y alumnos egresados de 3er. grado durante el ciclo escolar, desglosÃ¡ndolos por edad, sexo...</p>
              <table className="w-full text-xs text-center border-collapse border border-slate-300 min-w-[900px]">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-300 p-2">Edad</th>
                    <th className="border border-slate-300 p-2">Hombres</th>
                    <th className="border border-slate-300 p-2">Mujeres</th>
                    <th className="border border-slate-300 p-2 bg-slate-100">Total</th>
                    <th className="border border-slate-300 p-2">Hablantes IndÃ­genas</th>
                    <th className="border border-slate-300 p-2">Nacidos fuera MX</th>
                    <th className="border border-slate-300 p-2">Con discapacidad</th>
                    <th className="border border-slate-300 p-2">Con trastorno</th>
                    <th className="border border-slate-300 p-2">Apt. Sobresalientes</th>
                    <th className="border border-slate-300 p-2">Otras condiciones</th>
                  </tr>
                </thead>
                <tbody>
                  {['13 aÃ±os o menos', '14 aÃ±os', '15 aÃ±os', '16 aÃ±os', '17 aÃ±os', '18 aÃ±os y mÃ¡s', 'Total'].map((edad, i) => (
                    <tr key={i} className={edad === 'Total' ? 'font-bold bg-slate-50' : ''}>
                      <td className="border border-slate-300 p-2 text-left">{edad}</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pregunta 9 */}
            <div className="overflow-x-auto">
              <p className="text-sm font-semibold mb-2">9. Escriba el nÃºmero de alumnas y alumnos que reprobaron una o mÃ¡s asignaturas durante el ciclo escolar...</p>
              <table className="w-full text-xs text-center border-collapse border border-slate-300 min-w-[900px]">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-300 p-2">Grado</th>
                    <th className="border border-slate-300 p-2">Hombres</th>
                    <th className="border border-slate-300 p-2">Mujeres</th>
                    <th className="border border-slate-300 p-2 bg-slate-100">Total</th>
                    <th className="border border-slate-300 p-2">Hablantes IndÃ­genas</th>
                    <th className="border border-slate-300 p-2">Nacidos fuera MX</th>
                    <th className="border border-slate-300 p-2">Con discapacidad</th>
                    <th className="border border-slate-300 p-2">Con trastorno</th>
                    <th className="border border-slate-300 p-2">Apt. Sobresalientes</th>
                    <th className="border border-slate-300 p-2">Otras condiciones</th>
                  </tr>
                </thead>
                <tbody>
                  {['1o.', '2o.', '3o.', 'Total'].map((g, i) => (
                    <tr key={i} className={g === 'Total' ? 'font-bold bg-slate-50' : ''}>
                      <td className="border border-slate-300 p-2">{g}</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pregunta 10 */}
            <div className="overflow-x-auto">
              <p className="text-sm font-semibold mb-2">10. De las alumnas y alumnos reportados en la pregunta anterior, escriba cuÃ¡ntos se regularizaron (aprobaron todas las asignaturas) al 30 de septiembre...</p>
              <table className="w-full text-xs text-center border-collapse border border-slate-300 min-w-[900px]">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-300 p-2">Grado</th>
                    <th className="border border-slate-300 p-2">Hombres</th>
                    <th className="border border-slate-300 p-2">Mujeres</th>
                    <th className="border border-slate-300 p-2 bg-slate-100">Total</th>
                    <th className="border border-slate-300 p-2">Hablantes IndÃ­genas</th>
                    <th className="border border-slate-300 p-2">Nacidos fuera MX</th>
                    <th className="border border-slate-300 p-2">Con discapacidad</th>
                    <th className="border border-slate-300 p-2">Con trastorno</th>
                    <th className="border border-slate-300 p-2">Apt. Sobresalientes</th>
                    <th className="border border-slate-300 p-2">Otras condiciones</th>
                  </tr>
                </thead>
                <tbody>
                  {['1o.', '2o.', '3o.', 'Total'].map((g, i) => (
                    <tr key={i} className={g === 'Total' ? 'font-bold bg-slate-50' : ''}>
                      <td className="border border-slate-300 p-2">{g}</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pregunta 11 y 12 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-sm font-semibold mb-2">11. De las alumnas y alumnos reportados en la pregunta 9, escriba la cantidad de ellos que estÃ¡n inscritos en el presente ciclo escolar y continÃºan como irregulares (adeudan asignaturas)...</p>
                <table className="w-full text-xs text-center border-collapse border border-slate-300">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="border border-slate-300 p-2" colSpan="2">SEGUNDO</th>
                      <th className="border border-slate-300 p-2" colSpan="2">TERCERO</th>
                      <th className="border border-slate-300 p-2 bg-slate-100" rowSpan="2">TOTAL</th>
                    </tr>
                    <tr>
                      <th className="border border-slate-300 p-2">Hombres</th>
                      <th className="border border-slate-300 p-2">Mujeres</th>
                      <th className="border border-slate-300 p-2">Hombres</th>
                      <th className="border border-slate-300 p-2">Mujeres</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div>
                <p className="text-sm font-semibold mb-2">12. Escriba, por grado, el nÃºmero de directivos con grupo y docentes.</p>
                <table className="w-full text-xs text-center border-collapse border border-slate-300">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="border border-slate-300 p-2">Primero</th>
                      <th className="border border-slate-300 p-2">Segundo</th>
                      <th className="border border-slate-300 p-2">Tercero</th>
                      <th className="border border-slate-300 p-2">MÃ¡s de un grado</th>
                      <th className="border border-slate-300 p-2 bg-slate-100">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-xs text-slate-500 mt-2 italic">*Ãšnicamente para Telesecundarias.</p>
              </div>
            </div>

            {/* Pregunta 13 */}
            <div>
              <p className="text-sm font-semibold mb-2">13. Escriba el nÃºmero de alumnas y alumnos afromexicanos o afrodescendientes por autoadscripciÃ³n de los padres...</p>
              <table className="w-full max-w-xs text-xs text-center border-collapse border border-slate-300">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-300 p-2">Hombres</th>
                    <th className="border border-slate-300 p-2">Mujeres</th>
                    <th className="border border-slate-300 p-2 bg-slate-100">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                    <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                    <td className="border border-slate-300 p-2 bg-slate-100 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Pregunta 14 */}
            <div>
              <p className="text-sm font-semibold mb-2">14. Escriba el nÃºmero de alumnas y alumnos, segÃºn su lugar de residencia y desglÃ³selos por sexo.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl">
                <table className="w-full text-xs text-center border-collapse border border-slate-300">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="border border-slate-300 p-2 text-left">Estado</th>
                      <th className="border border-slate-300 p-2">Hombres</th>
                      <th className="border border-slate-300 p-2">Mujeres</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Coahuila', 'Colima', 'Chiapas', 'Chihuahua', 'Ciudad de MÃ©xico', 'Durango', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'MÃ©xico', 'MichoacÃ¡n'].map((estado, i) => (
                      <tr key={i}>
                        <td className="border border-slate-300 p-2 text-left">{estado}</td>
                        <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                        <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <table className="w-full text-xs text-center border-collapse border border-slate-300">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="border border-slate-300 p-2 text-left">Estado</th>
                      <th className="border border-slate-300 p-2">Hombres</th>
                      <th className="border border-slate-300 p-2">Mujeres</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['Morelos', 'Nayarit', 'Nuevo LeÃ³n', 'Oaxaca', 'Puebla', 'QuerÃ©taro', 'Quintana Roo', 'San Luis PotosÃ­', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'YucatÃ¡n', 'Zacatecas', 'Fuera de MÃ©xico'].map((estado, i) => (
                      <tr key={i}>
                        <td className="border border-slate-300 p-2 text-left">{estado}</td>
                        <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                        <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      </tr>
                    ))}
                    <tr className="font-bold bg-slate-50">
                      <td className="border border-slate-300 p-2 text-left">Total</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                      <td className="border border-slate-300 p-2 outline-none focus:bg-emerald-100 cursor-text hover:bg-slate-100 data-cell" contentEditable suppressContentEditableWarning>0</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </section>

      </div>
    </div>
  ), [shiftFilter, isSaving]);
}
