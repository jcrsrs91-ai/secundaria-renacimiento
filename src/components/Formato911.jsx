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
  
  const calculosV1 = useMemo(() => {
    // Inicializar estructura V.1
    const v1 = {
      '1': { NvoHombres: Array(8).fill(0), RepHombres: Array(8).fill(0), NvoMujeres: Array(8).fill(0), RepMujeres: Array(8).fill(0), grupos: new Set() },
      '2': { NvoHombres: Array(8).fill(0), RepHombres: Array(8).fill(0), NvoMujeres: Array(8).fill(0), RepMujeres: Array(8).fill(0), grupos: new Set() },
      '3': { NvoHombres: Array(8).fill(0), RepHombres: Array(8).fill(0), NvoMujeres: Array(8).fill(0), RepMujeres: Array(8).fill(0), grupos: new Set() }
    };

    activos.forEach(a => {
      // Calcular edad al 1 de septiembre de 2026
      let edadIndex = -1;
      if (a.fechaNacimiento) {
        const fn = new Date(a.fechaNacimiento + 'T12:00:00Z');
        const sep1 = new Date('2026-09-01T12:00:00Z');
        let edad = sep1.getFullYear() - fn.getFullYear();
        const m = sep1.getMonth() - fn.getMonth();
        if (m < 0 || (m === 0 && sep1.getDate() < fn.getDate())) {
          edad--;
        }
        
        if (edad < 12) edadIndex = 0;
        else if (edad === 12) edadIndex = 1;
        else if (edad === 13) edadIndex = 2;
        else if (edad === 14) edadIndex = 3;
        else if (edad === 15) edadIndex = 4;
        else if (edad === 16) edadIndex = 5;
        else if (edad === 17) edadIndex = 6;
        else edadIndex = 7;
      }

      const g = a.grado === '1er Grado' ? '1' : a.grado === '2do Grado' ? '2' : '3';
      const isRep = a.repetidor === 'SÍ';
      const isHombre = a.genero === 'Hombre';

      if (a.grupo) v1[g].grupos.add(a.grupo);

      if (edadIndex !== -1) {
        if (isHombre && !isRep) v1[g].NvoHombres[edadIndex]++;
        if (isHombre && isRep) v1[g].RepHombres[edadIndex]++;
        if (!isHombre && !isRep) v1[g].NvoMujeres[edadIndex]++;
        if (!isHombre && isRep) v1[g].RepMujeres[edadIndex]++;
      }
    });

    return v1;
  }, [activos]);

  
  const TableGrid = useMemo(() => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <FileText className="w-7 h-7 text-emerald-600" />
            Estadística 911 (Secundaria 911.5)
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
                    <th className="border border-slate-300 p-2">Hablantes Indígenas</th>
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
                    <th className="border border-slate-300 p-2">Hablantes Indígenas</th>
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
                    <th className="border border-slate-300 p-2" colSpan="2">Otro país</th>
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
            <p className="text-sm font-semibold mb-2">2. De las alumnas y alumnos provenientes de escuelas de otro país reportados en la pregunta anterior, desglóselos segíºn el país o lugar y sexo.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-center border-collapse border border-slate-300 max-w-2xl">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-300 p-2 text-left">País o lugar</th>
                    <th className="border border-slate-300 p-2">Hombres</th>
                    <th className="border border-slate-300 p-2">Mujeres</th>
                    <th className="border border-slate-300 p-2 bg-slate-100">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {['Estados Unidos', 'Canadá', 'Centroamérica y el Caribe', 'Sudamérica', 'ífrica', 'Asia', 'Europa', 'Oceanía', 'Total'].map((lugar, i) => (
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
                    <th className="border border-slate-300 p-2">Hablantes Indígenas</th>
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
            <p className="text-sm font-semibold mb-2">2. Escriba por sexo, el níºmero de alumnas y alumnos con beca reportados en la pregunta anterior, y desglóselos segíºn el origen de la beca.</p>
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
            <p className="text-sm font-semibold mb-2">1. Escriba por sexo el níºmero de alumnos que no concluyeron el ciclo escolar en esta escuela.</p>
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
            <p className="text-sm font-semibold mb-2">2. Escriba por sexo, el níºmero de alumnos reportados en la pregunta anterior, segíºn el motivo principal por el que no concluyeron el ciclo escolar. (Registre a cada alumno en un solo motivo).</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-center border-collapse border border-slate-300 max-w-4xl">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-300 p-2 text-left">Motivo por el que no concluyó el ciclo escolar</th>
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
                    'Desinterés/falta de motivación',
                    'Desplazamiento forzado o crisis humanitaria',
                    'Desvinculación de la familia con la escuela',
                    'Distancia o dificultad para llegar a la escuela',
                    'Embarazo o unión conyugal temprana',
                    'Enfermedad o incapacidad sin apoyo suficiente',
                    'Falta de recursos para transporte, uniforme, materiales o alimentación',
                    'Falta de tiempo para brindar atención diferenciada',
                    'Malas condiciones de las instalaciones escolares',
                    'Migración del alumno o de la familia',
                    'Necesidad de trabajar para apoyar la economía familiar',
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
                  <th className="border border-slate-300 p-2">12 años</th>
                  <th className="border border-slate-300 p-2">13 años</th>
                  <th className="border border-slate-300 p-2">14 años</th>
                  <th className="border border-slate-300 p-2">15 años</th>
                  <th className="border border-slate-300 p-2">16 años</th>
                  <th className="border border-slate-300 p-2">17 años</th>
                  <th className="border border-slate-300 p-2">18 o más</th>
                  <th className="border border-slate-300 p-2 bg-slate-100">Total</th>
                  <th className="border border-slate-300 p-2">Grupos</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "1° Hombres Nvo.", g: '1' }, { label: "1° Hombres Rep.", g: '1' },
                  { label: "1° Mujeres Nvo.", g: '1' }, { label: "1° Mujeres Rep.", g: '1' },
                  { label: "Subtotal 1°", g: '1', sub: true },
                  { label: "2° Hombres Nvo.", g: '2' }, { label: "2° Hombres Rep.", g: '2' },
                  { label: "2° Mujeres Nvo.", g: '2' }, { label: "2° Mujeres Rep.", g: '2' },
                  { label: "Subtotal 2°", g: '2', sub: true },
                  { label: "3° Hombres Nvo.", g: '3' }, { label: "3° Hombres Rep.", g: '3' },
                  { label: "3° Mujeres Nvo.", g: '3' }, { label: "3° Mujeres Rep.", g: '3' },
                  { label: "Subtotal 3°", g: '3', sub: true },
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

          {/* CONTINUACIí“N SECCIí“N V (Páginas 6 a 11) */}
          <div className="mt-8 space-y-12">
            {/* Pregunta 2 */}
            <div>
              <p className="text-sm font-semibold mb-2">2. Escriba por sexo, la cantidad de alumnas y alumnos indígenas o hablantes de lengua indígena.</p>
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
              <p className="text-sm font-semibold mb-2">3. Escriba el níºmero de alumnas y alumnos que proceden de escuela primaria general, indígena y/o comunitaria desglosándolo por grado y sexo.</p>
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
                    {tipo: 'Primaria Indígena'},
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
                <p className="text-sm font-semibold mb-2">4. Escriba el nombre de la lengua materna que hablan las alumnas y alumnos procedentes de escuela primaria indígena.</p>
                <div className="flex gap-2 items-center">
                  <span className="text-sm">Clave</span>
                  <input type="text" className="w-16 border border-slate-300 rounded px-2 py-1" />
                  <span className="text-sm ml-4">Lengua materna</span>
                  <input type="text" className="flex-1 border border-slate-300 rounded px-2 py-1 border-b-2" />
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold mb-2">5. Escriba la cantidad de alumnas y alumnos que son atendidos por la Unidad de Servicios de Apoyo a la Educación Regular (USAER), desglosándola por sexo.</p>
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
              <p className="text-sm font-semibold mb-2">6. Escriba la cantidad de alumnas y alumnos con discapacidades, neurodivergencia u otras condiciones, desglosándolos por grado y sexo.</p>
              <table className="w-full text-xs text-center border-collapse border border-slate-300 min-w-[900px]">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-300 p-2" rowSpan="2">Condición del alumnado</th>
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
                    'Ceguera', 'Baja visión', 'Sordera', 'Hipoacusia', 'Sordoceguera',
                    'Discapacidad motriz', 'Discapacidad intelectual', 'Discapacidad psicosocial',
                    'Trastorno del espectro autista', 'Discapacidad míºltiple', 'TDAH*',
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
              <p className="text-sm font-semibold mb-2">7. Escriba el níºmero de alumnas y alumnos nacidos fuera de México, desglosándolos por sexo.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-center border-collapse border border-slate-300 max-w-lg">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="border border-slate-300 p-2 text-left">País o lugar</th>
                      <th className="border border-slate-300 p-2">Hombres</th>
                      <th className="border border-slate-300 p-2">Mujeres</th>
                      <th className="border border-slate-300 p-2 bg-slate-100">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['Estados Unidos', 'Canadá', 'Centroamérica y el Caribe', 'Sudamérica', 'ífrica', 'Asia', 'Europa', 'Oceanía', 'Total'].map((lugar, i) => (
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
              <p className="text-sm font-semibold mb-2">8. Escriba el níºmero de alumnas y alumnos egresados de 3er. grado durante el ciclo escolar, desglosándolos por edad, sexo...</p>
              <table className="w-full text-xs text-center border-collapse border border-slate-300 min-w-[900px]">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-300 p-2">Edad</th>
                    <th className="border border-slate-300 p-2">Hombres</th>
                    <th className="border border-slate-300 p-2">Mujeres</th>
                    <th className="border border-slate-300 p-2 bg-slate-100">Total</th>
                    <th className="border border-slate-300 p-2">Hablantes Indígenas</th>
                    <th className="border border-slate-300 p-2">Nacidos fuera MX</th>
                    <th className="border border-slate-300 p-2">Con discapacidad</th>
                    <th className="border border-slate-300 p-2">Con trastorno</th>
                    <th className="border border-slate-300 p-2">Apt. Sobresalientes</th>
                    <th className="border border-slate-300 p-2">Otras condiciones</th>
                  </tr>
                </thead>
                <tbody>
                  {['13 años o menos', '14 años', '15 años', '16 años', '17 años', '18 años y más', 'Total'].map((edad, i) => (
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
              <p className="text-sm font-semibold mb-2">9. Escriba el níºmero de alumnas y alumnos que reprobaron una o más asignaturas durante el ciclo escolar...</p>
              <table className="w-full text-xs text-center border-collapse border border-slate-300 min-w-[900px]">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-300 p-2">Grado</th>
                    <th className="border border-slate-300 p-2">Hombres</th>
                    <th className="border border-slate-300 p-2">Mujeres</th>
                    <th className="border border-slate-300 p-2 bg-slate-100">Total</th>
                    <th className="border border-slate-300 p-2">Hablantes Indígenas</th>
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
              <p className="text-sm font-semibold mb-2">10. De las alumnas y alumnos reportados en la pregunta anterior, escriba cuántos se regularizaron (aprobaron todas las asignaturas) al 30 de septiembre...</p>
              <table className="w-full text-xs text-center border-collapse border border-slate-300 min-w-[900px]">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-300 p-2">Grado</th>
                    <th className="border border-slate-300 p-2">Hombres</th>
                    <th className="border border-slate-300 p-2">Mujeres</th>
                    <th className="border border-slate-300 p-2 bg-slate-100">Total</th>
                    <th className="border border-slate-300 p-2">Hablantes Indígenas</th>
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
                <p className="text-sm font-semibold mb-2">11. De las alumnas y alumnos reportados en la pregunta 9, escriba la cantidad de ellos que están inscritos en el presente ciclo escolar y continíºan como irregulares (adeudan asignaturas)...</p>
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
                <p className="text-sm font-semibold mb-2">12. Escriba, por grado, el níºmero de directivos con grupo y docentes.</p>
                <table className="w-full text-xs text-center border-collapse border border-slate-300">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="border border-slate-300 p-2">Primero</th>
                      <th className="border border-slate-300 p-2">Segundo</th>
                      <th className="border border-slate-300 p-2">Tercero</th>
                      <th className="border border-slate-300 p-2">Más de un grado</th>
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
                <p className="text-xs text-slate-500 mt-2 italic">*íšnicamente para Telesecundarias.</p>
              </div>
            </div>

            {/* Pregunta 13 */}
            <div>
              <p className="text-sm font-semibold mb-2">13. Escriba el níºmero de alumnas y alumnos afromexicanos o afrodescendientes por autoadscripción de los padres...</p>
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
              <p className="text-sm font-semibold mb-2">14. Escriba el níºmero de alumnas y alumnos, segíºn su lugar de residencia y desglóselos por sexo.</p>
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
                    {['Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Coahuila', 'Colima', 'Chiapas', 'Chihuahua', 'Ciudad de México', 'Durango', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'México', 'Michoacán'].map((estado, i) => (
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
                    {['Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas', 'Fuera de México'].map((estado, i) => (
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
  ), [shiftFilter]); return TableGrid;
}
