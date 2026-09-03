import { useState, useEffect, useMemo } from 'react';
import { useGlobalConfig } from '../../hooks/useGlobalConfig';
import { QrCode, FileText, Upload, Download, Star, List, Save, X, User, Search, Printer, Trash2, UserPlus, Award, UserMinus, AlertTriangle, GraduationCap, Settings, MessageCircle } from 'lucide-react';
import Papa from 'papaparse';
import { db, auth } from '../../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, getDocs, deleteDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import HojaDeVida from '../../components/HojaDeVida';
import CredencialPrint from '../../components/CredencialPrint';
import ConstanciaPrint from '../../components/ConstanciaPrint';
import BoletaPrint from '../../components/BoletaPrint';
import Calificaciones from '../../components/Calificaciones';
import ListaAsistenciaPrint from '../../components/ListaAsistenciaPrint';
import CuadroFinalPrint from '../../components/CuadroFinalPrint';
import ConstanciaEERPrint from '../../components/ConstanciaEERPrint';
import CuadroParcialPrint from '../../components/CuadroParcialPrint';
import { downloadExcelFriendlyCsv } from '../../utils/exportCsv';
import AprovechamientoPrint from '../../components/AprovechamientoPrint';
import MatriculaPrint from '../../components/MatriculaPrint';
import MatriculaGruposPrint from '../../components/MatriculaGruposPrint';
import AprobacionPrint from '../../components/AprobacionPrint';
import EficienciaTerminalPrint from '../../components/EficienciaTerminalPrint';
import DesempenoAlcanzadoPrint from '../../components/DesempenoAlcanzadoPrint';
import DesertoresPrint from '../../components/DesertoresPrint';
import RegularizacionPrint from '../../components/RegularizacionPrint';
import KardexPrint from '../../components/KardexPrint';
import ListaClausuraPrint from '../../components/ListaClausuraPrint';
import AddStudentModal from '../../components/AddStudentModal';
import AcuseDocumentosModal from '../../components/AcuseDocumentosModal';
import AcuseDocumentosPrint from '../../components/AcuseDocumentosPrint';
import AcuseRecepcionModal from '../../components/AcuseRecepcionModal';
import AcuseRecepcionPrint from '../../components/AcuseRecepcionPrint';
import ExpedienteModal from '../../components/ExpedienteModal';
import { FolderOpen } from 'lucide-react';
import { autoAcentuar } from '../../utils/format';
import { searchIncludes } from '../../utils/search';
import { registrarMovimiento } from '../../utils/bitacora';
import BitacoraTab from '../../components/BitacoraTab';

export default function ControlEscolar() {
  const { config, updateConfig } = useGlobalConfig();
  const [leyendaOficial, setLeyendaOficial] = useState('"2026, Año de Margarita Maza"');
  const [activeTab, setActiveTab] = useState('pendientes');
  const [modalType, setModalType] = useState(null); // 'hoja', 'grade', 'asignacionMasiva'
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedExpediente, setSelectedExpediente] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [constanciaPromedio, setConstanciaPromedio] = useState('');
  
  // Estados para Modal de Extraordinarios
  const [extraStudent, setExtraStudent] = useState(null);
  const [extraordinarioToPrint, setExtraordinarioToPrint] = useState(null);
  const [eerToPrint, setEerToPrint] = useState(null);
  const [extraSubjects, setExtraSubjects] = useState([]);
  const [extraData, setExtraData] = useState({});

  const [pendientes, setPendientes] = useState([]);
  const [tramitesPagados, setTramitesPagados] = useState([]);
  const [searchAspirantes, setSearchAspirantes] = useState("");
  const [globalShiftFilter, setGlobalShiftFilter] = useState('Todos');
  const [_rawActivos, setActivos] = useState([]);
  const [_rawDirectorio, setDirectorio] = useState([]);
  const [loading, setLoading] = useState(true);
  const activos = useMemo(() => _rawActivos.filter(a => globalShiftFilter === 'Todos' || a.turno === globalShiftFilter), [_rawActivos, globalShiftFilter]);
  const directorio = useMemo(() => _rawDirectorio.filter(a => globalShiftFilter === 'Todos' || a.turno === globalShiftFilter), [_rawDirectorio, globalShiftFilter]);


  const [printMode, setPrintMode] = useState(null); // 'credencial', 'constancia', 'boleta', 'listaAsistencia'
  const [printData, setPrintData] = useState(null); // array for credencial, object for constancia
  const [constanciaType, setConstanciaType] = useState('simple'); // 'simple', 'calificaciones'

  // Estados para Generaciones
  const [generacionFilter, setGeneracionFilter] = useState('Todos');
  const [generacionList, setGeneracionList] = useState([]);
  const [cicloEgreso, setCicloEgreso] = useState('2023-2026'); // Para el modal de cierre
 // 'simple', 'calificaciones'

  // Estados para listas de asistencia
  const [asisGrado, setAsisGrado] = useState('1er Grado');
  const [asisGrupo, setAsisGrupo] = useState('A');
  const [asisMes, setAsisMes] = useState('Septiembre');
  const [asisPaperSize, setAsisPaperSize] = useState('letter');
  const [asesorNombre, setAsesorNombre] = useState('');



  // Estados de filtro para Directorio
  const [searchFilter, setSearchFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('Todos');
  const [groupFilter, setGroupFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Activo');
  const [cycleFilter, setCycleFilter] = useState('Todos');

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
      { id: 'tecnologia1', name: 'Tecnología I' },
      { id: 'educfisica1', name: 'Educación Física I' }
    ],
    '2do Grado': [
      { id: 'espanol2', name: 'Español II' },
      { id: 'ingles2', name: 'Inglés II' },
      { id: 'artes2', name: 'Artes II' },
      { id: 'matematicas2', name: 'Matemáticas II' },
      { id: 'fisica', name: 'Ciencias II (Física)' },
      { id: 'historia2', name: 'Historia II' },
      { id: 'fce2', name: 'Formación Cívica y Ética II' },
      { id: 'tecnologia2', name: 'Tecnología II' },
      { id: 'educfisica2', name: 'Educación Física II' }
    ],
    '3er Grado': [
      { id: 'espanol3', name: 'Español III' },
      { id: 'ingles3', name: 'Inglés III' },
      { id: 'artes3', name: 'Artes III' },
      { id: 'matematicas3', name: 'Matemáticas III' },
      { id: 'quimica', name: 'Ciencias III (Química)' },
      { id: 'historia3', name: 'Historia III' },
      { id: 'fce3', name: 'Formación Cívica y Ética III' },
      { id: 'tecnologia3', name: 'Tecnología III' },
      { id: 'educfisica3', name: 'Educación Física III' }
    ]
  };

  const getTallerPorGrupo = (grupo) => {
    switch(grupo) {
      case 'A':
      case 'G': return 'Climatización y refrigeración';
      case 'B':
      case 'H': return 'Administración contable';
      case 'C':
      case 'I': return 'Diseño y circuitos eléctricos';
      case 'D':
      case 'J': return 'Administración contable';
      case 'E':
      case 'K': return 'Diseño y mecánica automotriz';
      case 'F':
      case 'L': return 'Ofimática';
      default: return 'Por asignar';
    }
  };

  useEffect(() => {
    const qAll = query(collection(db, "students"));
    
    const qTramites = query(collection(db, "tramites_pendientes"));
    const unsubTramites = onSnapshot(qTramites, snap => {
      setTramitesPagados(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubAll = onSnapshot(qAll, (snapshot) => {
      const allData = snapshot.docs.map(doc => {
        const data = doc.data();
        if (data.curp && data.curp.length >= 18) {
           const curp = data.curp.toUpperCase();
           if (!data.genero) {
              const genderChar = curp.charAt(10);
              if (genderChar === 'H') data.genero = 'Hombre';
              if (genderChar === 'M') data.genero = 'Mujer';
           }
           if (!data.fechaNacimiento) {
              const yearStr = curp.substring(4, 6);
              const mm = curp.substring(6, 8);
              const dd = curp.substring(8, 10);
              const yy = parseInt(yearStr, 10);
              if (!isNaN(yy)) {
                 const year = yy > 50 ? '19' + yearStr : '20' + yearStr;
                 data.fechaNacimiento = `${year}-${mm}-${dd}`;
              }
           }
        }
        
        // Aplicar reglas ortográficas (Acentos) a nivel global en memoria
        if (data.nombres) data.nombres = autoAcentuar(data.nombres);
        if (data.apellidoPaterno) data.apellidoPaterno = autoAcentuar(data.apellidoPaterno);
        if (data.apellidoMaterno) data.apellidoMaterno = autoAcentuar(data.apellidoMaterno);
          
          // Limpieza de datos criticos y auto-correccion en base de datos
          if (data.grupo) {
             const cleanGrupo = data.grupo.toString().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
             if (data.grupo !== cleanGrupo && doc.id) {
                 // Auto-reparar en base de datos silenciosamente
                 updateDoc(doc.ref, { grupo: cleanGrupo }).catch(console.error);
             }
             data.grupo = cleanGrupo;
          }
          if (data.grado) {
             const cleanGrado = data.grado.trim();
             if (data.grado !== cleanGrado && doc.id) updateDoc(doc.ref, { grado: cleanGrado }).catch(console.error);
             data.grado = cleanGrado;
          }
          if (data.turno) {
             const cleanTurno = data.turno.trim();
             if (data.turno !== cleanTurno && doc.id) updateDoc(doc.ref, { turno: cleanTurno }).catch(console.error);
               data.turno = cleanTurno;

               // El usuario indico que si hay alumnos en Vespertino, usan otras letras (ej. L).
               // Si hay alguien en Vespertino que tiene F, lo pasamos a L
               if (data.turno === 'Vespertino' && data.grupo === 'F') {
                   const nuevoGrupo = 'L';
                   if (doc.id) updateDoc(doc.ref, { grupo: nuevoGrupo }).catch(console.error);
                   data.grupo = nuevoGrupo;
               }
          }

        return { id: doc.id, ...data };
      });
      setPendientes(allData.filter(s => s.status === 'Pendiente'));
      setActivos(allData.filter(s => s.status === 'Activo'));
      setDirectorio(allData.filter(s => s.status !== 'Pendiente'));
      
      // Extraer lista única de generaciones
      const egresados = allData.filter(s => s.status === 'Egresado');
      const gens = [...new Set(egresados.map(e => e.generacionEgreso).filter(Boolean))].sort().reverse();
      setGeneracionList(gens);
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
    const searchTarget = `${a.nombres} ${a.apellidoPaterno} ${a.apellidoMaterno} ${a.matricula}`;
    const matchesSearch = searchFilter === '' || searchIncludes(searchTarget, searchFilter);
    const matchesGrade = gradeFilter === 'Todos' || a.grado === gradeFilter;
    const matchesGroup = groupFilter === 'Todos' || a.grupo === groupFilter;
    const matchesShift = globalShiftFilter === 'Todos' || a.turno === globalShiftFilter;
    const matchesStatus = (statusFilter === 'Todos' && a.status !== 'Egresado') || a.status === statusFilter;
    const matchesCycle = cycleFilter === 'Todos' || a.cicloEscolar === cycleFilter;
    return matchesSearch && matchesGrade && matchesGroup && matchesShift && matchesStatus && matchesCycle;
  }).sort((a, b) => {
    const nameA = `${a.apellidoPaterno || ''} ${a.apellidoMaterno || ''} ${a.nombres || ''}`.trim().toUpperCase();
    const nameB = `${b.apellidoPaterno || ''} ${b.apellidoMaterno || ''} ${b.nombres || ''}`.trim().toUpperCase();
    return nameA.localeCompare(nameB);
  });

  const asisAlumnos = useMemo(() => {
    return activos
      .filter(a => a.grado === asisGrado && a.grupo === asisGrupo)
      .sort((a, b) => {
        const nameA = `${a.apellidoPaterno || ''} ${a.apellidoMaterno || ''} ${a.nombres || ''}`.trim().toUpperCase();
        const nameB = `${b.apellidoPaterno || ''} ${b.apellidoMaterno || ''} ${b.nombres || ''}`.trim().toUpperCase();
        return nameA.localeCompare(nameB);
      });
  }, [activos, asisGrado, asisGrupo]);

  const checkIfFailed = (student, materiasPorGradoObj) => {
    if (!materiasPorGradoObj[student.grado]) return false;
    const materias = materiasPorGradoObj[student.grado];
    for (let mat of materias) {
      const t1 = parseFloat(student.calificaciones?.['t1']?.[mat.id]);
      const t2 = parseFloat(student.calificaciones?.['t2']?.[mat.id]);
      const t3 = parseFloat(student.calificaciones?.['t3']?.[mat.id]);
      
      const extraScore = student.regularizacion?.[mat.id]?.calificacion;
      if (extraScore !== undefined && parseFloat(extraScore) >= 6) {
          continue; 
      }

      let sum = 0; let count = 0;
      if (!isNaN(t1)) { sum += t1; count++; }
      if (!isNaN(t2)) { sum += t2; count++; }
      if (!isNaN(t3)) { sum += t3; count++; }
      if (count > 0) {
        const finalMat = Math.floor((sum / count + 0.00001) * 10) / 10;
        if (finalMat < 6) return true;
      }
    }
    return false;
  };

  const handleCerrarCiclo = async () => {
    if(!cicloEgreso) { alert('Ingresa la generación de egreso'); return; }
    
    const confirm1 = window.confirm('⚠ ADVERTENCIA: Estás a punto de Cerrar el Ciclo Escolar.\n\nEsto modificará los grados de tódos los alumnos de 1ro, 2do y 3ro masivamente.\n\n¿Deseas continuar?');
    if(!confirm1) return;
    const confirm2 = window.confirm('¿Estás COMPLETAMENTE SEGURO? Esta acción no se puede deshacer. Los alumnos de 3ro serán movidos a Egresados y los demás avanzarán de grado.');
    if(!confirm2) return;

    try {
      let countUpdated = 0;
      for (const student of activos) {
        const studentRef = doc(db, 'students', student.id);
        const failed = checkIfFailed(student, materiasPorGrado);
        let updates = {};

        if (student.grado === '3er Grado' || student.grado?.includes('3er Grado (Irregular)')) {
           updates = {
             status: 'Egresado',
             generacionEgreso: cicloEgreso,
             grado: failed ? 'Egresado con materias reprobadas' : 'Egresado'
           };
        } else if (student.grado === '2do Grado' || student.grado?.includes('2do Grado (Irregular)')) {
           updates = {
             grado: failed ? '3er Grado (Irregular)' : '3er Grado'
           };
        } else if (student.grado === '1er Grado' || student.grado?.includes('1er Grado (Irregular)')) {
           updates = {
             grado: failed ? '2do Grado (Irregular)' : '2do Grado'
           };
        }
        
        if (Object.keys(updates).length > 0) {
           await updateDoc(studentRef, updates);
           countUpdated++;
        }
      }
      await updateConfig({ cicloEscolarActual: cicloEgreso, leyendaOficial: leyendaOficial });
      await registrarMovimiento(auth.currentUser?.email, 'Control Escolar', 'Cierre de Ciclo', `Se cerró el ciclo escolar. Se promovieron ${countUpdated} alumnos. Nuevo ciclo: ${cicloEgreso}`);
      toast.success(`¡Ciclo Cerrado! Se promovieron ${countUpdated} alumnos y el ciclo escolar actual ahora es ${cicloEgreso}.`);
      closeModal();
    } catch (error) {
      console.error(error);
      toast.error('Hubo un error al cerrar el ciclo escolar.');
    }
  };

  const openModal = (type, student) => {
    setModalType(type);
    setSelectedStudent(student);
  };

  
  const handleMarcarTramiteEntregado = async (id) => {
    try {
      await updateDoc(doc(db, 'tramites_pendientes', id), { estado: 'Entregado', fechaEntrega: new Date().toISOString() });
      toast.success('Trámite marcado como entregado');
    } catch (error) {
      toast.error('Error al actualizar trámite');
    }
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedStudent(null);
    setConstanciaPromedio('');
    setExtraStudent(null);
    setExtraSubjects([]);
    setExtraData({});
  };

  const handleCaptureExtra = (student, subjects) => {
    setExtraStudent(student);
    setExtraSubjects(subjects);
    setExtraData({}); // clear previous inputs
    setModalType('extraordinario');
  };

  const saveExtraordinario = async () => {
    let hasData = false;
    for (const matId in extraData) {
      if (extraData[matId].calificacion && extraData[matId].fecha && extraData[matId].periodo) hasData = true;
    }
    if (!hasData) {
      toast.error('Captura al menos una calificación y fecha para guardar.');
      return;
    }

    try {
      const studentRef = doc(db, 'students', extraStudent.id);
      const currentReg = extraStudent.regularizacion || {};
      const newReg = { ...currentReg };
      for (const matId in extraData) {
        if (extraData[matId].calificacion && extraData[matId].fecha && extraData[matId].periodo) {
           newReg[matId] = { calificacion: parseFloat(extraData[matId].calificacion), fecha: extraData[matId].fecha, periodo: extraData[matId].periodo };
        }
      }
      
      await updateDoc(studentRef, { regularizacion: newReg, lastModifiedBy: auth.currentUser?.email || 'Desconocido', lastModifiedAt: new Date().toISOString() });
      toast.success('Historial de regularización guardado exitosamente.');
      closeModal();
    } catch (error) {
      console.error("Error al guardar extraordinario:", error);
      toast.error('Hubo un error al guardar el extraordinario.');
    }
  };

  const hasFailedSubjects = useMemo(() => {
    if (!selectedStudent || !materiasPorGrado[selectedStudent.grado]) return false;
    const materias = materiasPorGrado[selectedStudent.grado];
    for (let mat of materias) {
      const t1 = parseFloat(selectedStudent.calificaciones?.['t1']?.[mat.id]);
      const t2 = parseFloat(selectedStudent.calificaciones?.['t2']?.[mat.id]);
      const t3 = parseFloat(selectedStudent.calificaciones?.['t3']?.[mat.id]);
      let sum = 0; let count = 0;
      if (!isNaN(t1)) { sum += t1; count++; }
      if (!isNaN(t2)) { sum += t2; count++; }
      if (!isNaN(t3)) { sum += t3; count++; }
      if (count > 0) {
        const finalMat = Math.floor((sum / count + 0.00001) * 10) / 10;
        if (finalMat < 6) return true;
      }
    }
    return false;
  }, [selectedStudent, materiasPorGrado]);

  const handleDeleteStudent = async (student) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar permanentemente a ${student.nombres} ${student.apellidoPaterno}? Esta acción no se puede deshacer.`)) {
      try {
        await deleteDoc(doc(db, "students", student.id));
        await registrarMovimiento(auth.currentUser?.email, 'Control Escolar', 'Eliminar Alumno', `Se eliminó definitivamente al alumno ${student.nombres} ${student.apellidoPaterno} (${student.matricula || 'Sin matrícula'})`);
        toast.success("Alumno eliminado correctamente.");
      } catch (error) {
        console.error("Error al eliminar alumno:", error);
        toast.error("Hubo un error al intentar eliminar el alumno.");
      }
    }
  };

  const handlePrintSingle = (student) => {
    toast.success("Generando credencial...", { icon: '🪪' });
    setPrintMode('credencial');
    setPrintData([student]);
    setTimeout(() => window.print(), 500);
  };

  const handlePrintBatch = () => {
    if (filteredDirectorio.length === 0) return alert("No hay alumnos en el filtro actual.");
    toast.success("Generando credenciales para el grupo...", { icon: '🪪' });
    setPrintMode('credencial');
    setPrintData(filteredDirectorio);
    setTimeout(() => window.print(), 500);
  };

  const handlePrintConstancia = (student) => {
    openModal('constanciaOptions', student);
  };

  const executePrintConstancia = (type) => {
    if (type === 'terminacion' && selectedStudent?.grado !== '3er Grado') {
      alert("La Constancia de Terminación de Estudios es exclusiva para alumnos de 3er Grado.");
      return;
    }
    if (type === 'inscripcion_primero' && selectedStudent?.grado !== '1er Grado') {
      alert("Esta constancia es exclusiva para alumnos de 1er Grado.");
      return;
    }
    toast.success("Generando constancia...", { icon: '📝' });
    setConstanciaType(type);
    setPrintMode('constancia');
    setPrintData({ ...selectedStudent, manualPromedio: constanciaPromedio });
    // Aumentamos el tiempo para dar oportunidad al navegador de cargar/decodificar la imagen
    setTimeout(() => window.print(), 800);
    closeModal();
  };

  const handlePrintBoleta = (studentOrGroup) => {
    toast.success("Preparando boletas para impresión...", { icon: '🖨️' });
    if(Array.isArray(studentOrGroup)) {
      setPrintData(studentOrGroup);
    } else {
      setPrintData([studentOrGroup]);
    }
    setPrintMode('boleta');
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handlePrintConcentradoFinal = (alumnos, grado, grupo) => {
    toast.success("Generando Concentrado Final...", { icon: '📄' });
    setPrintData({ alumnos, grado, grupo });
    setPrintMode('concentrado-final');
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handlePrintConcentradoParcial = (alumnos, grado, grupo) => {
    toast.success("Generando Concentrado Parcial...", { icon: '📄' });
    setPrintData({ alumnos, grado, grupo });
    setPrintMode('concentrado-parcial');
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handlePrintAprovechamiento = () => {
    toast.success("Abriendo Reporte de Aprovechamiento...", { icon: '📄' });
    setPrintMode('aprovechamiento');
  };

  const handlePrintMatricula = () => {
    toast.success("Abriendo Estadística de Matrícula...", { icon: '📊' });
    setPrintMode('matricula');
  };

  const handlePrintAprobacion = () => {
    toast.success("Abriendo Reporte de Aprobación...", { icon: '📄' });
    setPrintMode('aprobacion');
  };

  const handlePrintEficiencia = () => {
    toast.success("Abriendo Reporte de Eficiencia Terminal...", { icon: '🎓' });
    setPrintMode('eficiencia');
  };

  const handlePrintDesempeno = () => {
    toast.success("Abriendo Reporte de Desempeño Alcanzado...", { icon: '📊' });
    setPrintMode('desempeno');
  };

  const handlePrintDesertores = () => {
    toast.success("Abriendo Relación de Alumnos Desertores...", { icon: '📉' });
    setPrintMode('desertores');
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
      const studentRef = doc(db, "students", student.id);
      await updateDoc(studentRef, { status: "Activo", lastModifiedBy: auth.currentUser?.email || "Desconocido", lastModifiedAt: new Date().toISOString() });
      await registrarMovimiento(auth.currentUser?.email, 'Control Escolar', 'Aceptar Aspirante', `Se aceptó al alumno ${student.nombres} ${student.apellidoPaterno} (${student.matricula})`);
      alert(`Alumno aceptado y movido al Directorio Activo.`);
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
      await updateDoc(doc(db, "students", selectedStudent.id), { calificaciones, lastModifiedBy: auth.currentUser?.email || "Desconocido", lastModifiedAt: new Date().toISOString() });
      await registrarMovimiento(auth.currentUser?.email, 'Control Escolar', 'Calificaciones', `Se guardaron calificaciones del ${trimestre} para el alumno ${selectedStudent.nombres} ${selectedStudent.apellidoPaterno} (${selectedStudent.matricula})`);
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
      await registrarMovimiento(auth.currentUser?.email, 'Control Escolar', 'Asignación Masiva', `Se movieron ${selectedStudents.length} alumnos a ${grado} "${grupo}" (${turno}) con taller de ${taller}`);
      alert(`¡${selectedStudents.length} alumnos actualizados con éxito!`);
      setSelectedStudents([]);
      closeModal();
    } catch (error) {
      console.error(error);
      alert("Hubo un error al asignar de forma masiva.");
    }
  };

  const handleDeleteMasivo = async () => {
    const confirmacion = window.confirm(`¿Estás seguro de que deseas ELIMINAR PERMANENTEMENTE a ${selectedStudents.length} alumnos seleccionados? Esta acción no se puede deshacer.`);
    if (!confirmacion) return;

    try {
      for (const studentId of selectedStudents) {
        await deleteDoc(doc(db, "students", studentId));
      }
      await registrarMovimiento(auth.currentUser?.email, 'Control Escolar', 'Eliminación Masiva', `Se eliminaron permanentemente ${selectedStudents.length} alumnos de forma masiva.`);
      toast.success(`¡${selectedStudents.length} alumnos eliminados con éxito!`);
      setSelectedStudents([]);
    } catch (error) {
      console.error(error);
      toast.error("Hubo un error al eliminar de forma masiva.");
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = "matricula\tcurp\tescuelaProcedencia\tdomicilioEscuela\tpromedioEscuela\tnombres\tapellidoPaterno\tapellidoMaterno\tgenero\tfechaNacimiento\ttipoSangre\tlentes\talergias\tpadecimientos\tgrado\tgrupo\tturno\tcalleNumero\tcolonia\tcodigoPostal\ttutor\tcelularTutor\treferencia1\tcelularRef1\treferencia2\tcelularRef2\n" +
                       "2026EST1234\tCURP1234567890\tEscuela Primaria Sor Juana\tAv. Siempre Viva 123\t9.5\tJuan Carlos\tPerez\tGarcia\tHombre\t2014-05-15\tO+\tNO\tNinguna\tNinguno\t1er Grado\tA\tMatutino\tCalle Falsa 123\tCentro\t39000\tMaria Garcia\t7471234567\tTio Pedro\t7477654321\tAbuela Carmen\t7479876543";
    downloadExcelFriendlyCsv('Plantilla_Importacion_Alumnos.csv', csvContent.toUpperCase());
  };

  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      let content = event.target.result;
      if (content.startsWith("sep=,\n") || content.startsWith("sep=,\r\n")) {
         content = content.substring(content.indexOf('\n') + 1);
      } else if (content.startsWith("\uFEFFsep=,\n") || content.startsWith("\uFEFFsep=,\r\n")) {
         content = "\uFEFF" + content.substring(content.indexOf('\n') + 1);
      }

      Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase()
        .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i')
        .replace(/ó/g, 'o').replace(/ú/g, 'u'),
      complete: async (results) => {
        const data = results.data;
        if (!data || data.length === 0) {
          alert("El archivo está vacío.");
          return;
        }
        
        const confirmacion = window.confirm(`Se encontraron ${data.length} alumnos en el archivo. ¿Deseas importarlos?`);
        if (!confirmacion) return;

        let importados = 0;
        let duplicados = 0;
        let errores = 0;

        const getV = (row, ...keys) => {
          for (let k of keys) {
            if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
              return String(row[k]).trim();
            }
          }
          return '';
        };

        for (const row of data) {
          try {
            const curpVal = getV(row, 'curp').toUpperCase();
            if (!curpVal) {
              errores++;
              continue;
            }

            // Validar duplicado por CURP en Firestore
            const qCurp = query(collection(db, "students"), where("curp", "==", curpVal));
            const snapCurp = await getDocs(qCurp);

            if (!snapCurp.empty) {
              duplicados++;
              continue; // Omitir duplicado
            }

            const rawGrupo = getV(row, 'grupo', 'grupos');

            await addDoc(collection(db, "students"), {
              matricula: getV(row, 'matricula', 'matriculas'),
              curp: curpVal,
              escuelaProcedencia: getV(row, 'escuelaprocedencia', 'escuela de procedencia', 'escuela', 'procedencia'),
              domicilioEscuela: getV(row, 'domicilioescuela', 'domicilio de escuela'),
              promedioEscuela: getV(row, 'promedioescuela', 'promedio', 'calificacion'),
              nombres: getV(row, 'nombres', 'nombre', 'nombre(s)', 'alumno'),
              apellidoPaterno: getV(row, 'apellidopaterno', 'paterno', 'apellido paterno'),
              apellidoMaterno: getV(row, 'apellidomaterno', 'materno', 'apellido materno'),
              grado: getV(row, 'grado', 'grados'),
              grupo: rawGrupo,
              turno: getV(row, 'turno', 'turnos'),
              taller: rawGrupo ? getTallerPorGrupo(rawGrupo) : 'Por asignar',
              calle: getV(row, 'callenumero', 'calle y numero', 'calle', 'direccion', 'domicilio'),
              numero: getV(row, 'numero', 'num', 'no', 'no.'),
              colonia: getV(row, 'colonia', 'fraccionamiento'),
              cp: getV(row, 'codigopostal', 'cp', 'c.p.'),
              genero: getV(row, 'genero', 'sexo'),
              fechaNacimiento: getV(row, 'fechanacimiento', 'fecha de nacimiento', 'nacimiento'),
              tipoSangre: getV(row, 'tiposangre', 'tipo de sangre', 'sangre'),
              lentes: getV(row, 'lentes', 'usa lentes'),
              alergias: getV(row, 'alergias', 'alergico a'),
              padecimientos: getV(row, 'padecimientos', 'padecimientos cronicos', 'enfermedades'),
              tutorNombre: getV(row, 'tutor', 'nombre del tutor', 'nombre tutor', 'padre o tutor', 'madre', 'padre', 'contacto principal'),
              tutorParentesco: getV(row, 'parentesco', 'parentesco tutor'),
              telefono: getV(row, 'celulartutor', 'celular tutor', 'telefono tutor', 'telefono del tutor', 'celular', 'telefono', 'tel', 'tel tutor'),
              emergenciaNombre1: getV(row, 'referencia1', 'referencia 1', 'referencia', 'contacto de emergencia', 'contacto', 'nombre de emergencia'),
              emergenciaParentesco1: getV(row, 'parentescoref1', 'parentesco referencia', 'parentesco emergencia'),
              emergenciaTel1: getV(row, 'celularref1', 'celular referencia 1', 'telefono de emergencia', 'telefono emergencia', 'tel emergencia', 'celular emergencia'),
              emergenciaNombre2: getV(row, 'referencia2', 'referencia 2'),
              emergenciaTel2: getV(row, 'celularref2', 'celular referencia 2'),
              status: "Activo",
              fechaRegistro: serverTimestamp()
            });
            importados++;
          } catch (error) {
            console.error("Error importando fila:", row, error);
            errores++;
          }
        }
        alert(`Importación completada.\n\nÉxitos: ${importados}\nDuplicados omitidos: ${duplicados}\nErrores: ${errores}`);
      },
      error: (error) => {
        alert("Error al leer el archivo CSV: " + error.message);
      }
    });
    };
    reader.readAsText(file);
    
    // Limpiar input
    e.target.value = null;
  };

  const handleCopyWhatsApp = () => {
    if (filteredDirectorio.length === 0) {
      alert("No hay alumnos en la lista filtrada para extraer teléfonos.");
      return;
    }
    
    let vcfContent = "";
    let evaluatedCount = 0;
    let missingCount = 0;
    let shortCount = 0;
    let validCount = 0;

    filteredDirectorio.forEach(student => {
      evaluatedCount++;
      const rawPhone = student.telefono || student.celularTutor || student.madreTelefono || student.padreTelefono;
      if (!rawPhone) {
        missingCount++;
        return;
      }
      
      const phoneStr = String(rawPhone);
      const cleanPhone = phoneStr.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        shortCount++;
        return;
      }
      
      let finalPhone = cleanPhone;
      if (finalPhone.length === 10) finalPhone = "+52" + finalPhone;
      else if (finalPhone.length === 12 && finalPhone.startsWith("52")) finalPhone = "+" + finalPhone;

      const tutorName = student.tutorNombre || student.tutor || "Tutor";
      const contactName = `Tutor ${student.grado}${student.grupo} - ${student.nombres} ${student.apellidoPaterno} (${tutorName})`;
      
      vcfContent += `BEGIN:VCARD\nVERSION:3.0\nFN:${contactName}\nTEL;TYPE=CELL:${finalPhone}\nEND:VCARD\n`;
      validCount++;
    });

    if (validCount === 0) {
      alert("No se encontraron números de teléfono válidos en los alumnos mostrados.");
      return;
    }

    const blob = new Blob([vcfContent], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Contactos_WhatsApp.vcf");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert(`Detalle de la exportación:\n\n` + 
          `- Alumnos en la tabla: ${evaluatedCount}\n` +
          `- Sin número registrado: ${missingCount}\n` +
          `- Número demasiado corto: ${shortCount}\n` +
          `- Exportados correctamente: ${validCount}\n\n` +
          `Se descargó un archivo con ${validCount} contactos. (Nota: Si tu celular reporta importar menos contactos, es porque los celulares fusionan automáticamente a los papás que tienen exactamente el mismo número telefónico, por ejemplo hermanos).`);
  };
  
  const handleExportCSV = () => {
    if (filteredDirectorio.length === 0) {
      alert("No hay alumnos en la lista filtrada para exportar.");
      return;
    }
    
    const dataToExport = filteredDirectorio.map(a => ({
      'Matrícula': a.matricula || '',
      'CURP': a.curp || '',
      'Primer Apellido': a.apellidoPaterno || '',
      'Segundo Apellido': a.apellidoMaterno || '',
      'Nombre(s)': a.nombres || '',
      'Grado': a.grado || '',
      'Grupo': a.grupo || '',
      'Turno': a.turno || '',
      'Taller': a.taller || '',
      'Estatus': a.status || 'Activo',
      'Tutor': a.tutorNombre || a.tutor || '',
      'Teléfono Tutor': a.telefono || a.celularTutor || '',
      'Domicilio': `${a.calle || ''} ${a.numero || ''}, Col. ${a.colonia || ''}, CP ${a.cp || ''}`.trim(),
      'Tipo de Sangre': a.tipoSangre || '',
      'Alergias': a.alergias || '',
      'Padecimientos': a.padecimientos || '',
      'Escuela de Procedencia': a.escuelaProcedencia || '',
      'Promedio Primaria': a.promedioEscuela || ''
    }));

    const csv = Papa.unparse(dataToExport, { delimiter: '\t' }).toUpperCase();
    downloadExcelFriendlyCsv(`Directorio_Alumnos_${new Date().toISOString().split('T')[0]}.csv`, csv);
  };

  const filteredPendientes = pendientes.filter(p => searchIncludes(`${p.nombres} ${p.apellidoPaterno} ${p.apellidoMaterno} ${p.curp}`, searchAspirantes));

  return (
    <div className="h-full flex flex-col relative print:bg-white">
      {/* Precarga de imágenes para la impresión */}
      <div className="hidden">
        <img src="/logo-sep.png" alt="preload-sep" />
        <img src="/logo-escuela.png" alt="preload-escuela" />
      </div>
      <div className={printMode ? "hidden" : "space-y-6 relative print:hidden"}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Control Escolar</h2>
          <p className="text-slate-500 text-sm">Gestión de expedientes, inscripciones y calificaciones.</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end items-center">
            <div className="flex items-center bg-white rounded-lg border border-slate-300 p-1 mr-2 shadow-sm">
              <span className="text-xs font-medium text-slate-500 px-2">Turno:</span>
              <select className="bg-transparent border-none text-sm font-bold text-slate-700 outline-none cursor-pointer" value={globalShiftFilter} onChange={e => setGlobalShiftFilter(e.target.value)}>
                <option value="Todos">Ambos (Global)</option>
                <option value="Matutino">Matutino</option>
                <option value="Vespertino">Vespertino</option>
              </select>
            </div>

          <button onClick={handleDownloadTemplate} className="flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors shadow-sm">
            <Download className="w-4 h-4 mr-2 text-slate-500" /> Descargar Plantilla
          </button>
          <label className="cursor-pointer flex items-center px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
            <Upload className="w-4 h-4 mr-2 text-primary-600" /> Importar CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
          </label>
          <button onClick={() => openModal('addStudent')} className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm">
            <UserPlus className="w-4 h-4 mr-2" /> Agregar Alumno
          </button>
          <button onClick={handleCopyWhatsApp} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors shadow-sm">
            <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
          </button>
          <button onClick={handleExportCSV} className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm">
            <Download className="w-4 h-4 mr-2" /> Exportar Activos
          </button>
        </div>
      </div>

      {/* Módulos de Navegación (Tabs envueltos) */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Módulos de Control Escolar</h3>
        <div className="flex flex-wrap gap-2">
          
          {/* Trámites Pagados */}
          <button onClick={() => setActiveTab('pagados')} className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${activeTab === 'pagados' ? 'bg-emerald-600 text-white shadow-emerald-200 ring-2 ring-emerald-600 ring-offset-1' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}>
            Trámites Pagados <span className={`ml-2 py-0.5 px-2 rounded-full text-xs font-bold ${activeTab === 'pagados' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}>{tramitesPagados.filter(t => t.estado === 'Pendiente').length}</span>
          </button>
          {/* Pendientes */}
          <button onClick={() => setActiveTab('pendientes')} className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${activeTab === 'pendientes' ? 'bg-primary-600 text-white shadow-primary-200 ring-2 ring-primary-600 ring-offset-1' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}>
            Solicitudes Pendientes <span className={`ml-2 py-0.5 px-2 rounded-full text-xs font-bold ${activeTab === 'pendientes' ? 'bg-primary-500 text-white' : 'bg-indigo-100 text-indigo-700'}`}>{pendientes.length}</span>
          </button>
          
          {/* Activos */}
          <button onClick={() => setActiveTab('activos')} className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${activeTab === 'activos' ? 'bg-primary-600 text-white shadow-primary-200 ring-2 ring-primary-600 ring-offset-1' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}>
            Directorio / Expedientes <span className={`ml-2 py-0.5 px-2 rounded-full text-xs font-bold ${activeTab === 'activos' ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-600'}`}>{activos.length}</span>
          </button>
          
          {/* Generaciones */}
          <button onClick={() => setActiveTab('generaciones')} className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${activeTab === 'generaciones' ? 'bg-slate-800 text-white shadow-slate-200 ring-2 ring-slate-800 ring-offset-1' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}>
            Generaciones Egresadas <GraduationCap className={`w-3.5 h-3.5 ml-2 ${activeTab === 'generaciones' ? 'text-slate-100' : 'text-slate-500'}`} />
          </button>
          
          <button style={{display: 'none'}} onClick={() => setActiveTab('fake')}  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${activeTab === 'activos' ? 'bg-primary-600 text-white shadow-primary-200 ring-2 ring-primary-600 ring-offset-1' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}>
            Directorio / Expedientes <span className={`ml-2 py-0.5 px-2 rounded-full text-xs font-bold ${activeTab === 'activos' ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-600'}`}>{directorio.length}</span>
          </button>
          
          {/* Calificaciones */}
          <button onClick={() => setActiveTab('calificaciones')} className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${activeTab === 'calificaciones' ? 'bg-indigo-500 text-white shadow-indigo-200 ring-2 ring-indigo-500 ring-offset-1' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}>
            Calificaciones <Star className={`w-3.5 h-3.5 ml-2 ${activeTab === 'calificaciones' ? 'text-indigo-100' : 'text-indigo-500'}`} />
          </button>

          {/* Regularización / Extraordinarios */}
          <button onClick={() => setActiveTab('regularizacion')} className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${activeTab === 'regularizacion' ? 'bg-orange-600 text-white shadow-orange-200 ring-2 ring-orange-600 ring-offset-1' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}>Extraordinarios de Regularización</button>
          
          {/* Asistencia */}
          <button onClick={() => setActiveTab('asistencia')} className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${activeTab === 'asistencia' ? 'bg-emerald-600 text-white shadow-emerald-200 ring-2 ring-emerald-600 ring-offset-1' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}>
            Listas de Asistencia
          </button>

          {/* Bitácora de Movimientos */}
          <button onClick={() => setActiveTab('bitacora')} className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${activeTab === 'bitacora' ? 'bg-indigo-600 text-white shadow-indigo-200 ring-2 ring-indigo-600 ring-offset-1' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}>
            Bitácora de Movimientos
          </button>

          {/* Matrícula */}
          <button onClick={() => setActiveTab('matricula')} className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${activeTab === 'matricula' ? 'bg-indigo-600 text-white shadow-indigo-200 ring-2 ring-indigo-600 ring-offset-1' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}>
            Estadística Matrícula
          </button>

          <button onClick={() => setActiveTab('matriculaGrupos')} className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${activeTab === 'matriculaGrupos' ? 'bg-indigo-600 text-white shadow-indigo-200 ring-2 ring-indigo-600 ring-offset-1' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}>
            Matrícula por Grupos
          </button>

          {/* Aprovechamiento */}
          <button onClick={() => setActiveTab('aprovechamiento')} className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${activeTab === 'aprovechamiento' ? 'bg-indigo-600 text-white shadow-indigo-200 ring-2 ring-indigo-600 ring-offset-1' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}>
            Aprovechamiento
          </button>
          
          {/* SEP E2 */}
          <button onClick={() => setActiveTab('aprobacion')} className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${activeTab === 'aprobacion' ? 'bg-sky-600 text-white shadow-sky-200 ring-2 ring-sky-600 ring-offset-1' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}>
            Aprobación (E2)
          </button>
          
          {/* SEP E4 */}
          <button onClick={() => setActiveTab('eficiencia')} className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${activeTab === 'eficiencia' ? 'bg-sky-600 text-white shadow-sky-200 ring-2 ring-sky-600 ring-offset-1' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}>
            Eficiencia Terminal (E4)
          </button>
          
          {/* SEP E5 */}
          <button onClick={() => setActiveTab('desempeno')} className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${activeTab === 'desempeno' ? 'bg-sky-600 text-white shadow-sky-200 ring-2 ring-sky-600 ring-offset-1' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}>
            Desempeño Alcanzado (E5)
          </button>

          {/* SEP E6 */}
          <button onClick={() => setActiveTab('desertores')} className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${activeTab === 'desertores' ? 'bg-sky-600 text-white shadow-sky-200 ring-2 ring-sky-600 ring-offset-1' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}>
            Desertores (E6)
          </button>
        </div>
      </div>

      {loading && <p className="text-center py-8 text-slate-500 animate-pulse">Cargando base de datos...</p>}

      
      {/* Tabla Trámites Pagados */}
      {!loading && activeTab === 'pagados' && (
        <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-x-auto mt-4">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Trámite</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Alumno</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Turno</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Fecha Pago</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {tramitesPagados.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">No hay trámites pagados en cola.</td></tr>
              ) : (
                tramitesPagados.map(t => (
                  <tr key={t.id} className={t.estado === 'Entregado' ? 'bg-slate-50 opacity-60' : 'bg-white hover:bg-slate-50'}>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${t.estado === 'Pendiente' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {t.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">{t.conceptoPago}</td>
                    <td className="px-6 py-4 text-sm font-bold text-primary-700">{t.nombreAlumno}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 uppercase">{t.turno || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{new Date(t.fechaSolicitud).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-right space-x-2">
                      {t.estado === 'Pendiente' ? (
                        <button onClick={() => handleMarcarTramiteEntregado(t.id)} className="px-3 py-1.5 bg-emerald-600 text-white rounded font-medium text-xs hover:bg-emerald-700 transition">
                          Marcar Entregado
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">Entregado el {new Date(t.fechaEntrega).toLocaleDateString()}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tabla Pendientes */}
        {!loading && activeTab === 'pendientes' && (
          <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-x-auto">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex">
              <input type="text" placeholder="Buscar aspirante por nombre o CURP..." value={searchAspirantes} onChange={(e) => setSearchAspirantes(e.target.value)} className="w-full max-w-md px-4 py-2 border border-slate-300 rounded-md focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
            <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Trámite</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Alumno</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Grado / Escuela Anterior</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Fecha Solicitud</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredPendientes.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No hay solicitudes pendientes.</td></tr>
              ) : (
                filteredPendientes.map(p => (
                  <tr key={p.id}>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs">{p.tipoTramite || 'Nuevo Ingreso'}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-semibold uppercase">
                      {p.apellidoPaterno} {p.apellidoMaterno} {p.nombres}
                      {(!p.documentos?.acta || !p.documentos?.curp || !p.documentos?.certificado || !p.documentos?.ine || !p.documentos?.domicilio) && (
                        <span className="mt-1 flex items-center text-[10px] text-red-500 font-bold normal-case">
                          <AlertTriangle className="w-3 h-3 mr-1" /> Faltan Documentos Digitales
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {p.grado} <br/> <span className="text-xs text-slate-400">{p.escuelaProcedencia}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                        {p.fechaRegistro ? (p.fechaRegistro?.toDate ? p.fechaRegistro.toDate().toLocaleDateString('es-MX') : new Date(p.fechaRegistro).toLocaleDateString('es-MX')) : 'N/A'}
                      </td>
                    <td className="px-6 py-4 text-right space-x-2">
                        <button onClick={() => openModal('hoja', p)} className="text-blue-600 font-medium text-sm hover:bg-blue-50 px-3 py-1 rounded border border-blue-200 transition-colors mr-2">
                          Revisar Expediente
                        </button>
                        <button onClick={() => setSelectedExpediente(p)} className="text-purple-600 hover:text-purple-800 font-medium text-sm inline-flex items-center ml-4">
                          <FolderOpen className="w-4 h-4 mr-1" /> Docs Digitales
                        </button>
                        <button onClick={() => aceptarAspirante(p)} className="text-emerald-600 font-medium text-sm hover:bg-emerald-50 px-3 py-1 rounded border border-emerald-200 transition-colors">
                        Aceptar Aspirante
                      </button>
                      <button onClick={() => handleDeleteStudent(p)} className="text-red-500 font-medium text-sm hover:bg-red-50 px-3 py-1 rounded border border-red-200 transition-colors">
                        Eliminar
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
        <Calificaciones activos={activos} materiasPorGrado={materiasPorGrado} onPrintBoleta={handlePrintBoleta} onPrintConcentradoFinal={handlePrintConcentradoFinal} onPrintConcentradoParcial={handlePrintConcentradoParcial} />
      )}

      {/* Bitacora */}
      {!loading && activeTab === 'bitacora' && (
        <BitacoraTab />
      )}

      {/* Tabla Listas de Asistencia */}
      {!loading && activeTab === 'asistencia' && (
        <div className="space-y-6">
          {/* Controles de Filtro */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-1/5">
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Grado</label>
              <select value={asisGrado} onChange={e => setAsisGrado(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg font-medium text-slate-700 bg-slate-50">
                <option value="1er Grado">1er Grado</option>
                <option value="2do Grado">2do Grado</option>
                <option value="3er Grado">3er Grado</option>
              </select>
            </div>
            <div className="w-full md:w-1/5">
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Grupo</label>
              <select value={asisGrupo} onChange={e => setAsisGrupo(e.target.value)} translate="no" className="notranslate w-full p-2.5 border border-slate-300 rounded-lg font-medium text-slate-700 bg-slate-50">
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="E">E</option>
                <option value="F">F</option>
                <option value="G">G</option>
                <option value="H">H</option>
                <option value="I">I</option>
                <option value="J">J</option>
                <option value="K">K</option>
                <option value="L">L</option>
              </select>
            </div>
            <div className="w-full md:w-1/5">
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Mes de Asistencia</label>
              <select value={asisMes} onChange={e => setAsisMes(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg font-bold text-primary-700 bg-primary-50">
                <option value="Septiembre">Septiembre</option>
                <option value="Octubre">Octubre</option>
                <option value="Noviembre">Noviembre</option>
                <option value="Diciembre">Diciembre</option>
                <option value="Enero">Enero</option>
                <option value="Febrero">Febrero</option>
                <option value="Marzo">Marzo</option>
                <option value="Abril">Abril</option>
                <option value="Mayo">Mayo</option>
                <option value="Junio">Junio</option>
              </select>
            </div>
            <div className="w-full md:w-1/5">
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Tamaño de Hoja</label>
              <select value={asisPaperSize} onChange={e => setAsisPaperSize(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg font-bold text-teal-700 bg-teal-50">
                <option value="letter">Carta (Letter)</option>
                <option value="legal">Oficio (Oficio / Legal)</option>
              </select>
            </div>
            <div className="flex-1 flex justify-end w-full md:w-auto">
              <button 
                onClick={() => {
                  if (asisAlumnos.length === 0) {
                    alert("No hay alumnos activos en este grado y grupo.");
                    return;
                  }
                  setPrintData({ students: asisAlumnos, grado: asisGrado, grupo: asisGrupo, mes: asisMes, paperSize: asisPaperSize });
                  setPrintMode('listaAsistencia');
                  setTimeout(() => window.print(), 500);
                }} 
                className="flex items-center justify-center w-full md:w-auto px-6 py-2.5 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition shadow-md"
              >
                <Printer className="w-5 h-5 mr-2" /> Imprimir Lista Oficial
              </button>
            </div>
          </div>
          {asisGrado === '3er Grado' && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-end mt-4">
              <div className="w-full md:flex-1">
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Nombre del Asesor (Opcional - Para lista de clausura)</label>
                <input 
                  type="text" 
                  value={asesorNombre} 
                  onChange={e => setAsesorNombre(autoAcentuar(e.target.value))} 
                  placeholder="Ej. Profa. María Pérez" 
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-medium text-slate-700 bg-white"
                />
              </div>
              <div className="w-full md:w-auto">
                <button 
                  onClick={() => {
                    if (asisAlumnos.length === 0) {
                      alert("No hay alumnos activos en este grado y grupo.");
                      return;
                    }
                    setPrintData({ students: asisAlumnos, grado: asisGrado, grupo: asisGrupo, asesor: asesorNombre });
                    setPrintMode('listaClausura');
                    setTimeout(() => window.print(), 500);
                  }} 
                  className="flex items-center justify-center w-full md:w-auto px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition shadow-md"
                >
                  <Award className="w-5 h-5 mr-2" /> Imprimir Lista Clausura (3ro)
                </button>
              </div>
            </div>
          )}


          {/* Listado de Alumnos en la Vista Previa */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-semibold text-slate-700">Vista Previa de la Lista ({asisAlumnos.length} Alumnos)</h3>
            </div>
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase w-12">No.</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Matrícula</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Nombre del Alumno</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Taller</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Turno</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {asisAlumnos.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-slate-500 bg-slate-50">
                      No hay alumnos activos inscritos en {asisGrado} "{asisGrupo}".
                    </td>
                  </tr>
                ) : (
                  asisAlumnos.map((al, index) => (
                    <tr key={al.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 text-sm font-bold text-slate-400">{index + 1}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-primary-700">{al.matricula}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-700 uppercase">{al.apellidoPaterno} {al.apellidoMaterno} {al.nombres}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{al.taller || '-'}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{al.turno || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tabla Activos / Directorio */}
      {!loading && activeTab === 'activos' && (
        <div className="space-y-4">
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col gap-5 shadow-sm">
            
            {/* Primera fila: Buscador y Acciones Globales */}
            <div className="flex flex-col md:flex-row gap-4 items-end justify-between">
              <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Buscar en el Directorio</label>
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                  <input type="text" className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-300 rounded-xl text-base font-medium text-slate-800 bg-white focus:ring-primary-500 focus:border-primary-500 shadow-sm placeholder-slate-400 transition-all" placeholder="Escribe el nombre, apellidos o matrícula..." value={searchFilter} onChange={e => setSearchFilter(e.target.value)} />
                </div>
              </div>
              <div className="w-full md:w-auto flex flex-wrap gap-2 justify-end">
                <button onClick={() => setModalType('ajustes')} className="px-4 py-2.5 bg-white text-slate-700 border border-slate-300 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm flex items-center">
                  <Settings className="w-4 h-4 mr-2" /> Ajustes Globales
                </button>
                <button onClick={() => setModalType('cierreCiclo')} className="px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors shadow-sm flex items-center">
                  <GraduationCap className="w-4 h-4 mr-2" /> Cerrar Ciclo
                </button>
              </div>
            </div>

            {/* Segunda fila: Filtros y Acciones Masivas */}
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="w-full md:w-48">
                <label className="block text-xs font-medium text-slate-500 mb-1">Grado</label>
                <select className="w-full p-2 border border-slate-300 rounded-lg text-sm font-medium bg-white" value={gradeFilter} onChange={e => setGradeFilter(e.target.value)}>
                  <option value="Todos">Todos los Grados</option>
                  <option value="1er Grado">1er Grado</option>
                  <option value="2do Grado">2do Grado</option>
                  <option value="3er Grado">3er Grado</option>
                </select>
              </div>
              <div className="w-full md:w-48">
                <label className="block text-xs font-medium text-slate-500 mb-1">Grupo</label>
                <select translate="no" className="notranslate w-full p-2 border border-slate-300 rounded-lg text-sm font-medium bg-white" value={groupFilter} onChange={e => setGroupFilter(e.target.value)}>
                  <option value="Todos">Todos los Grupos</option>
                  <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option><option value="E">E</option><option value="F">F</option><option value="G">G</option><option value="H">H</option><option value="I">I</option><option value="J">J</option><option value="K">K</option><option value="L">L</option>
                </select>
              </div>
              <div className="w-full md:w-32">
                <label className="block text-xs font-medium text-slate-500 mb-1">Estatus</label>
                <select className="w-full p-2 border border-slate-300 rounded-lg text-sm font-medium bg-white" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="Todos">Todos</option>
                  <option value="Activo">Activos</option>
                  <option value="Baja">Bajas</option>
                  <option value="Egresado">Egresados</option>
                  <option value="Pendiente">Pendientes</option>
                </select>
              </div>
              <div className="w-full md:w-36">
                <label className="block text-xs font-medium text-slate-500 mb-1">Ciclo Escolar</label>
                <select className="w-full p-2 border border-slate-300 rounded-lg text-sm font-medium bg-white text-primary-700" value={cycleFilter} onChange={e => setCycleFilter(e.target.value)}>
                  <option value="Todos">Todos</option>
                  <option value={config?.cicloEscolarActual || "2025-2026"}>{config?.cicloEscolarActual || "2025-2026"}</option>
                  <option value="2026-2027">2026-2027</option>
                  <option value="2027-2028">2027-2028</option>
                  <option value="2028-2029">2028-2029</option>
                </select>
              </div>
              
              {/* Acciones para el grupo o masivas */}
              <div className="flex-1 flex justify-end gap-2 flex-wrap">
                <button onClick={handlePrintBatch} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-900 transition-colors shadow-sm flex items-center">
                  <QrCode className="w-4 h-4 mr-2" /> Credenciales del Grupo
                </button>
                {selectedStudents.length > 0 && (
                  <>
                    <button onClick={() => setModalType('asignacionMasiva')} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm flex items-center">
                      Asignar ({selectedStudents.length})
                    </button>
                    <button onClick={handleDeleteMasivo} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors shadow-sm flex items-center">
                      <Trash2 className="w-4 h-4 mr-1" /> ({selectedStudents.length})
                    </button>
                  </>
                )}
              </div>
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
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium uppercase">
                      {a.apellidoPaterno} {a.apellidoMaterno} {a.nombres}
                      {(!a.documentos?.acta || !a.documentos?.curp || !a.documentos?.certificado || !a.documentos?.ine || !a.documentos?.domicilio) && (
                        <span className="mt-1 flex items-center text-[10px] text-red-500 font-bold normal-case">
                          <AlertTriangle className="w-3 h-3 mr-1" /> Faltan Documentos Digitales
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      <div className="font-semibold text-slate-700">{a.grado} "{a.grupo || '-'}"</div>
                      <div className="text-xs text-slate-500">{a.taller || '-'}</div>
                      <div className="text-xs text-slate-400">{a.turno || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-4">
                      <button onClick={() => openModal('hoja', a)} className="text-blue-600 hover:text-blue-800 font-medium text-sm inline-flex items-center">
                        <User className="w-4 h-4 mr-1" /> Expediente
                      </button>
                        <button onClick={() => setSelectedExpediente(a)} className="text-purple-600 hover:text-purple-800 font-medium text-sm inline-flex items-center ml-4">
                          <FolderOpen className="w-4 h-4 mr-1" /> Docs Digitales
                        </button>
                      <button onClick={() => openModal('grade', a)} className="text-emerald-600 hover:text-emerald-800 font-medium text-sm inline-flex items-center">
                        <Star className="w-4 h-4 mr-1" /> Calificar
                      </button>
                      <button onClick={() => handlePrintConstancia(a)} className="text-indigo-600 hover:text-indigo-800 font-medium text-sm inline-flex items-center">
                        <FileText className="w-4 h-4 mr-1" /> Constancia
                      </button>
                      <button onClick={() => openModal('acuseRec', a)} className="text-sky-600 hover:text-sky-800 font-medium text-sm inline-flex items-center">
                        <FileText className="w-4 h-4 mr-1" /> Acuse Recibir
                      </button>
                      <button onClick={() => openModal('acuse', a)} className="text-sky-600 hover:text-sky-800 font-medium text-sm inline-flex items-center">
                        <FileText className="w-4 h-4 mr-1" /> Acuse Devolver
                      </button>
                      <button onClick={() => handlePrintSingle(a)} title={!a.pagoInscripcion ? 'Bloqueada por falta de pago' : ''} className={`font-medium text-sm inline-flex items-center ${a.pagoInscripcion ? 'text-slate-500 hover:text-slate-800' : 'text-slate-300 hover:text-slate-400 cursor-not-allowed'}`}>
                        <QrCode className="w-4 h-4 mr-1" /> Credencial
                      </button>
                      <button onClick={() => handleDeleteStudent(a)} className="text-red-500 hover:text-red-700 font-medium text-sm inline-flex items-center">
                        <Trash2 className="w-4 h-4 mr-1" /> Eliminar
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



      
      {/* Tabla Generaciones Egresadas */}
      {!loading && activeTab === 'generaciones' && (
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 mb-1">Generación</label>
              <select className="w-full p-2 border rounded-lg text-sm bg-white font-bold text-slate-700" value={generacionFilter} onChange={e => setGeneracionFilter(e.target.value)}>
                <option value="Todos">Todas las Generaciones</option>
                {generacionList.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 mb-1">Buscar Alumno</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input type="text" className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm bg-white" placeholder="Ej. Juan Pérez" value={searchFilter} onChange={e => setSearchFilter(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Matrícula</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Alumno</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Generación</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Estado Final</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {directorio.filter(s => s.status === 'Egresado' && (generacionFilter === 'Todos' || s.generacionEgreso === generacionFilter) && 
                 (searchFilter === '' || searchIncludes(`${s.nombres} ${s.apellidoPaterno} ${s.apellidoMaterno}`, searchFilter))
              ).length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No hay egresados que coincidan.</td></tr>
              ) : (
                directorio.filter(s => s.status === 'Egresado' && (generacionFilter === 'Todos' || s.generacionEgreso === generacionFilter) && 
                 (searchFilter === '' || searchIncludes(`${s.nombres} ${s.apellidoPaterno} ${s.apellidoMaterno}`, searchFilter))
                ).map(a => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-bold text-primary-700">{a.matricula}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium uppercase">
                      {a.apellidoPaterno} {a.apellidoMaterno} {a.nombres}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-bold">
                      {a.generacionEgreso || 'Sin registrar'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${a.grado?.includes('reprobadas') ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {a.grado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-4">
                      <button onClick={() => openModal('hoja', a)} className="text-blue-600 hover:text-blue-800 font-medium text-sm inline-flex items-center">
                        <User className="w-4 h-4 mr-1" /> Expediente
                      </button>
                        <button onClick={() => setSelectedExpediente(a)} className="text-purple-600 hover:text-purple-800 font-medium text-sm inline-flex items-center ml-4">
                          <FolderOpen className="w-4 h-4 mr-1" /> Docs Digitales
                        </button>
                      <button onClick={() => { setPrintData(a); setPrintMode('kardex'); }} className="text-purple-600 hover:text-purple-800 font-medium text-sm inline-flex items-center">
                        <FileText className="w-4 h-4 mr-1" /> Kárdex
                      </button>
                      <button onClick={() => handlePrintConstancia(a)} className="text-indigo-600 hover:text-indigo-800 font-medium text-sm inline-flex items-center ml-4">
                        <FileText className="w-4 h-4 mr-1" /> Constancia
                      </button>
                      <button onClick={() => openModal('acuse', a)} className="text-sky-600 hover:text-sky-800 font-medium text-sm inline-flex items-center ml-4">
                        <FileText className="w-4 h-4 mr-1" /> Acuse Devolver
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

      {/* MODAL DE CIERRE DE CICLO */}
      {modalType === 'cierreCiclo' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto print:hidden">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-red-200 flex justify-between items-center bg-red-50">
              <h3 className="font-bold text-red-800 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Cierre de Ciclo Escolar Masivo
              </h3>
              <button onClick={closeModal} className="text-red-400 hover:text-red-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-4">
                Este proceso ejecutará el cambio de grado para <strong>todos los alumnos activos ({activos.length})</strong> automáticamente:
              </p>
              <ul className="text-sm text-slate-600 list-disc pl-5 space-y-2 mb-6">
                <li>Los alumnos de <strong>1ro</strong> pasarán a 2do (o 2do Irregular).</li>
                <li>Los alumnos de <strong>2do</strong> pasarán a 3ro (o 3ro Irregular).</li>
                <li>Los alumnos de <strong>3ro</strong> se convertirán en <strong>Egresados</strong> y se almacenarán en la pestaña de Generaciones.</li>
                <li><strong>Todos conservarán su grupo (A, B, C...) y su taller.</strong></li>
              </ul>

              <div className="mb-6 bg-slate-50 p-4 border border-slate-200 rounded-lg">
                <label className="block text-sm font-bold text-slate-700 mb-2">Generación de Egreso para alumnos de 3ro:</label>
                <input 
                  type="text" 
                  value={cicloEgreso} 
                  onChange={e => setCicloEgreso(e.target.value)} 
                  className="w-full p-2 border border-slate-300 rounded font-medium focus:border-red-500 focus:ring-red-500" 
                  placeholder="Ej. 2023-2026"
                />
              </div>

              <div className="mb-6 bg-slate-50 p-4 border border-slate-200 rounded-lg">
                <label className="block text-sm font-bold text-slate-700 mb-2">Nueva Leyenda Oficial del Año:</label>
                <input 
                  type="text" 
                  value={leyendaOficial} 
                  onChange={e => setLeyendaOficial(e.target.value)} 
                  className="w-full p-2 border border-slate-300 rounded font-medium focus:border-red-500 focus:ring-red-500" 
                  placeholder="Ej. '2027, Año de...'"
                />
                <p className="text-xs text-slate-500 mt-1">Este texto aparecerá en todas las constancias de estudio a partir de hoy.</p>
              </div>

              <button onClick={handleCerrarCiclo} className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 flex justify-center items-center shadow-lg transition-colors">
                <GraduationCap className="w-5 h-5 mr-2" /> Ejecutar Cierre de Ciclo Escolar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AJUSTES GLOBALES */}
      {modalType === 'ajustes' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center">
                <Settings className="w-5 h-5 mr-2 text-slate-600" />
                Configuración Global del Sistema
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-6">
                Estos ajustes afectan las fechas y leyendas de <strong>todas</strong> las constancias, boletas y credenciales impresas en el sistema.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Ciclo Escolar Vigente:</label>
                  <input 
                    type="text" 
                    defaultValue={config?.cicloEscolarActual || '2025-2026'}
                    id="input-ciclo"
                    className="w-full p-2 border border-slate-300 rounded focus:border-primary-500 focus:ring-primary-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Leyenda Oficial del Año:</label>
                  <input 
                    type="text" 
                    defaultValue={config?.leyendaOficial || '"2026, Año de Margarita Maza"'}
                    id="input-leyenda"
                    className="w-full p-2 border border-slate-300 rounded focus:border-primary-500 focus:ring-primary-500" 
                  />
                </div>
              </div>

              <div className="mt-8">
                <button onClick={() => {
                  const c = document.getElementById('input-ciclo').value;
                  const l = document.getElementById('input-leyenda').value;
                  updateConfig({ cicloEscolarActual: c, leyendaOficial: l });
                  toast.success('Configuración Global actualizada con éxito');
                  closeModal();
                }} className="w-full bg-primary-600 text-white py-3 rounded-lg font-bold hover:bg-primary-700 flex justify-center items-center shadow-lg transition-colors">
                  <Save className="w-5 h-5 mr-2" /> Guardar Configuración
                </button>
              </div>
            </div>
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

      {/* MODAL NUEVO ALUMNO */}
      {modalType === 'addStudent' && (
        <AddStudentModal onClose={closeModal} />
      )}

      {/* MODAL HOJA DE VIDA (Componente Externo) */}
      {modalType === 'hoja' && selectedStudent && (
        <HojaDeVida 
          student={selectedStudent} 
          materiasPorGrado={materiasPorGrado}
          onClose={closeModal} 
          onSave={(updatedStudent) => {
            // Actualizar localmente si es necesario, o dejar que el onSnapshot lo haga
          }} 
        />
      )}

      {modalType === 'acuse' && selectedStudent && (
        <AcuseDocumentosModal 
          student={selectedStudent} 
          onClose={closeModal} 
          onGenerate={(data) => {
            setPrintData(data);
            setPrintMode('acuse');
            closeModal();
          }}
        />
      )}

      {modalType === 'acuseRec' && selectedStudent && (
        <AcuseRecepcionModal 
          student={selectedStudent} 
          onClose={closeModal} 
          onGenerate={(data) => {
            setPrintData(data);
            setPrintMode('acuseRec');
            closeModal();
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
                      <option value="G">G - Climatización y refrigeración</option>
                      <option value="H">H - Administración contable</option>
                      <option value="I">I - Diseño y circuitos eléctricos</option>
                      <option value="J">J - Administración contable</option>
                      <option value="K">K - Diseño y mecánica automotriz</option>
                      <option value="L">L - Ofimática</option>
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={closeModal} className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Generar Constancia</h2>
            <p className="text-sm text-slate-500 mb-4">Selecciona el tipo de documento que deseas emitir para <strong>{selectedStudent.nombres}</strong>.</p>
            
            {hasFailedSubjects && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Aviso: Alumno con materias reprobadas.</p>
                  <p className="text-xs">Según el cuadro de concentración final, este alumno tiene al menos una materia con promedio final menor a 6.0.</p>
                </div>
              </div>
            )}

            {(selectedStudent.grado === '3er Grado' || selectedStudent.grado === '1er Grado') && (
              <div className="mb-4 bg-slate-50 border border-slate-200 p-3 rounded-lg">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {selectedStudent.grado === '1er Grado' ? 'Promedio de Primaria (Opcional)' : 'Promedio del Nivel Educativo (Opcional)'}
                </label>
                <input 
                  type="number" 
                  step="0.1" 
                  min="6" max="10"
                  value={constanciaPromedio}
                  onChange={(e) => setConstanciaPromedio(e.target.value)}
                  placeholder="Ej. 9.8"
                  className="w-full border-slate-300 rounded-md shadow-sm p-2 text-sm focus:border-primary-500 focus:ring-primary-500"
                />
                <p className="text-xs text-slate-500 mt-1">Este dato se añadirá a la Constancia correspondiente.</p>
              </div>
            )}

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
<button onClick={() => { executePrintConstancia('terminacion_tramite'); closeModal(); }} className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all flex items-start group">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg mr-3 group-hover:scale-110 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Constancia Certificado en Trámite</h3>
                    <p className="text-xs text-slate-500 mt-1">Para egresados sin adeudos, indica que su certificado oficial está en proceso.</p>
                  </div>
                </button>

              <button onClick={() => { setPrintData(selectedStudent); setPrintMode('kardex'); closeModal(); }} className="w-full flex items-start p-4 border border-slate-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition text-left group">
                <div className="bg-purple-100 text-purple-600 p-2 rounded-lg mr-4 group-hover:bg-purple-500 group-hover:text-white transition">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Kárdex Completo (Historial)</h3>
                  <p className="text-xs text-slate-500 mt-1">Documento oficial con calificaciones desglosadas de 1er a 3er grado.</p>
                </div>
              </button>

              <button onClick={() => executePrintConstancia('promedio_ciclo')} className="w-full flex items-start p-4 border border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition text-left group">
                <div className="bg-blue-100 text-blue-600 p-2 rounded-lg mr-4 group-hover:bg-blue-500 group-hover:text-white transition">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Constancia de Promedio (Ciclo Actual)</h3>
                  <p className="text-xs text-slate-500 mt-1">Solo muestra el promedio general de este ciclo escolar.</p>
                </div>
              </button>

              <button onClick={() => executePrintConstancia('promedio_generacion')} className="w-full flex items-start p-4 border border-slate-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition text-left group">
                <div className="bg-purple-100 text-purple-600 p-2 rounded-lg mr-4 group-hover:bg-purple-500 group-hover:text-white transition shrink-0">
                  <Star className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Constancia de Promedio (Generación)</h3>
                  <p className="text-xs text-slate-500 mt-1">Requiere capturar el promedio manual arriba. Ideal para 3er año.</p>
                </div>
              </button>

              <button onClick={() => executePrintConstancia('terminacion')} className="w-full flex items-start p-4 border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition text-left group">
                <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg mr-4 group-hover:bg-indigo-500 group-hover:text-white transition shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Constancia de Terminación (3er Año)</h3>
                  <p className="text-xs text-slate-500 mt-1">Con fecha fija de cierre de ciclo. Solo para alumnos de 3er grado.</p>
                </div>
              </button>

              <button onClick={() => executePrintConstancia('inscripcion_primero')} className="w-full flex items-start p-4 border border-slate-200 rounded-xl hover:border-teal-500 hover:bg-teal-50 transition text-left group">
                <div className="bg-teal-100 text-teal-600 p-2 rounded-lg mr-4 group-hover:bg-teal-500 group-hover:text-white transition shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Constancia de Inscripción (1er Año)</h3>
                  <p className="text-xs text-slate-500 mt-1">Incluye promedio de primaria. Solo para alumnos de 1er grado.</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sección Regularización / Extraordinarios */}
      {!loading && activeTab === 'regularizacion' && !printMode && (
        <RegularizacionPrint 
            activos={directorio} 
            materiasPorGrado={materiasPorGrado} 
            onCaptureExtra={handleCaptureExtra} 
            onPrintConstanciaExtra={(student, matsArray) => {
                const formattedMats = matsArray.map(mat => ({
                  materia: mat.name,
                  calificacion: mat.finalGrade,
                  fecha: mat.fecha,
                  periodo: mat.periodo || ''
                }));
                const promManual = window.prompt('Ingrese el promedio del nivel educativo (ej. 8.5). Deje en blanco si no aplica:');
                setExtraordinarioToPrint(formattedMats);
              setPrintData({ ...student, manualPromedio: promManual || '' });
              setConstanciaType('acreditacion_extraordinario');
              setPrintMode('constancia');
              setTimeout(() => window.print(), 800);
            }}
            onPrintConstanciaEER={(student, regularizadas, adeudos, fechaExp) => {
              setEerToPrint({ regularizadas, adeudos, fechaExpedicion: fechaExp });
              setPrintData(student);
              setPrintMode('constancia_eer');
              setTimeout(() => window.print(), 800);
            }}
            onClose={() => setActiveTab('activos')} 
          />
      )}

      {/* Modal para Capturar Extraordinario */}
      {modalType === 'extraordinario' && extraStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative">
            <button onClick={closeModal} className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-slate-800 mb-1">Capturar Extraordinario</h2>
            <p className="text-sm text-slate-500 mb-6">
              Ingresa la calificación obtenida por <strong>{extraStudent.nombres} {extraStudent.apellidoPaterno}</strong>.
            </p>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {extraSubjects.map(mat => (
                <div key={mat.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <h3 className="font-bold text-slate-700 mb-3">{mat.name}</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      
     <label className="block text-xs font-semibold text-slate-600 mb-1">Periodo</label>
     <select 
       value={extraData[mat.id]?.periodo || ''}
       onChange={(e) => setExtraData(prev => ({ 
         ...prev, 
         [mat.id]: { ...prev[mat.id], periodo: e.target.value } 
       }))}
       className="w-full border border-slate-300 rounded-md p-2 text-sm focus:border-orange-500 focus:ring-orange-500"
     >
       <option value="">Seleccione...</option>
       <option value="Agosto">Agosto</option>
       <option value="Septiembre">Septiembre</option>
       <option value="Noviembre">Noviembre</option>
     </select>
   </div>
   <div>
     <label className="block text-xs font-semibold text-slate-600 mb-1">Calificación Final (Aprobatoria)</label>
     
                      <input 
                        type="number" 
                        step="0.1" 
                        min="6" max="10"
                        value={extraData[mat.id]?.calificacion || ''}
                        onChange={(e) => setExtraData(prev => ({ 
                          ...prev, 
                          [mat.id]: { ...prev[mat.id], calificacion: e.target.value } 
                        }))}
                        placeholder="Ej. 7.5"
                        className="w-full border border-slate-300 rounded-md p-2 text-sm focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha de Acreditación</label>
                      <input 
                        type="date" 
                        value={extraData[mat.id]?.fecha || ''}
                        onChange={(e) => setExtraData(prev => ({ 
                          ...prev, 
                          [mat.id]: { ...prev[mat.id], fecha: e.target.value } 
                        }))}
                        className="w-full border border-slate-300 rounded-md p-2 text-sm focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button onClick={closeModal} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                Cancelar
              </button>
              <button onClick={saveExtraordinario} className="px-4 py-2 text-sm font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors flex items-center shadow-sm">
                <Save className="w-4 h-4 mr-2" />
                Guardar Calificaciones
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sección Aprovechamiento Escolar */}
      {!loading && activeTab === 'aprovechamiento' && !printMode && (
        <AprovechamientoPrint activos={activos} onClose={() => setActiveTab('activos')} />
      )}

      {/* Sección Matrícula */}
      {!loading && activeTab === 'matricula' && !printMode && (
        <MatriculaPrint alumnos={directorio} onClose={() => setActiveTab('activos')} />
      )}

      {/* Sección Matrícula Grupos */}
      {!loading && activeTab === 'matriculaGrupos' && !printMode && (
        <MatriculaGruposPrint alumnos={directorio} onClose={() => setActiveTab('activos')} />
      )}

      {/* Sección Aprobación (E2) */}
      {!loading && activeTab === 'aprobacion' && !printMode && (
        <AprobacionPrint activos={activos} materiasPorGrado={materiasPorGrado} onClose={() => setActiveTab('activos')} />
      )}

      {/* Sección Eficiencia Terminal */}
      {!loading && activeTab === 'eficiencia' && !printMode && (
        <EficienciaTerminalPrint activos={directorio.filter(s => s.status === 'Activo' || s.status === 'Egresado')} bajas={directorio.filter(s => s.status === 'Baja')} materiasPorGrado={materiasPorGrado} onClose={() => setActiveTab('activos')} />
      )}

      {/* Sección Desempeño Alcanzado */}
      {!loading && activeTab === 'desempeno' && !printMode && (
        <DesempenoAlcanzadoPrint activos={activos} materiasPorGrado={materiasPorGrado} onClose={() => setActiveTab('activos')} />
      )}

      {/* Sección Desertores */}
      {!loading && activeTab === 'desertores' && !printMode && (
        <DesertoresPrint bajas={directorio.filter(s => s.status === 'Baja')} onClose={() => setActiveTab('activos')} />
      )}

      {/* IMPRESIÓN MODALES INDIVIDUALES */}
      {printMode === 'acuseRec' && printData && <AcuseRecepcionPrint data={printData} onClose={() => setPrintMode(null)} />}
      {printMode === 'acuse' && printData && <AcuseDocumentosPrint data={printData} onClose={() => setPrintMode(null)} />}
      {printMode === 'credencial' && <CredencialPrint students={printData} />}
      {printMode === 'constancia' && <ConstanciaPrint student={printData} type={constanciaType} materiasPorGrado={materiasPorGrado} extraordinarioSelected={extraordinarioToPrint} />}
      {printMode === 'kardex' && <KardexPrint student={printData} materiasPorGrado={materiasPorGrado} onClose={() => setPrintMode(null)} />}
      {printMode === 'constancia_eer' && eerToPrint && <ConstanciaEERPrint student={printData} regularizadas={eerToPrint.regularizadas} adeudos={eerToPrint.adeudos} fechaExpedicion={eerToPrint.fechaExpedicion} />}
      {printMode === 'boleta' && <BoletaPrint students={printData} materiasPorGrado={materiasPorGrado} />}
      {printMode === 'listaAsistencia' && <ListaAsistenciaPrint students={printData.students} grado={printData.grado} grupo={printData.grupo} mes={printData.mes} paperSize={printData.paperSize} />}
      {printMode === 'listaClausura' && <ListaClausuraPrint students={printData.students} grupo={printData.grupo} asesor={printData.asesor} />}
      {printMode === 'concentrado-final' && <CuadroFinalPrint alumnos={printData.alumnos} materias={materiasPorGrado[printData.grado]} grado={printData.grado} grupo={printData.grupo} />}
      {printMode === 'concentrado-parcial' && <CuadroParcialPrint alumnos={printData.alumnos} materias={materiasPorGrado[printData.grado]} grado={printData.grado} grupo={printData.grupo} />}

      {selectedExpediente && (
        <ExpedienteModal 
          student={selectedExpediente} 
          onClose={() => setSelectedExpediente(null)} 
        />
      )}
    </div>
  );
}
