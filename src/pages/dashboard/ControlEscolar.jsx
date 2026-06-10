import { useState, useEffect } from 'react';
import { QrCode, FileText, Upload, Download, Star, List, Save, X, User, Search } from 'lucide-react';
import Papa from 'papaparse';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import HojaDeVida from '../../components/HojaDeVida';
import CredencialPrint from '../../components/CredencialPrint';
import ConstanciaPrint from '../../components/ConstanciaPrint';
import BoletaPrint from '../../components/BoletaPrint';
import Calificaciones from '../../components/Calificaciones';

export default function ControlEscolar() {
  const [activeTab, setActiveTab] = useState('pendientes');
  const [modalType, setModalType] = useState(null); // 'hoja', 'grade', 'asignacionMasiva'
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);

  const [pendientes, setPendientes] = useState([]);
  const [activos, setActivos] = useState([]);
  const [directorio, setDirectorio] = useState([]);
  const [loading, setLoading] = useState(true);

  const [printMode, setPrintMode] = useState(null); // 'credencial', 'constancia', 'boleta'
  const [printData, setPrintData] = useState(null); // array for credencial, object for constancia
  const [constanciaType, setConstanciaType] = useState('simple'); // 'simple', 'calificaciones'



  // Estados de filtro para Directorio
  const [searchFilter, setSearchFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('Todos');
  const [groupFilter, setGroupFilter] = useState('Todos');
  const [shiftFilter, setShiftFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Activo');

  // Diccionario de materias por grado (Orden Oficial SEP / NEM)
  const materiasPorGrado = {
    '1er Grado': [
      // Lenguajes
      { id: 'espanol1', name: 'Español I' },
      { id: 'ingles1', name: 'Inglés I' },
      { id: 'artes1', name: 'Artes I' },
      // Saberes y Pensamiento Científico
      { id: 'matematicas1', name: 'Matemáticas I' },
      { id: 'biologia', name: 'Ciencias I (Biología)' },
      // Ética, Naturaleza y Sociedades
      { id: 'geografia', name: 'Geografía' },
      { id: 'historia1', name: 'Historia I' },
      { id: 'fce1', name: 'Formación Cívica y Ética I' },
      // De lo Humano y lo Comunitario
      { id: 'educfisica1', name: 'Educación Física I' },
      { id: 'tecnologia1', name: 'Tecnología I' }
    ],
    '2do Grado': [
      { id: 'espanol2', name: 'Español II' },
      { id: 'ingles2', name: 'Inglés II' },
      { id: 'artes2', name: 'Artes II' },
      { id: 'matematicas2', name: 'Matemáticas II' },
      { id: 'fisica', name: 'Ciencias II (Física)' },
      { id: 'historia2', name: 'Historia II' },
      { id: 'fce2', name: 'Formación Cívica y Ética II' },
      { id: 'educfisica2', name: 'Educación Física II' },
      { id: 'tecnologia2', name: 'Tecnología II' }
    ],
    '3er Grado': [
      { id: 'espanol3', name: 'Español III' },
      { id: 'ingles3', name: 'Inglés III' },
      { id: 'artes3', name: 'Artes III' },
      { id: 'matematicas3', name: 'Matemáticas III' },
      { id: 'quimica', name: 'Ciencias III (Química)' },
      { id: 'historia3', name: 'Historia III' },
      { id: 'fce3', name: 'Formación Cívica y Ética III' },
      { id: 'educfisica3', name: 'Educación Física III' },
      { id: 'tecnologia3', name: 'Tecnología III' }
    ]
  };

  const getTallerPorGrupo = (grupo) => {
    switch(grupo) {
      case 'A': return 'Climatización y refrigeración';
      case 'B': return 'Administración contable';
      case 'C': return 'Diseño y circuitos eléctricos';
      case 'D': return 'Administración contable';
      case 'E': return 'Diseño y mecánica automotriz';
      case 'F': return 'Ofimática';
      default: return 'Por asignar';
    }
  };

  useEffect(() => {
    const qAll = query(collection(db, "students"));
    const unsubAll = onSnapshot(qAll, (snapshot) => {
      const allData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPendientes(allData.filter(s => s.status === 'Pendiente'));
      setActivos(allData.filter(s => s.status === 'Activo'));
      setDirectorio(allData.filter(s => s.status !== 'Pendiente'));
      setLoading(false);
    });

    const handleAfterPrint = () => setPrintMode(null);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      unsubAll();
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  const filteredDirectorio = directorio.filter(a => {
    const matchesSearch = searchFilter === '' || 
      `${a.nombres} ${a.apellidoPaterno} ${a.apellidoMaterno} ${a.matricula}`.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesGrade = gradeFilter === 'Todos' || a.grado === gradeFilter;
    const matchesGroup = groupFilter === 'Todos' || a.grupo === groupFilter;
    const matchesShift = shiftFilter === 'Todos' || a.turno === shiftFilter;
    const matchesStatus = statusFilter === 'Todos' || a.status === statusFilter;
    return matchesSearch && matchesGrade && matchesGroup && matchesShift && matchesStatus;
  });

  const openModal = (type, student) => {
    setModalType(type);
    setSelectedStudent(student);
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedStudent(null);
  };

  const handlePrintSingle = (student) => {
    setPrintMode('credencial');
    setPrintData([student]);
    setTimeout(() => window.print(), 500);
  };

  const handlePrintBatch = () => {
    if (filteredDirectorio.length === 0) return alert("No hay alumnos en el filtro actual.");
    setPrintMode('credencial');
    setPrintData(filteredDirectorio);
    setTimeout(() => window.print(), 500);
  };

  const handlePrintConstancia = (student) => {
    openModal('constanciaOptions', student);
  };

  const executePrintConstancia = (type) => {
    setConstanciaType(type);
    setPrintMode('constancia');
    setPrintData(selectedStudent);
    setTimeout(() => window.print(), 500);
    closeModal();
  };

  const handlePrintBoleta = (studentOrArray) => {
    setPrintMode('boleta');
    setPrintData(Array.isArray(studentOrArray) ? studentOrArray : [studentOrArray]);
    setTimeout(() => window.print(), 500);
  };

  const toggleSelectStudent = (id) => {
    if (selectedStudents.includes(id)) {
      setSelectedStudents(selectedStudents.filter(sid => sid !== id));
    } else {
      setSelectedStudents([...selectedStudents, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedStudents.length === filteredDirectorio.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredDirectorio.map(a => a.id));
    }
  };

  const aceptarAspirante = async (student) => {
    const confirmacion = window.confirm(`¿Estás seguro de aceptar a ${student.nombres} ${student.apellidoPaterno}?`);
    if (!confirmacion) return;

    try {
      const newMatricula = `2026EST68${student.id.substring(0,4).toUpperCase()}`;
      const studentRef = doc(db, "students", student.id);
      await updateDoc(studentRef, {
        status: "Activo",
        matricula: newMatricula,
        grupo: "Por asignar",
        taller: "Por asignar"
      });
      alert(`Alumno aceptado con la matrícula: ${newMatricula}`);
    } catch (error) {
      console.error("Error al aceptar:", error);
      alert("Error al actualizar la base de datos.");
    }
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const trimestre = formData.get('trimestre');
    
    const calificaciones = selectedStudent.calificaciones || {};
    if (!calificaciones[trimestre]) calificaciones[trimestre] = {};
    
    const materias = materiasPorGrado[selectedStudent.grado] || [];
    materias.forEach(asig => {
      const val = formData.get(asig.id);
      if (val) calificaciones[trimestre][asig.id] = Number(val);
    });

    try {
      await updateDoc(doc(db, "students", selectedStudent.id), { calificaciones });
      alert('Calificaciones guardadas');
      closeModal();
    } catch (err) {
      console.error(err);
      alert('Error al guardar calificaciones');
    }
  };



  const handleAsignacionMasivaSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const grado = formData.get('grado');
    const grupo = formData.get('grupo');
    const turno = formData.get('turno');
    const taller = getTallerPorGrupo(grupo);

    const confirmacion = window.confirm(`Vas a actualizar ${selectedStudents.length} alumnos.\n\nGrado: ${grado}\nGrupo: ${grupo}\nTaller Automático: ${taller}\nTurno: ${turno}\n\n¿Deseas continuar?`);
    if (!confirmacion) return;

    try {
      for (const studentId of selectedStudents) {
        const studentRef = doc(db, "students", studentId);
        await updateDoc(studentRef, {
          grado: grado,
          grupo: grupo,
          taller: taller,
          turno: turno
        });
      }
      alert(`¡${selectedStudents.length} alumnos actualizados con éxito!`);
      setSelectedStudents([]);
      closeModal();
    } catch (error) {
      console.error(error);
      alert("Hubo un error al asignar de forma masiva.");
    }
  };

  const handleDownloadTemplate = () => {
    const BOM = "\uFEFF";
    const csvContent = "matricula;curp;escuelaProcedencia;domicilioEscuela;promedioEscuela;nombres;apellidoPaterno;apellidoMaterno;grado;grupo;turno;calleNumero;colonia;codigoPostal;tutor;celularTutor;referencia1;celularRef1;referencia2;celularRef2\n" +
                       "2026EST1234;CURP1234567890;Escuela Primaria Sor Juana;Av. Siempre Viva 123;9.5;Juan Carlos;Perez;Garcia;1er Grado;A;Matutino;Calle Falsa 123;Centro;39000;Maria Garcia;7471234567;Tio Pedro;7477654321;Abuela Carmen;7479876543";
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'Plantilla_Importacion_Alumnos.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data;
        if (!data || data.length === 0) {
          alert("El archivo está vacío.");
          return;
        }
        
        const confirmacion = window.confirm(`Se encontraron ${data.length} alumnos en el archivo. ¿Deseas importarlos?`);
        if (!confirmacion) return;

        let importados = 0;
        let errores = 0;

        for (const row of data) {
          try {
            await addDoc(collection(db, "students"), {
              matricula: row.matricula || '',
              curp: row.curp || '',
              escuelaProcedencia: row.escuelaProcedencia || '',
              domicilioEscuela: row.domicilioEscuela || '',
              promedioEscuela: row.promedioEscuela || '',
              nombres: row.nombres || '',
              apellidoPaterno: row.apellidoPaterno || '',
              apellidoMaterno: row.apellidoMaterno || '',
              grado: row.grado || '',
              grupo: row.grupo || '',
              turno: row.turno || '',
              taller: row.grupo ? getTallerPorGrupo(row.grupo.trim()) : 'Por asignar',
              calleNumero: row.calleNumero || '',
              colonia: row.colonia || '',
              codigoPostal: row.codigoPostal || '',
              tutor: row.tutor || '',
              celularTutor: row.celularTutor || '',
              referencia1: row.referencia1 || '',
              celularRef1: row.celularRef1 || '',
              referencia2: row.referencia2 || '',
              celularRef2: row.celularRef2 || '',
              status: "Activo",
              fechaRegistro: serverTimestamp()
            });
            importados++;
          } catch (error) {
            console.error("Error importando fila:", row, error);
            errores++;
          }
        }
        alert(`Importación completada.\n\nÉxitos: ${importados}\nErrores: ${errores}`);
      },
      error: (error) => {
        alert("Error al leer el archivo CSV: " + error.message);
      }
    });
    
    // Limpiar input
    e.target.value = null;
  };
  
  const handleExportCSV = () => {
    alert("Exportar CSV accionado (Simulado)");
  };

  return (
    <>
    <div className={printMode ? "hidden" : "space-y-6 relative"}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Control Escolar</h2>
          <p className="text-slate-500 text-sm">Gestión de expedientes, inscripciones y calificaciones.</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <button onClick={handleDownloadTemplate} className="flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors shadow-sm">
            <Download className="w-4 h-4 mr-2 text-slate-500" /> Descargar Plantilla
          </button>
          <label className="cursor-pointer flex items-center px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
            <Upload className="w-4 h-4 mr-2 text-primary-600" /> Importar CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
          </label>
          <button onClick={handleExportCSV} className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm">
            <Download className="w-4 h-4 mr-2" /> Exportar Activos
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 overflow-x-auto">
        <nav className="-mb-px flex space-x-8 min-w-max">
          <button onClick={() => setActiveTab('pendientes')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'pendientes' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            Solicitudes Pendientes <span className="ml-2 bg-amber-100 text-amber-600 py-0.5 px-2.5 rounded-full text-xs">{pendientes.length}</span>
          </button>
          <button onClick={() => setActiveTab('activos')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'activos' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            Directorio / Expedientes <span className="ml-2 bg-slate-100 text-slate-600 py-0.5 px-2.5 rounded-full text-xs">{directorio.length}</span>
          </button>

          <button onClick={() => setActiveTab('calificaciones')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'calificaciones' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            Calificaciones <Star className="w-3 h-3 inline-block ml-1 text-amber-500" />
          </button>
        </nav>
      </div>

      {loading && <p className="text-center py-8 text-slate-500 animate-pulse">Cargando base de datos...</p>}

      {/* Tabla Pendientes */}
      {!loading && activeTab === 'pendientes' && (
        <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Trámite</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Alumno</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Grado / Escuela Anterior</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {pendientes.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-500">No hay solicitudes pendientes.</td></tr>
              ) : (
                pendientes.map(p => (
                  <tr key={p.id}>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs">{p.tipoTramite || 'Nuevo Ingreso'}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-semibold uppercase">{p.apellidoPaterno} {p.apellidoMaterno} {p.nombres}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {p.grado} <br/> <span className="text-xs text-slate-400">{p.escuelaProcedencia}</span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => aceptarAspirante(p)} className="text-emerald-600 font-medium text-sm hover:bg-emerald-50 px-3 py-1 rounded border border-emerald-200 transition-colors">
                        Aceptar Aspirante
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tabla Calificaciones */}
      {!loading && activeTab === 'calificaciones' && (
        <Calificaciones activos={activos} materiasPorGrado={materiasPorGrado} onPrintBoleta={handlePrintBoleta} />
      )}

      {/* Tabla Activos / Directorio */}
      {!loading && activeTab === 'activos' && (
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 mb-1">Buscar por Nombre o Matrícula</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input type="text" className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm bg-white" placeholder="Ej. Juan Pérez o 2026EST..." value={searchFilter} onChange={e => setSearchFilter(e.target.value)} />
              </div>
            </div>
            <div className="w-full md:w-48">
              <label className="block text-xs font-medium text-slate-500 mb-1">Grado</label>
              <select className="w-full p-2 border rounded-lg text-sm bg-white" value={gradeFilter} onChange={e => setGradeFilter(e.target.value)}>
                <option value="Todos">Todos los Grados</option>
                <option value="1er Grado">1er Grado</option>
                <option value="2do Grado">2do Grado</option>
                <option value="3er Grado">3er Grado</option>
              </select>
            </div>
            <div className="w-full md:w-48">
              <label className="block text-xs font-medium text-slate-500 mb-1">Grupo</label>
              <select translate="no" className="notranslate w-full p-2 border rounded-lg text-sm bg-white" value={groupFilter} onChange={e => setGroupFilter(e.target.value)}>
                <option value="Todos">Todos los Grupos</option>
                <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option><option value="E">E</option><option value="F">F</option>
              </select>
            </div>
            <div className="w-full md:w-32">
              <label className="block text-xs font-medium text-slate-500 mb-1">Turno</label>
              <select className="w-full p-2 border rounded-lg text-sm bg-white" value={shiftFilter} onChange={e => setShiftFilter(e.target.value)}>
                <option value="Todos">Ambos</option>
                <option value="Matutino">Matutino</option>
                <option value="Vespertino">Vespertino</option>
              </select>
            </div>
            <div className="w-full md:w-32">
              <label className="block text-xs font-medium text-slate-500 mb-1">Estatus</label>
              <select className="w-full p-2 border rounded-lg text-sm bg-white" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="Todos">Todos</option>
                <option value="Activo">Activos</option>
                <option value="Baja">Bajas</option>
                <option value="Egresado">Egresados</option>
                <option value="Pendiente">Pendientes</option>
              </select>
            </div>
            <div className="w-full md:w-auto self-end flex gap-2">
              <button onClick={handlePrintBatch} className="w-full md:w-auto px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors shadow-sm flex items-center justify-center">
                <QrCode className="w-4 h-4 mr-2" /> Imprimir Grupo
              </button>
              {selectedStudents.length > 0 && (
                <button onClick={() => setModalType('asignacionMasiva')} className="w-full md:w-auto px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm flex items-center justify-center">
                  Asignación Masiva ({selectedStudents.length})
                </button>
              )}
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                  <input type="checkbox" 
                    checked={selectedStudents.length === filteredDirectorio.length && filteredDirectorio.length > 0} 
                    onChange={toggleSelectAll} className="rounded border-slate-300" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Matrícula</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Alumno</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Detalle</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Acciones / Edición</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredDirectorio.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No hay alumnos que coincidan con la búsqueda.</td></tr>
              ) : (
                filteredDirectorio.map(a => (
                  <tr key={a.id} className={`hover:bg-slate-50 ${selectedStudents.includes(a.id) ? 'bg-blue-50/50' : ''}`}>
                    <td className="px-6 py-4 text-sm">
                      <input type="checkbox" checked={selectedStudents.includes(a.id)} onChange={() => toggleSelectStudent(a.id)} className="rounded border-slate-300" />
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-primary-700">{a.matricula}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium uppercase">{a.apellidoPaterno} {a.apellidoMaterno} {a.nombres}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      <div className="font-semibold text-slate-700">{a.grado} "{a.grupo || '-'}"</div>
                      <div className="text-xs text-slate-500">{a.taller || '-'}</div>
                      <div className="text-xs text-slate-400">{a.turno || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-4">
                      <button onClick={() => openModal('hoja', a)} className="text-blue-600 hover:text-blue-800 font-medium text-sm inline-flex items-center">
                        <User className="w-4 h-4 mr-1" /> Expediente / Hoja de Vida
                      </button>
                      <button onClick={() => openModal('grade', a)} className="text-emerald-600 hover:text-emerald-800 font-medium text-sm inline-flex items-center">
                        <Star className="w-4 h-4 mr-1" /> Calificar
                      </button>
                      <button onClick={() => handlePrintConstancia(a)} className="text-amber-600 hover:text-amber-800 font-medium text-sm inline-flex items-center">
                        <FileText className="w-4 h-4 mr-1" /> Constancia
                      </button>
                      <button onClick={() => handlePrintSingle(a)} className="text-slate-500 hover:text-slate-800 font-medium text-sm inline-flex items-center">
                        <QrCode className="w-4 h-4 mr-1" /> Credencial
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        </div>
      )}



      {/* MODALES LOCALES (Grade) */}
      {modalType === 'grade' && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">
                Captura de Calificaciones Individual
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleGradeSubmit} className="space-y-4">
                  <p className="text-sm font-semibold text-slate-700 uppercase mb-4">{selectedStudent.nombres} {selectedStudent.apellidoPaterno} - {selectedStudent.grado} "{selectedStudent.grupo}"</p>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Periodo a Evaluar</label>
                    <select name="trimestre" className="w-full p-2 border rounded bg-slate-50">
                      <option value="t1">1er Trimestre</option>
                      <option value="t2">2do Trimestre</option>
                      <option value="t3">3er Trimestre</option>
                    </select>
                  </div>

                  <div className="space-y-3 border-t pt-4 max-h-[40vh] overflow-y-auto pr-2">
                    {materiasPorGrado[selectedStudent.grado]?.map(asig => (
                      <div key={asig.id} className="flex justify-between items-center bg-slate-50 p-2 rounded border">
                        <label className="text-sm font-medium text-slate-700">{asig.name}</label>
                        <input 
                          type="number" 
                          name={asig.id} 
                          defaultValue={selectedStudent.calificaciones?.t1?.[asig.id] || ''} 
                          min="5" max="10" step="0.1" 
                          className="w-20 p-1 text-center border rounded font-bold" 
                          placeholder="-" 
                        />
                      </div>
                    ))}
                  </div>
                  <button type="submit" className="w-full mt-6 bg-emerald-600 text-white py-2 rounded-lg font-medium hover:bg-emerald-700 flex justify-center items-center">
                    <Save className="w-4 h-4 mr-2" /> Guardar Calificaciones
                  </button>
                </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HOJA DE VIDA (Componente Externo) */}
      {modalType === 'hoja' && selectedStudent && (
        <HojaDeVida 
          student={selectedStudent} 
          onClose={closeModal} 
          onSave={(updatedStudent) => {
            // Actualizar localmente si es necesario, o dejar que el onSnapshot lo haga
          }} 
        />
      )}

      {/* MODAL DE ASIGNACIÓN MASIVA */}
      {modalType === 'asignacionMasiva' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">
                Asignación Masiva ({selectedStudents.length} alumnos)
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleAsignacionMasivaSubmit} className="space-y-4">
                  <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm mb-4">
                    Al elegir el Grupo, el <strong>Taller</strong> se asignará automáticamente (A=Clima, B=Contable, C=Electricidad, D=Contable, E=Mecánica, F=Ofimática).
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Grado</label>
                    <select name="grado" className="w-full p-2 border rounded bg-white">
                      <option value="1er Grado">1er Grado</option>
                      <option value="2do Grado">2do Grado</option>
                      <option value="3er Grado">3er Grado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Grupo (y Taller Automático)</label>
                    <select name="grupo" className="w-full p-2 border rounded bg-white">
                      <option value="A">A - Climatización y refrigeración</option>
                      <option value="B">B - Administración contable</option>
                      <option value="C">C - Diseño y circuitos eléctricos</option>
                      <option value="D">D - Administración contable</option>
                      <option value="E">E - Diseño y mecánica automotriz</option>
                      <option value="F">F - Ofimática</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Turno</label>
                    <select name="turno" className="w-full p-2 border rounded bg-white">
                      <option value="Matutino">Matutino</option>
                      <option value="Vespertino">Vespertino</option>
                    </select>
                  </div>

                  <button type="submit" className="w-full mt-6 bg-emerald-600 text-white py-2 rounded-lg font-medium hover:bg-emerald-700 flex justify-center items-center">
                    <Save className="w-4 h-4 mr-2" /> Guardar y Asignar
                  </button>
                </form>
            </div>
          </div>
        </div>
      )}
    </div>

      {/* MODAL DE TIPO DE CONSTANCIA */}
      {modalType === 'constanciaOptions' && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
            <button onClick={closeModal} className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Generar Constancia</h2>
            <p className="text-sm text-slate-500 mb-6">Selecciona el tipo de documento que deseas emitir para <strong>{selectedStudent.nombres}</strong>.</p>
            
            <div className="space-y-3">
              <button onClick={() => executePrintConstancia('simple')} className="w-full flex items-start p-4 border border-slate-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition text-left group">
                <div className="bg-primary-100 text-primary-600 p-2 rounded-lg mr-4 group-hover:bg-primary-500 group-hover:text-white transition">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Constancia Simple</h3>
                  <p className="text-xs text-slate-500 mt-1">Formato tradicional certificando la inscripción y el grado cursado.</p>
                </div>
              </button>

              <button onClick={() => executePrintConstancia('calificaciones')} className="w-full flex items-start p-4 border border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition text-left group">
                <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg mr-4 group-hover:bg-emerald-500 group-hover:text-white transition">
                  <Star className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Constancia con Calificaciones</h3>
                  <p className="text-xs text-slate-500 mt-1">Incluye el promedio general acumulado y la tabla de calificaciones.</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMPRESIÓN */}
      {printMode === 'credencial' && <CredencialPrint students={printData} />}
      {printMode === 'constancia' && <ConstanciaPrint student={printData} type={constanciaType} materiasPorGrado={materiasPorGrado} />}
      {printMode === 'boleta' && <BoletaPrint students={printData} materiasPorGrado={materiasPorGrado} />}
    </>
  );
}
