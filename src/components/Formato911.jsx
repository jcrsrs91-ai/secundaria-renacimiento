import React from 'react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';
import { FileText, Download, Filter, AlertTriangle, Info } from 'lucide-react';

export default function Formato911({ rawActivos, globalShiftFilter, materiasPorGrado }) {
  
  const shiftFilter = globalShiftFilter === 'Todos' ? 'Ambos' : globalShiftFilter;
  const [isSaving, setIsSaving] = useState(false);
  const containerRef = useRef(null);

  
  const [historicoData, setHistoricoData] = useState(null);

  useEffect(() => {
    const fetchHistorico = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'configuracion', 'formato911_historico'));
        if (docSnap.exists()) {
          
          const d = docSnap.data();
          if (d.tablesDataJson) {
            setHistoricoData(JSON.parse(d.tablesDataJson));
          } else {
            setHistoricoData(d.tablesData);
          }

        }
      } catch (err) {
        console.error("Error loading 911 data", err);
      }
    };
    fetchHistorico();
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
      await setDoc(doc(db, 'configuracion', 'formato911_historico'), { tablesDataJson: JSON.stringify(data), updatedAt: new Date().toISOString() });
      setHistoricoData(data);
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
    let filtrados = rawActivos.filter(a => (a.status || 'Activo') === 'Activo');
    if (shiftFilter !== 'Ambos') {
      filtrados = filtrados.filter(a => a.turno === shiftFilter);
    }
    return filtrados;
  }, [rawActivos, shiftFilter]);

  const egresadosList = useMemo(() => {
    if (!rawActivos) return [];
    let filtrados = rawActivos.filter(a => a.status === 'Egresado');
    if (shiftFilter !== 'Ambos') {
      filtrados = filtrados.filter(a => a.turno === shiftFilter);
    }
    return filtrados;
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
      } else {
        // Fallback estimado si no hay fecha de nacimiento para que cuadre la 911
        if (a.grado?.includes('1er') || a.grado === '1ero' || a.grado === '1') edadIndex = 1; // 12
          else if (a.grado?.includes('2do') || a.grado === '2') edadIndex = 2; // 13
        else edadIndex = 3; // 14
      }

      let g = '1';
        if (a.grado?.includes('2do') || a.grado === '2') g = '2';
        if (a.grado?.includes('3er') || a.grado?.includes('3ro') || a.grado === '3ero' || a.grado === '3') g = '3';

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

  const calculosV2 = useMemo(() => {
    let h = 0, m = 0;
    activos.forEach(a => {
      if (a.lenguaIndigena === 'SÍ' || a.lenguaIndigena === 'SÃ ') {
        if (a.genero === 'Hombre') h++; else m++;
      }
    });
    return { h, m, t: h + m };
  }, [activos]);

  const calculosV5 = useMemo(() => {
    let h = 0, m = 0;
    activos.forEach(a => {
      if (a.usaer === 'SÍ' || a.usaer === 'SÃ ') {
        if (a.genero === 'Hombre') h++; else m++;
      }
    });
    return { h, m, t: h + m };
  }, [activos]);

  const calculosV7 = useMemo(() => {
    let h = 0, m = 0;
    activos.forEach(a => {
      if (a.nacionalidad === 'EXTRANJERA') {
        if (a.genero === 'Hombre') h++; else m++;
      }
    });
    return { h, m, t: h + m };
  }, [activos]);



  const calculosReprobados = useMemo(() => {
    // V9: Reprobaron durante el ciclo escolar
    // V10: Se regularizaron
    // V11: Continúan como irregulares
    const rows9 = Array(3).fill(null).map(() => Array(9).fill(0));
    const rows10 = Array(3).fill(null).map(() => Array(9).fill(0));
    const rows11 = Array(3).fill(null).map(() => Array(9).fill(0));

    // Combine all students that need to be checked
    // Current Activos (1er, 2do, 3er) + Egresados
    if (!materiasPorGrado) return { rows9, rows10, rows11 };
    
    // We check ALL rawActivos, but filter them manually
    rawActivos.forEach(a => {
      // Must match shiftFilter if not Ambos
      if (shiftFilter !== 'Ambos' && a.turno !== shiftFilter) return;
      if (a.status !== 'Activo' && a.status !== 'Egresado') return;

      let targetGrade = null;
      let rowIndex = -1;

      // 1o row = Current 2do, or repeaters of 1er
      if ((a.grado === '2do Grado' || a.grado?.includes('2do Grado')) || 
          (a.grado?.includes('1er') && a.repetidor === 'SÍ')) {
        targetGrade = '1er Grado';
        rowIndex = 0;
      }
      // 2o row = Current 3er, or repeaters of 2do
      else if ((a.grado === '3er Grado' || a.grado?.includes('3er Grado')) || 
               (a.grado?.includes('2do') && a.repetidor === 'SÍ')) {
        targetGrade = '2do Grado';
        rowIndex = 1;
      }
      // 3o row = Egresados, or repeaters of 3er
      else if ((a.status === 'Egresado') || 
               (a.grado?.includes('3er') && a.repetidor === 'SÍ')) {
        targetGrade = '3er Grado';
        rowIndex = 2;
      }

      if (rowIndex !== -1 && a.calificaciones) {
         const materias = materiasPorGrado[targetGrade];
         if (materias) {
            let numFailed = 0;
            let numReg = 0;

            for (let mat of materias) {
              const t1 = parseFloat(a.calificaciones?.['t1']?.[mat.id]);
              const t2 = parseFloat(a.calificaciones?.['t2']?.[mat.id]);
              const t3 = parseFloat(a.calificaciones?.['t3']?.[mat.id]);
              
              const extraScore = a.regularizacion?.[mat.id]?.calificacion;
              const hasReg = extraScore !== undefined && parseFloat(extraScore) >= 6;

              if (!isNaN(t1) && !isNaN(t2) && !isNaN(t3)) {
                 const avg = (t1 + t2 + t3) / 3;
                 // It only counts as failing if average is less than 6
                 if (avg < 6) {
                    numFailed++;
                    if (hasReg) numReg++;
                 }
              }
            }

            if (numFailed > 0) {
               const isHombre = a.genero === 'Hombre';
               const isIndigena = a.lenguaIndigena === 'SÍ' || a.lenguaIndigena === 'SÃ ';
               const isExtranjero = a.nacionalidad === 'EXTRANJERA';
               
               let colDiscapacidad = -1;
               if (a.discapacidad && a.discapacidad !== 'Ninguna' && a.discapacidad !== 'NO') {
                 let d = a.discapacidad;
                 let esTrastorno = d.includes('Trastorno') || d.includes('TDAH');
                 let esSobresaliente = d.includes('Aptitudes sobresalientes');
                 let esOtra = d.includes('Otras');

                 if (!esTrastorno && !esSobresaliente && !esOtra) colDiscapacidad = 4; // Discapacidad
                 else if (esTrastorno) colDiscapacidad = 5; // Trastorno
                 else if (esSobresaliente) colDiscapacidad = 6; // Aptitudes
                 else if (esOtra) colDiscapacidad = 7; // Otras
               }

               const addToRows = (rowsArray) => {
                  if (isHombre) rowsArray[rowIndex][0]++;
                  else rowsArray[rowIndex][1]++;
                  rowsArray[rowIndex][2]++; // Total
                  if (isIndigena) rowsArray[rowIndex][3]++;
                  if (isExtranjero) rowsArray[rowIndex][4]++; // Wait! Col 4 is Extranjero. But what about Discapacidad? 
                  // Let's check table cols: Hombres, Mujeres, Total, Indígenas, Extranjeros, Discapacidad, Trastorno, Apt, Otras
                  // 0: Hombres, 1: Mujeres, 2: Total, 3: Indigena, 4: Extranjero, 5: Discapacidad, 6: Trastorno, 7: Apt, 8: Otras.
               };

               // Oops! Let's redefine colDiscapacidad correctly:
               colDiscapacidad = -1;
               if (a.discapacidad && a.discapacidad !== 'Ninguna' && a.discapacidad !== 'NO') {
                 let d = a.discapacidad;
                 let esTrastorno = d.includes('Trastorno') || d.includes('TDAH');
                 let esSobresaliente = d.includes('Aptitudes sobresalientes');
                 let esOtra = d.includes('Otras');

                 if (!esTrastorno && !esSobresaliente && !esOtra) colDiscapacidad = 5;
                 else if (esTrastorno) colDiscapacidad = 6;
                 else if (esSobresaliente) colDiscapacidad = 7;
                 else if (esOtra) colDiscapacidad = 8;
               }

               const addToRowsCorrected = (rowsArray) => {
                  if (isHombre) rowsArray[rowIndex][0]++;
                  else rowsArray[rowIndex][1]++;
                  rowsArray[rowIndex][2]++;
                  if (isIndigena) rowsArray[rowIndex][3]++;
                  if (isExtranjero) rowsArray[rowIndex][4]++;
                  if (colDiscapacidad !== -1) rowsArray[rowIndex][colDiscapacidad]++;
               };

               // Add to Pregunta 9
               addToRowsCorrected(rows9);

               if (numReg === numFailed) {
                  // Passed ALL failed subjects => Pregunta 10
                  addToRowsCorrected(rows10);
               } else {
                  // Continues irregular => Pregunta 11
                  addToRowsCorrected(rows11);
               }
            }
         }
      }
    });

    return { rows9, rows10, rows11 };
  }, [rawActivos, shiftFilter, materiasPorGrado]);

  const calculosV8 = useMemo(() => {
    const rows = Array(6).fill(null).map(() => Array(9).fill(0));

    egresadosList.forEach(a => {
      let edadIndex = -1;
      if (a.fechaNacimiento) {
        const fn = new Date(a.fechaNacimiento + 'T12:00:00Z');
        const sep1 = new Date('2026-09-01T12:00:00Z');
        let edad = sep1.getFullYear() - fn.getFullYear();
        const m = sep1.getMonth() - fn.getMonth();
        if (m < 0 || (m === 0 && sep1.getDate() < fn.getDate())) {
          edad--;
        }
        
        if (edad <= 13) edadIndex = 0;
        else if (edad === 14) edadIndex = 1;
        else if (edad === 15) edadIndex = 2;
        else if (edad === 16) edadIndex = 3;
        else if (edad === 17) edadIndex = 4;
        else edadIndex = 5; // 18 o más
      } else {
        edadIndex = 1; // Fallback to 14
      }

      const isHombre = a.genero === 'Hombre';
      
      if (isHombre) rows[edadIndex][0]++;
      else rows[edadIndex][1]++;
      rows[edadIndex][2]++;

      if (a.lenguaIndigena === 'SÍ' || a.lenguaIndigena === 'SÃ ') rows[edadIndex][3]++;
      if (a.nacionalidad === 'EXTRANJERA') rows[edadIndex][4]++;

      if (a.discapacidad && a.discapacidad !== 'Ninguna' && a.discapacidad !== 'NO') {
        let d = a.discapacidad;
        let esTrastorno = d.includes('Trastorno') || d.includes('TDAH');
        let esSobresaliente = d.includes('Aptitudes sobresalientes');
        let esOtra = d.includes('Otras');

        if (!esTrastorno && !esSobresaliente && !esOtra) rows[edadIndex][5]++;
        else if (esTrastorno) rows[edadIndex][6]++;
        else if (esSobresaliente) rows[edadIndex][7]++;
        else if (esOtra) rows[edadIndex][8]++;
      }
    });

    return rows;
  }, [egresadosList]);

  const calculosV6 = useMemo(() => {
    const keys = [
      'Ceguera', 'Baja visión', 'Sordera', 'Hipoacusia', 'Sordoceguera',
      'Discapacidad motriz', 'Discapacidad intelectual', 'Discapacidad psicosocial',
      'Trastorno del espectro autista', 'Discapacidad múltiple', 'TDAH*',
      'Aptitudes sobresalientes', 'Otras condiciones'
    ];
    const map = {};
    keys.forEach(k => {
      map[k] = { '1': { h: 0, m: 0 }, '2': { h: 0, m: 0 }, '3': { h: 0, m: 0 } };
    });

    activos.forEach(a => {
      let d = a.discapacidad;
      if (!d || d === 'Ninguna' || d === 'NO') return;
      
      let k = null;
      if (d === 'Ceguera') k = 'Ceguera';
      if (d.includes('Baja')) k = 'Baja visión';
      if (d === 'Sordera') k = 'Sordera';
      if (d === 'Hipoacusia') k = 'Hipoacusia';
      if (d === 'Sordoceguera') k = 'Sordoceguera';
      if (d === 'Discapacidad motriz') k = 'Discapacidad motriz';
      if (d === 'Discapacidad intelectual' || d === 'SÍ' || d === 'SÃ ') k = 'Discapacidad intelectual';
      if (d === 'Discapacidad psicosocial') k = 'Discapacidad psicosocial';
      if (d.includes('TEA') || d.includes('Autista')) k = 'Trastorno del espectro autista';
      if (d.includes('TDAH') || d.includes('Déficit')) k = 'TDAH*';
      if (d.includes('Aptitudes')) k = 'Aptitudes sobresalientes';
      if (d.includes('múltiple') || d.includes('mÃºltiple') || d.includes('mǧltiple')) k = 'Discapacidad múltiple';

      if (!k) k = 'Otras condiciones';

      let g = '1';
      if (a.grado?.includes('2do') || a.grado === '2') g = '2';
      if (a.grado?.includes('3er') || a.grado?.includes('3ro') || a.grado === '3ero' || a.grado === '3') g = '3';

      if (a.genero === 'Hombre') map[k][g].h++;
      else map[k][g].m++;
    });

    return { map, keys };
  }, [activos]);


  
  const TableGrid = useMemo(() => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6" ref={containerRef}>
      
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
            <p className="text-sm font-semibold mb-2">2. De las alumnas y alumnos provenientes de escuelas de otro país reportados en la pregunta anterior, desglóselos según el país o lugar y sexo.</p>
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
            <p className="text-sm font-semibold mb-2">2. Escriba por sexo, el número de alumnas y alumnos con beca reportados en la pregunta anterior, y desglóselos según el origen de la beca.</p>
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
            <p className="text-sm font-semibold mb-2">1. Escriba por sexo el número de alumnos que no concluyeron el ciclo escolar en esta escuela.</p>
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
            <p className="text-sm font-semibold mb-2">2. Escriba por sexo, el número de alumnos reportados en la pregunta anterior, según el motivo principal por el que no concluyeron el ciclo escolar. (Registre a cada alumno en un solo motivo).</p>
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
                    { label: "1° Hombres Nvo.", g: '1', key: 'NvoHombres' }, 
                    { label: "1° Hombres Rep.", g: '1', key: 'RepHombres' },
                    { label: "1° Mujeres Nvo.", g: '1', key: 'NvoMujeres' }, 
                    { label: "1° Mujeres Rep.", g: '1', key: 'RepMujeres' },
                    { label: "Subtotal 1°", g: '1', sub: true },
                    { label: "2° Hombres Nvo.", g: '2', key: 'NvoHombres' }, 
                    { label: "2° Hombres Rep.", g: '2', key: 'RepHombres' },
                    { label: "2° Mujeres Nvo.", g: '2', key: 'NvoMujeres' }, 
                    { label: "2° Mujeres Rep.", g: '2', key: 'RepMujeres' },
                    { label: "Subtotal 2°", g: '2', sub: true },
                    { label: "3° Hombres Nvo.", g: '3', key: 'NvoHombres' }, 
                    { label: "3° Hombres Rep.", g: '3', key: 'RepHombres' },
                    { label: "3° Mujeres Nvo.", g: '3', key: 'NvoMujeres' }, 
                    { label: "3° Mujeres Rep.", g: '3', key: 'RepMujeres' },
                    { label: "Subtotal 3°", g: '3', sub: true },
                    { label: "Total", sub: true, isGlobalTotal: true }
                  ].map((row, i) => {
                    const renderCells = () => {
                      if (row.isGlobalTotal) {
                         const totals = Array(8).fill(0);
                         let tGrupos = 0;
                         ['1','2','3'].forEach(g => {
                            tGrupos += calculosV1[g].grupos.size;
                            for (let idx=0; idx<8; idx++) {
                              totals[idx] += calculosV1[g].NvoHombres[idx] + calculosV1[g].RepHombres[idx] + calculosV1[g].NvoMujeres[idx] + calculosV1[g].RepMujeres[idx];
                            }
                         });
                         const grandTotal = totals.reduce((a,b)=>a+b,0);
                         return (
                           <React.Fragment>
                             {totals.map((v, idx) => <td key={idx} className="border border-slate-300 p-2 font-bold">{v}</td>)}
                             <td className="border border-slate-300 p-2 bg-slate-100 font-bold">{grandTotal}</td>
                             <td className="border border-slate-300 p-2 font-bold">{tGrupos}</td>
                           </React.Fragment>
                         )
                      }

                      if (row.sub) {
                        const subArr = Array(8).fill(0);
                        let sumTotal = 0;
                        for (let idx=0; idx<8; idx++) {
                          subArr[idx] = calculosV1[row.g].NvoHombres[idx] + calculosV1[row.g].RepHombres[idx] + calculosV1[row.g].NvoMujeres[idx] + calculosV1[row.g].RepMujeres[idx];
                          sumTotal += subArr[idx];
                        }
                        return (
                          <React.Fragment>
                            {subArr.map((v, idx) => <td key={idx} className="border border-slate-300 p-2 font-bold">{v}</td>)}
                            <td className="border border-slate-300 p-2 bg-slate-100 font-bold">{sumTotal}</td>
                            <td className="border border-slate-300 p-2 font-bold">{calculosV1[row.g].grupos.size}</td>
                          </React.Fragment>
                        )
                      }
                      
                      // Normal row
                      const arr = calculosV1[row.g][row.key];
                      const rowTotal = arr.reduce((a,b)=>a+b, 0);
                      return (
                        <React.Fragment>
                          {arr.map((v, idx) => <td key={idx} className="border border-slate-300 p-2">{v}</td>)}
                          <td className="border border-slate-300 p-2 bg-slate-100">{rowTotal}</td>
                          <td className="border border-slate-300 p-2 bg-slate-200"></td>
                        </React.Fragment>
                      )
                    };

                    return (
                      <tr key={i} className={row.sub ? 'font-bold bg-slate-50' : ''}>
                        <td className="border border-slate-300 p-2 text-left">{row.label}</td>
                        {renderCells()}
                      </tr>
                    );
                  })}
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
                    <td className="border border-slate-300 p-2 font-bold">{calculosV2.h}</td>
                    <td className="border border-slate-300 p-2 font-bold">{calculosV2.m}</td>
                    <td className="border border-slate-300 p-2 bg-slate-100 font-bold">{calculosV2.t}</td>
                  </tr>
</tbody>
              </table>
            </div>

            {/* Pregunta 3 */}
            <div className="overflow-x-auto">
              <p className="text-sm font-semibold mb-2">3. Escriba el número de alumnas y alumnos que proceden de escuela primaria general, indígena y/o comunitaria desglosándolo por grado y sexo.</p>
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
                    <td className="border border-slate-300 p-2 font-bold">{calculosV5.h}</td>
                    <td className="border border-slate-300 p-2 font-bold">{calculosV5.m}</td>
                    <td className="border border-slate-300 p-2 bg-slate-100 font-bold">{calculosV5.t}</td>
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

                  {calculosV6.keys.map((cond, i) => {
                    const d = calculosV6.map[cond];
                    const rowHom = d['1'].h + d['2'].h + d['3'].h;
                    const rowMuj = d['1'].m + d['2'].m + d['3'].m;
                    const rowTotal = rowHom + rowMuj;
                    return (
                      <tr key={i}>
                        <td className="border border-slate-300 p-2 text-left">{cond}</td>
                        <td className="border border-slate-300 p-2 font-bold">{d['1'].h}</td>
                        <td className="border border-slate-300 p-2 font-bold">{d['1'].m}</td>
                        <td className="border border-slate-300 p-2 bg-slate-50 font-bold">{d['1'].h + d['1'].m}</td>
                        <td className="border border-slate-300 p-2 font-bold">{d['2'].h}</td>
                        <td className="border border-slate-300 p-2 font-bold">{d['2'].m}</td>
                        <td className="border border-slate-300 p-2 bg-slate-50 font-bold">{d['2'].h + d['2'].m}</td>
                        <td className="border border-slate-300 p-2 font-bold">{d['3'].h}</td>
                        <td className="border border-slate-300 p-2 font-bold">{d['3'].m}</td>
                        <td className="border border-slate-300 p-2 bg-slate-50 font-bold">{d['3'].h + d['3'].m}</td>
                        <td className="border border-slate-300 p-2 bg-slate-100 font-bold">{rowHom}</td>
                        <td className="border border-slate-300 p-2 bg-slate-100 font-bold">{rowMuj}</td>
                        <td className="border border-slate-300 p-2 bg-slate-200 font-bold">{rowTotal}</td>
                      </tr>
                    );
                  })}
                  <tr className="font-bold bg-slate-50">
                    <td className="border border-slate-300 p-2 text-left">Total</td>
                    <td className="border border-slate-300 p-2">{calculosV6.keys.reduce((s, k) => s + calculosV6.map[k]['1'].h, 0)}</td>
                    <td className="border border-slate-300 p-2">{calculosV6.keys.reduce((s, k) => s + calculosV6.map[k]['1'].m, 0)}</td>
                    <td className="border border-slate-300 p-2 bg-slate-100">{calculosV6.keys.reduce((s, k) => s + calculosV6.map[k]['1'].h + calculosV6.map[k]['1'].m, 0)}</td>
                    <td className="border border-slate-300 p-2">{calculosV6.keys.reduce((s, k) => s + calculosV6.map[k]['2'].h, 0)}</td>
                    <td className="border border-slate-300 p-2">{calculosV6.keys.reduce((s, k) => s + calculosV6.map[k]['2'].m, 0)}</td>
                    <td className="border border-slate-300 p-2 bg-slate-100">{calculosV6.keys.reduce((s, k) => s + calculosV6.map[k]['2'].h + calculosV6.map[k]['2'].m, 0)}</td>
                    <td className="border border-slate-300 p-2">{calculosV6.keys.reduce((s, k) => s + calculosV6.map[k]['3'].h, 0)}</td>
                    <td className="border border-slate-300 p-2">{calculosV6.keys.reduce((s, k) => s + calculosV6.map[k]['3'].m, 0)}</td>
                    <td className="border border-slate-300 p-2 bg-slate-100">{calculosV6.keys.reduce((s, k) => s + calculosV6.map[k]['3'].h + calculosV6.map[k]['3'].m, 0)}</td>
                    <td className="border border-slate-300 p-2 bg-slate-200">{calculosV6.keys.reduce((s, k) => s + calculosV6.map[k]['1'].h + calculosV6.map[k]['2'].h + calculosV6.map[k]['3'].h, 0)}</td>
                    <td className="border border-slate-300 p-2 bg-slate-200">{calculosV6.keys.reduce((s, k) => s + calculosV6.map[k]['1'].m + calculosV6.map[k]['2'].m + calculosV6.map[k]['3'].m, 0)}</td>
                    <td className="border border-slate-300 p-2 bg-slate-300">{calculosV6.keys.reduce((s, k) => { const x=calculosV6.map[k]; return s+x['1'].h+x['1'].m+x['2'].h+x['2'].m+x['3'].h+x['3'].m; }, 0)}</td>
                  </tr>
</tbody>
              </table>
            </div>

            {/* Pregunta 7 */}
            <div>
              <p className="text-sm font-semibold mb-2">7. Escriba el número de alumnas y alumnos nacidos fuera de México, desglosándolos por sexo.</p>
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
              <p className="text-sm font-semibold mb-2">8. Escriba el número de alumnas y alumnos egresados de 3er. grado durante el ciclo escolar, desglosándolos por edad, sexo...</p>
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
{['13 años o menos', '14 años', '15 años', '16 años', '17 años', '18 años y más', 'Total'].map((edad, i) => {
                    const rowData = i < 6 ? calculosV8[i] : calculosV8.reduce((acc, row) => acc.map((v, j) => v + row[j]), Array(9).fill(0));
                    return (
                    <tr key={i} className={edad === 'Total' ? 'font-bold bg-emerald-50 text-emerald-900' : ''}>
                      <td className="border border-slate-300 p-2 text-left">{edad}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[0]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[1]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-200 font-bold">{rowData[2]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[3]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[4]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[5]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[6]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[7]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[8]}</td>
                    </tr>
                  )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pregunta 9 */}
            <div className="overflow-x-auto">
              <p className="text-sm font-semibold mb-2">9. Escriba el número de alumnas y alumnos que reprobaron una o más asignaturas durante el ciclo escolar...</p>
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
                  {['1o.', '2o.', '3o.', 'Total'].map((g, i) => {
                    const rowData = i < 3 ? calculosReprobados.rows9[i] : calculosReprobados.rows9.reduce((acc, row) => acc.map((v, j) => v + row[j]), Array(9).fill(0));
                    return (
                    <tr key={i} className={g === 'Total' ? 'font-bold bg-emerald-50 text-emerald-900' : ''}>
                      <td className="border border-slate-300 p-2">{g}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[0]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[1]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-200 font-bold">{rowData[2]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[3]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[4]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[5]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[6]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[7]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[8]}</td>
                    </tr>
                  )
                  })}
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
                  {['1o.', '2o.', '3o.', 'Total'].map((g, i) => {
                    const rowData = i < 3 ? calculosReprobados.rows10[i] : calculosReprobados.rows10.reduce((acc, row) => acc.map((v, j) => v + row[j]), Array(9).fill(0));
                    return (
                    <tr key={i} className={g === 'Total' ? 'font-bold bg-emerald-50 text-emerald-900' : ''}>
                      <td className="border border-slate-300 p-2">{g}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[0]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[1]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-200 font-bold">{rowData[2]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[3]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[4]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[5]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[6]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[7]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[8]}</td>
                    </tr>
                  )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pregunta 11 y 12 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-sm font-semibold mb-2">11. De las alumnas y alumnos reportados en la pregunta 9, escriba la cantidad de ellos que están inscritos en el presente ciclo escolar y continúan como irregulares (adeudan asignaturas)...</p>
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
                  {['1o.', '2o.', '3o.', 'Total'].map((g, i) => {
                    const rowData = i < 3 ? calculosReprobados.rows11[i] : calculosReprobados.rows11.reduce((acc, row) => acc.map((v, j) => v + row[j]), Array(9).fill(0));
                    return (
                    <tr key={i} className={g === 'Total' ? 'font-bold bg-emerald-50 text-emerald-900' : ''}>
                      <td className="border border-slate-300 p-2">{g}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[0]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[1]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-200 font-bold">{rowData[2]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[3]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[4]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[5]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[6]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[7]}</td>
                      <td className="border border-slate-300 p-2 bg-slate-100 font-medium">{rowData[8]}</td>
                    </tr>
                  )
                  })}
                  </tbody>
                </table>
              </div>
              
              <div>
                <p className="text-sm font-semibold mb-2">12. Escriba, por grado, el número de directivos con grupo y docentes.</p>
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
              <p className="text-sm font-semibold mb-2">13. Escriba el número de alumnas y alumnos afromexicanos o afrodescendientes por autoadscripción de los padres...</p>
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
              <p className="text-sm font-semibold mb-2">14. Escriba el número de alumnas y alumnos, según su lugar de residencia y desglóselos por sexo.</p>
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
  ), [shiftFilter, calculosV1, calculosV2, calculosV5, calculosV6, calculosV7, calculosV8, calculosReprobados]);
  
  useEffect(() => {
    if (historicoData && containerRef.current) {
      const tables = containerRef.current.querySelectorAll('table');
      historicoData.forEach((tableData, tIdx) => {
        const table = tables[tIdx];
        if (table) {
          const trs = table.querySelectorAll('tbody tr');
          tableData.forEach((rowData, rIdx) => {
            const tr = trs[rIdx];
            if (tr) {
              const tds = tr.querySelectorAll('td');
              let dataCellIndex = 0;
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
  }, [historicoData, TableGrid]);

  return (
    <>
      <div className="flex justify-between items-center mb-4 bg-white p-4 rounded-lg shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Estadística 911</h2>
          <p className="text-sm text-slate-500">Formato de captura de datos</p>
        </div>
        <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50">
          {isSaving ? 'Guardando...' : 'Guardar Datos'}
        </button>
      </div>
      {TableGrid}
    </>
  );
}

