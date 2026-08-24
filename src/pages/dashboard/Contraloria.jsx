import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useState, useEffect, useMemo } from 'react';
import { DollarSign, PackageOpen, Plus, FileText, CheckCircle2, Printer, X, Edit2, Trash2, ScanLine, Search, Download, History, Monitor, Laptop, Projector, BookOpen, Tv, Speaker, Keyboard, Mouse, Server, Smartphone, Tablet, Archive, PenTool, Box, Armchair, Cpu, Wallet, AlertTriangle, TrendingUp, TrendingDown, BarChart as BarChartIcon, FileSpreadsheet, PieChart as PieChartIcon } from 'lucide-react';

import toast from 'react-hot-toast';
import Papa from 'papaparse';
import { useAuth } from '../../context/AuthContext';
import CajaLockScreen from '../../components/CajaLockScreen';
import { db } from '../../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, writeBatch, serverTimestamp, where } from 'firebase/firestore';
import ActaRecepcionPrint from '../../components/ActaRecepcionPrint';
import CartaResguardoPrint from '../../components/CartaResguardoPrint';
import ScannerInventarioModal from '../../components/ScannerInventarioModal';
import EtiquetasPrint from '../../components/EtiquetasPrint';
import ActaBajaPrint from '../../components/ActaBajaPrint';
import { searchIncludes } from '../../utils/search';

// Funciones auxiliares para el manejo de rangos de folios de inventario
const generateCodeRange = (baseCode, quantity) => {
  const qty = Number(quantity) || 1;
  if (qty <= 1) return { codes: [baseCode], display: baseCode };

  // Intentar encontrar un número al final del código (ej. "INV-001", "INV-100", "B-5" o "002")
  const match = baseCode.match(/^(.*?)(\d+)$/);
  if (match) {
    const prefix = match[1];
    const numStr = match[2];
    const startNum = parseInt(numStr, 10);
    const padLength = numStr.length; // Para mantener ceros a la izquierda (ej. "001" -> 3)
    
    const codes = [];
    for (let i = 0; i < qty; i++) {
      const currentNum = startNum + i;
      const currentNumStr = String(currentNum).padStart(padLength, '0');
      codes.push(`${prefix}${currentNumStr}`);
    }
    const endCode = codes[codes.length - 1];
    return {
      codes,
      display: `${baseCode} al ${endCode}`
    };
  } else {
    // Si no termina en número, agregar sufijo consecutivo -1, -2, etc.
    const codes = [];
    for (let i = 1; i <= qty; i++) {
      codes.push(`${baseCode}-${i}`);
    }
    return {
      codes,
      display: `${baseCode}-1 al ${baseCode}-${qty}`
    };
  }
};

const expandCodeRange = (codeStr) => {
  if (!codeStr) return [];
  if (!codeStr.includes(' al ')) return [codeStr];

  const parts = codeStr.split(' al ');
  const startCode = parts[0].trim();
  const endCode = parts[1].trim();

  const matchStart = startCode.match(/^(.*?)(\d+)$/);
  const matchEnd = endCode.match(/^(.*?)(\d+)$/);

  if (matchStart && matchEnd && matchStart[1] === matchEnd[1]) {
    const prefix = matchStart[1];
    const startNum = parseInt(matchStart[2], 10);
    const endNum = parseInt(matchEnd[2], 10);
    const padLength = matchStart[2].length;

    const codes = [];
    for (let num = startNum; num <= endNum; num++) {
      const numStr = String(num).padStart(padLength, '0');
      codes.push(`${prefix}${numStr}`);
    }
    return codes;
  }
  return [startCode, endCode];
};

const getCategoryForArticulo = (nombre) => {
  const n = nombre ? nombre.toLowerCase() : '';
  if (n.includes('compu') || n.includes('pc') || n.includes('cpu') || n.includes('laptop') || n.includes('portatil')) return 'Computadoras';
  if (n.includes('monitor') || n.includes('pantalla')) return 'Monitores y Pantallas';
  if (n.includes('impresora') || n.includes('printer')) return 'Impresoras';
  if (n.includes('proyector') || n.includes('cañon') || n.includes('canon')) return 'Proyectores';
  if (n.includes('silla') || n.includes('banco') || n.includes('butaca') || n.includes('asiento') || n.includes('sofa') || n.includes('sillón') || n.includes('sillon')) return 'Sillería';
  if (n.includes('mesa') || n.includes('escritorio') || n.includes('tablón') || n.includes('pupitre')) return 'Mesas y Escritorios';
  if (n.includes('libro') || n.includes('diccionario') || n.includes('enciclopedia')) return 'Libros';
  if (n.includes('tv') || n.includes('televisión') || n.includes('televisor')) return 'Televisores';
  if (n.includes('bocina') || n.includes('altavoz') || n.includes('sonido') || n.includes('audio') || n.includes('microfono')) return 'Equipo de Audio';
  if (n.includes('teclado') || n.includes('mouse') || n.includes('raton')) return 'Periféricos';
  if (n.includes('servidor') || n.includes('switch') || n.includes('router') || n.includes('red')) return 'Equipo de Red';
  if (n.includes('telefono') || n.includes('celular') || n.includes('smartphone')) return 'Telefonía';
  if (n.includes('tablet') || n.includes('ipad')) return 'Tablets';
  if (n.includes('archivero') || n.includes('gaveta') || n.includes('estante') || n.includes('librero') || n.includes('locker') || n.includes('casillero')) return 'Archiveros y Estantes';
  if (n.includes('pizarrón') || n.includes('pintarrón') || n.includes('pizarron') || n.includes('pintarron')) return 'Pizarrones';
  if (n.includes('ventilador') || n.includes('abanico')) return 'Ventiladores';
  if (n.includes('aire') || n.includes('minisplit') || n.includes('clima')) return 'Aires Acondicionados';
  
  return 'Otros Muebles y Equipos';
};

const getIconForArticulo = (nombre) => {
  const n = nombre.toLowerCase();
  if (n.includes('compu') || n.includes('pc') || n.includes('cpu') || n.includes('laptop') || n.includes('portatil')) return <Cpu className="w-5 h-5" />;
  if (n.includes('monitor') || n.includes('pantalla')) return <Monitor className="w-5 h-5" />;
  if (n.includes('impresora') || n.includes('printer')) return <Printer className="w-5 h-5" />;
  if (n.includes('proyector') || n.includes('cañon') || n.includes('canon')) return <Projector className="w-5 h-5" />;
  if (n.includes('sillería') || n.includes('silla') || n.includes('banco') || n.includes('butaca') || n.includes('asiento') || n.includes('sofa') || n.includes('sillón')) return <Armchair className="w-5 h-5" />;
  if (n.includes('mesa') || n.includes('escritorio') || n.includes('tablón') || n.includes('pupitre')) return <Box className="w-5 h-5" />;
  if (n.includes('libro') || n.includes('diccionario') || n.includes('enciclopedia')) return <BookOpen className="w-5 h-5" />;
  if (n.includes('tv') || n.includes('televisión') || n.includes('televisor')) return <Tv className="w-5 h-5" />;
  if (n.includes('audio') || n.includes('bocina') || n.includes('altavoz') || n.includes('sonido') || n.includes('microfono')) return <Speaker className="w-5 h-5" />;
  if (n.includes('periféricos') || n.includes('teclado') || n.includes('mouse') || n.includes('raton')) return <Keyboard className="w-5 h-5" />;
  if (n.includes('red') || n.includes('servidor') || n.includes('switch') || n.includes('router')) return <Server className="w-5 h-5" />;
  if (n.includes('telefonía') || n.includes('telefono') || n.includes('celular') || n.includes('smartphone')) return <Smartphone className="w-5 h-5" />;
  if (n.includes('tablet') || n.includes('ipad')) return <Tablet className="w-5 h-5" />;
  if (n.includes('archivero') || n.includes('gaveta') || n.includes('estante') || n.includes('librero')) return <Archive className="w-5 h-5" />;
  if (n.includes('pizarrón') || n.includes('pintarrón') || n.includes('pizarron')) return <PenTool className="w-5 h-5" />;
  
  return <Box className="w-5 h-5" />;
};

export default function Contraloria() {

  const { currentUser } = useAuth();
  const [cajaTurno, setCajaTurno] = useState(null); // { id, turno, fondoInicial }
  
  
  useEffect(() => {
    // Escuchar si ya hay una caja abierta para este usuario
    const q = query(collection(db, 'cajas'), where('estado', '==', 'abierta'));
    const unsub = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
           // Asumimos que solo hay una caja abierta a la vez
           const doc = snapshot.docs[0];
           setCajaTurno({ id: doc.id, ...doc.data() });
        } else {
           setCajaTurno(null);
        }
    });
    return () => unsub();
  }, []);
  
  // Escuchar gastos (egresos) de la caja actual
  useEffect(() => {
    if (!cajaTurno) return;
    const q = query(collection(db, 'gastos'), where('cajaId', '==', cajaTurno?.id));
    const unsub = onSnapshot(q, (snapshot) => {
        const items = [];
        snapshot.forEach(d => items.push({ id: d.id, ...d.data() }));
        setGastos(items);
    });
    return () => unsub();
  }, [cajaTurno]);

  const [activeTab, setActiveTab] = useState('pagos');

  // Nuevos estados para Ingresos Avanzados
  const [corteConfig, setCorteConfig] = useState({ fechaInicio: new Date().toISOString().split('T')[0], fechaFin: new Date().toISOString().split('T')[0], turno: 'Ambos' });
  const [activeIngresoTab, setActiveIngresoTab] = useState('generales');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  
  const [pagosAdmin, setPagosAdmin] = useState([]);
  const [pagosExtra, setPagosExtra] = useState([]);
  
  const [showPagoAdminModal, setShowPagoAdminModal] = useState(false);
  const [studentSearchMatches, setStudentSearchMatches] = useState([]);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  
  const [allStudentsRaw, setAllStudentsRaw] = useState([]);
  
  const materiasPorGrado = {
    '1er Grado': [
      { id: 'espanol1', name: 'Español I' },
      { id: 'ingles1', name: 'Inglés I' },
      { id: 'artes1', name: 'Artes I' },
      { id: 'matematicas1', name: 'Matemáticas I' },
      { id: 'biologia', name: 'Ciencias I (Biología)' },
      { id: 'geografia', name: 'Geografía' },
      { id: 'historia1', name: 'Historia I' },
      { id: 'fce1', name: 'Formación Cívica y Ética I' },
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

  const getFailedSubjects = (student) => {
    if (!student) return [];
    
    // Si es irregular o egresado irregular, su grado real para materias podría ser el anterior
    // Pero en ControlEscolar asumen student.grado. Limpiaremos "(Irregular)" si lo tiene
    let gradeKey = student.grado;
    if (gradeKey?.includes('1er Grado')) gradeKey = '1er Grado';
    else if (gradeKey?.includes('2do Grado')) gradeKey = '2do Grado';
    else if (gradeKey?.includes('3er Grado')) gradeKey = '3er Grado';

    if (!materiasPorGrado[gradeKey]) return [];
    
    const materias = materiasPorGrado[gradeKey];
    const failed = [];

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
        if (finalMat < 6) {
          failed.push(mat);
        }
      }
    }
    return failed;
  };

  const [pagoFormData, setPagoFormData] = useState({
    nombre: '',
    metodo: 'Efectivo',
    tipo: 'administrativo',
    detalles: [{concepto: '', monto: ''}]
  });
  const [receiptPago, setReceiptPago] = useState(null);


  
  const [pagosRecientes, setPagosRecientes] = useState([]);
  const [pagosSearch, setPagosSearch] = useState('');
  const [pagosGrado, setPagosGrado] = useState('Todos');
  const [pagosGrupo, setPagosGrupo] = useState('Todos');
  const [gastos, setGastos] = useState([]);
  const [showGastoModal, setShowGastoModal] = useState(false);
  const [gastoFormData, setGastoFormData] = useState({ concepto: '', monto: '', fecha: new Date().toISOString().split('T')[0] });

  const filteredPagos = useMemo(() => {
    return pagosRecientes.filter(p => {
      const matchSearch = !pagosSearch || searchIncludes(p.alumno || p.nombre || '', pagosSearch) || searchIncludes(p.folio || p.id || '', pagosSearch);
      const matchGrado = pagosGrado === 'Todos' || p.grado === pagosGrado;
      const matchGrupo = pagosGrupo === 'Todos' || p.grupo === pagosGrupo;
      return matchSearch && matchGrado && matchGrupo;
    }).sort((a, b) => a.alumno.localeCompare(b.alumno));
  }, [pagosRecientes, pagosSearch, pagosGrado, pagosGrupo]);

  useEffect(() => {
    const q = query(collection(db, 'students'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = []; const rawItems = []; snapshot.forEach(docSnap => { rawItems.push({id: docSnap.id, ...docSnap.data()}); 
        const data = docSnap.data();
        // Generar un folio falso si no tiene
        const folio = `P-${docSnap.id.substring(0, 4).toUpperCase()}`;
        const alumno = `${data.apellidoPaterno || ''} ${data.apellidoMaterno || ''} ${data.nombres || ''}`.trim();
        const esNuevo = data.grado === '1er Grado' || data.grado === '1ero' || data.tipoTramite === 'Nuevo Ingreso';
        const grado = data.grado || 'N/A';
        const grupo = data.grupo || 'N/A';
        const concepto = esNuevo ? 'Credencial Escolar y Paquete de Folders' : 'Renovación de Credencial Escolar';
        const montoNum = esNuevo ? 130 : 100;
        const monto = `$${montoNum}.00`;
        
        let fecha = 'Pendiente';
        if (data.pagoFecha) {
          const dateObj = data.pagoFecha.toDate ? data.pagoFecha.toDate() : new Date();
          fecha = dateObj.toLocaleDateString();
        }

                items.push({
          id: docSnap.id,
          folio,
          alumno,
          grado,
          grupo,
          concepto,
          monto,
          montoNum,
          fecha,
          estado: data.pagoInscripcion ? 'Pagado' : 'Pendiente'
        });
      });
      // Sort by date or id
      setPagosRecientes(items.reverse()); setAllStudentsRaw(rawItems);
    });
    return () => unsubscribe();
  }, []);

  const registrarCobro = async (studentId) => {
    try {
      const docRef = doc(db, 'students', studentId);
      await updateDoc(docRef, { 
        pagoInscripcion: true, 
        pagoFecha: serverTimestamp() 
      });
      toast.success("Pago de inscripción registrado exitosamente");
    } catch (e) {
      console.error(e);
      toast.error("Error al registrar el pago");
    }
  };


  const [inventario, setInventario] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]); // Array de IDs seleccionados
  const [showScannerModal, setShowScannerModal] = useState(false);

  // Estados para búsqueda y filtrado de inventario
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [locationFilter, setLocationFilter] = useState('Todos');

  // Estados para resguardos
  const [resguardos, setResguardos] = useState([]);
  const [editingResguardo, setEditingResguardo] = useState(null);
  const [resguardoSearch, setResguardoSearch] = useState('');

    // Efecto para Pagos Administrativos y Extraordinarios
  useEffect(() => {
    const qAdmin = query(collection(db, 'pagos_administrativos'));
    const unsubAdmin = onSnapshot(qAdmin, snap => {
      setPagosAdmin(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    
    const qExtra = query(collection(db, 'pagos_extraordinarios'));
    const unsubExtra = onSnapshot(qExtra, snap => {
      setPagosExtra(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    
    return () => { unsubAdmin(); unsubExtra(); };
  }, []);

  // Lógica de Filtros y Combinación de Ingresos
  const todosLosPagosGenerales = [
    ...pagosRecientes.map(p => ({ ...p, tipoIngreso: 'sistema' })),
    ...pagosAdmin.map(p => ({ 
      ...p, 
      tipoIngreso: 'manual', 
      folio: p.id.substring(0, 6).toUpperCase(), 
      alumno: p.nombre, 
      montoNum: parseFloat(p.monto), 
      monto: `${parseFloat(p.monto).toFixed(2)}`,
      pagoFecha: p.createdAt 
    }))
  ].sort((a, b) => {
     const dateA = a.pagoFecha?.toDate ? a.pagoFecha.toDate() : new Date(a.pagoFecha || 0);
     const dateB = b.pagoFecha?.toDate ? b.pagoFecha.toDate() : new Date(b.pagoFecha || 0);
     return dateB - dateA;
  });

  const filteredPagosGenerales = todosLosPagosGenerales.filter(p => {
    const matchesSearch = !pagosSearch || searchIncludes(p.alumno || p.nombre || '', pagosSearch) || searchIncludes(p.folio || p.id || '', pagosSearch);
    const matchesGrado = pagosGrado === 'Todos' || p.grado === pagosGrado;
    const matchesGrupo = pagosGrupo === 'Todos' || p.grupo === pagosGrupo;
    
    let matchesFecha = true;
    if (fechaInicio || fechaFin) {
       const pDate = p.pagoFecha?.toDate ? p.pagoFecha.toDate() : new Date(p.pagoFecha || new Date());
       pDate.setHours(0,0,0,0);
       if (fechaInicio && new Date(fechaInicio + 'T00:00:00') > pDate) matchesFecha = false;
       if (fechaFin && new Date(fechaFin + 'T23:59:59') < pDate) matchesFecha = false;
    }
    
    return matchesSearch && matchesGrado && matchesGrupo && matchesFecha;
  });

  const filteredPagosExtra = pagosExtra.map(p => ({
      ...p, 
      folio: p.id.substring(0, 6).toUpperCase(), 
      alumno: p.nombre, 
      montoNum: parseFloat(p.monto), 
      monto: `${parseFloat(p.monto).toFixed(2)}`,
      pagoFecha: p.createdAt 
  })).filter(p => {
    const matchesSearch = !pagosSearch || searchIncludes(p.alumno || p.nombre || '', pagosSearch) || searchIncludes(p.folio || p.id || '', pagosSearch);
    let matchesFecha = true;
    if (fechaInicio || fechaFin) {
       const pDate = p.pagoFecha?.toDate ? p.pagoFecha.toDate() : new Date(p.pagoFecha || new Date());
       pDate.setHours(0,0,0,0);
       if (fechaInicio && new Date(fechaInicio + 'T00:00:00') > pDate) matchesFecha = false;
       if (fechaFin && new Date(fechaFin + 'T23:59:59') < pDate) matchesFecha = false;
    }
    return matchesSearch && matchesFecha;
  }).sort((a, b) => {
     const dateA = a.pagoFecha?.toDate ? a.pagoFecha.toDate() : new Date(a.pagoFecha || 0);
     const dateB = b.pagoFecha?.toDate ? b.pagoFecha.toDate() : new Date(b.pagoFecha || 0);
     return dateB - dateA;
  });

  const handleGuardarPagoManual = async (e) => {
      e.preventDefault();
      
      const conceptosFiltrados = pagoFormData.detalles.filter(d => d.concepto.trim() !== '' && parseFloat(d.monto) >= 0 && d.monto !== '');
      if(!pagoFormData.nombre || conceptosFiltrados.length === 0) {
        toast.error('Llena todos los campos válidos (concepto y monto).');
        return;
      }
      setIsSubmitting(true);
      try {
        const collectionName = pagoFormData.tipo === 'administrativo' ? 'pagos_administrativos' : 'pagos_extraordinarios';
        const conceptoConcatenado = conceptosFiltrados.map(d => d.concepto).join(' + ');
        const montoTotal = conceptosFiltrados.reduce((s, d) => s + parseFloat(d.monto), 0);
        
        const pagoRef = await addDoc(collection(db, collectionName), {
          nombre: pagoFormData.nombre,
          concepto: conceptoConcatenado,
          monto: montoTotal,
          detalles: conceptosFiltrados.map(d => ({ concepto: d.concepto, monto: parseFloat(d.monto) })),
          metodo: pagoFormData.metodo,
          createdAt: serverTimestamp(),
          cajaId: cajaTurno?.id || 'sin-caja',
          estado: 'Pagado',
          fecha: new Date().toISOString().split('T')[0]
        });
        
        // CERO PAPEL: Emitir ticket digital para Control Escolar si incluye constancia
        if (pagoFormData.tipo === 'administrativo' && conceptoConcatenado.toLowerCase().includes('constancia')) {
          await addDoc(collection(db, 'tramites_pendientes'), {
            nombreAlumno: pagoFormData.nombre,
            pagoId: pagoRef.id,
            conceptoPago: conceptoConcatenado,
            fechaSolicitud: new Date().toISOString(),
            estado: 'Pendiente',
            cajaId: cajaTurno?.id || 'sin-caja',
            turno: cajaTurno?.turno || 'N/A'
          });
        }
        toast.success('Pago registrado exitosamente');
        setShowPagoAdminModal(false);
        setPagoFormData({ nombre: '', metodo: 'Efectivo', tipo: 'administrativo', detalles: [{concepto: '', monto: ''}] });
      } catch(err) {
        toast.error('Error al registrar el pago');
      } finally {
        setIsSubmitting(false);
      }
    };
  
  
  const handleCerrarCaja = async (totales) => {
    if(!window.confirm("¿Estás seguro que deseas cerrar la caja del turno " + cajaTurno?.turno + "? Esta acción guardará el historial del corte y bloqueará el sistema hasta que se inicie un nuevo turno.")) return;
    
    try {
      // 1. Save the Corte document
      const corteRef = await addDoc(collection(db, "cortes_caja"), {
        cajaId: cajaTurno?.id,
        turno: cajaTurno?.turno,
        usuario: currentUser?.email || 'admin',
        fechaCierre: serverTimestamp(),
        fondoInicial: totales.fondoEfectivo,
        ingresosEfectivo: totales.totalEfectivo,
        gastosEfectivo: totales.totalGastos,
        efectivoFinalEnCajon: totales.totalEnCajaFisica,
        ingresosTransferencia: totales.totalTransferencia,
        ingresosTerminal: totales.totalTerminal,
        totalBanco: totales.totalEnBanco,
        granTotalRecaudado: totales.totalEfectivo + totales.totalTransferencia + totales.totalTerminal
      });
      
      // 2. Mark the current caja session as closed
      const cajaRef = doc(db, "sesiones_caja", cajaTurno?.id);
      await updateDoc(cajaRef, {
        estado: 'Cerrada',
        fechaCierre: serverTimestamp(),
        corteId: corteRef.id
      });
      
      toast.success("Corte de Caja guardado. El turno ha sido cerrado.");
      setCajaTurno(null);
      setActiveTab('pagos');
      
    } catch(err) {
      console.error(err);
      toast.error("Error al cerrar caja.");
    }
  };

  const exportarRelacionIngresos = () => {
    const dataToExport = activeIngresoTab === 'generales' ? filteredPagosGenerales : filteredPagosExtra;
    if (dataToExport.length === 0) {
      alert("No hay registros para exportar en las fechas seleccionadas.");
      return;
    }
    
    const csvData = dataToExport.map(p => ({
      'Folio': p.folio || '',
      'Alumno/Persona': p.alumno || p.nombre || '',
      'Concepto': p.concepto || '',
      'Monto': p.monto || '',
      'Método': p.metodo || 'Efectivo',
      'Fecha': p.pagoFecha?.toDate ? p.pagoFecha.toDate().toLocaleDateString() : new Date(p.pagoFecha || new Date()).toLocaleDateString()
    }));
    
    const csv = Papa.unparse(csvData, { delimiter: ';' });
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Relacion_Ingresos_${activeIngresoTab}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const q = query(collection(db, 'inventario'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
      setInventario(items);
    });
    return () => unsubscribe();
  }, []);

  const generatePrefix = (name) => {
    if (!name) return 'ART';
    const cleanName = name
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar acentos
      .replace(/[^a-zA-Z\s]/g, "") // Quitar números y caracteres especiales
      .trim()
      .toUpperCase();
    
    const words = cleanName.split(/\s+/).filter(w => w.length > 0);
    if (words.length === 0) return 'ART';
    
    if (words.length >= 3) {
      return (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
    } else if (words.length === 2) {
      return (words[0].substring(0, 2) + words[1][0]).toUpperCase();
    } else {
      return (words[0].substring(0, 3)).toUpperCase().padEnd(3, 'X');
    }
  };

  const getNextAutoCodeBase = (name, offsetsObj = {}) => {
    const prefix = generatePrefix(name);
    let maxNum = 0;
    inventario.forEach(item => {
      if (item.codigo && item.codigo.startsWith(`${prefix}-`)) {
        const rangeMatch = item.codigo.match(/al\s+.*?(\d+)$/);
        if (rangeMatch) {
          const num = parseInt(rangeMatch[1], 10);
          if (num > maxNum) maxNum = num;
        } else {
          const match = item.codigo.match(new RegExp(`^${prefix}-(\\d+)`));
          if (match) {
            const startNum = parseInt(match[1], 10);
            const qty = Number(item.cantidad) || 1;
            const num = startNum + qty - 1;
            if (num > maxNum) maxNum = num;
          }
        }
      }
    });
    const currentOffset = offsetsObj[prefix] || 0;
    return `${prefix}-${String(maxNum + 1 + currentOffset).padStart(4, '0')}`;
  };

  const migrarCodigos = async () => {
    try {
      setIsSubmitting(true);
      toast.loading("Migrando códigos antiguos...", { id: 'migrar' });
      
      const toUpdate = inventario.filter(item => item.codigo && item.codigo.includes('INV-AUTO-'));
      const toUpdateResg = resguardos.filter(r => r.articulos && r.articulos.some(art => art.codigo && art.codigo.includes('INV-AUTO-')));
      
      if (toUpdate.length === 0 && toUpdateResg.length === 0) {
        toast.success("No hay códigos antiguos para migrar.", { id: 'migrar' });
        setIsSubmitting(false);
        return;
      }

      const prefixCounters = {};

      // Initialize counters based on existing non-INV-AUTO items
      inventario.forEach(item => {
        if (item.codigo && !item.codigo.includes('INV-AUTO-')) {
           const match = item.codigo.match(/^([A-Z]{3})-(\d+)/);
           if (match) {
             const prefix = match[1];
             const num = parseInt(match[2], 10);
             if (!prefixCounters[prefix] || num > prefixCounters[prefix]) {
               prefixCounters[prefix] = num;
             }
           }
        }
      });

      let actualizados = 0;
      // 1. Migrar inventario
      for (const item of toUpdate) {
        const prefix = generatePrefix(item.articulo);
        if (!prefixCounters[prefix]) prefixCounters[prefix] = 0;
        prefixCounters[prefix]++;
        const newCode = `${prefix}-${String(prefixCounters[prefix]).padStart(4, '0')}`;
        
        await updateDoc(doc(db, 'inventario', item.id), { codigo: newCode });
        actualizados++;
      }
      
      // 2. Migrar resguardos (actualizando los códigos en el historial)
      for (const res of toUpdateResg) {
        let changed = false;
        const newArticulos = res.articulos.map(art => {
           if (art.codigo && art.codigo.includes('INV-AUTO-')) {
              changed = true;
              const prefix = generatePrefix(art.descripcion || art.articulo || art.marca);
              const newCode = art.codigo.replace(/INV-AUTO-/g, `${prefix}-`);
              return { ...art, codigo: newCode };
           }
           return art;
        });
        if (changed) {
           await updateDoc(doc(db, 'resguardos', res.id), { articulos: newArticulos });
           actualizados++;
        }
      }
      
      toast.success(`Se actualizaron ${actualizados} registros exitosamente.`, { id: 'migrar' });
    } catch (e) {
      console.error(e);
      toast.error("Error al migrar códigos.", { id: 'migrar' });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const qRes = query(collection(db, 'resguardos'), orderBy('fechaRegistro', 'desc'));
    const unsubscribeRes = onSnapshot(qRes, (snapshot) => {
      const items = [];
      snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
      setResguardos(items);
    });
    return () => unsubscribeRes();
  }, []);

  // Extraer ubicaciones únicas dinámicamente
  const ubicacionesUnicas = [...new Set(inventario.map(item => item.ubicacion).filter(Boolean))].sort();
  const filteredInventario = inventario.filter(item => {
    const matchesSearch = !searchTerm || searchIncludes(item.codigo, searchTerm) || searchIncludes(item.articulo, searchTerm);
    
    const matchesStatus = statusFilter === 'Todos' || item.estado === statusFilter;
    const matchesLocation = locationFilter === 'Todos' || item.ubicacion === locationFilter;
    
    return matchesSearch && matchesStatus && matchesLocation;
  }).sort((a, b) => {
    return (a.codigo || '').localeCompare((b.codigo || ''), undefined, { numeric: true, sensitivity: 'base' });
  });

  const [printMode, setPrintMode] = useState(null); // 'recepcion' | 'resguardo' | 'baja' | 'etiquetas'
  const [printData, setPrintData] = useState(null);
  
  
  const uniqueUbicaciones = useMemo(() => {
    const ubs = new Set();
    // Extraer de ubicaciones de inventario
    inventario.forEach(item => {
      if (item.ubicacion && typeof item.ubicacion === 'string' && item.ubicacion.trim()) {
        ubs.add(item.ubicacion.trim());
      }
    });
    // Extraer de las áreas de resguardo directamente
    resguardos.forEach(res => {
      if (res.areaResguardante && typeof res.areaResguardante === 'string' && res.areaResguardante.trim()) {
         ubs.add(res.areaResguardante.trim());
      }
      res.articulos?.forEach(art => {
         if (art.ubicacion && typeof art.ubicacion === 'string' && art.ubicacion.trim()) {
            ubs.add(art.ubicacion.trim());
         }
      });
    });
    return Array.from(ubs).sort();
  }, [inventario, resguardos]);

  const [modalOpen, setModalOpen] = useState(null); // 'recepcion' | 'resguardo' | 'baja' | 'editItem' | 'history'
  const [editingItem, setEditingItem] = useState(null);
  const [historyItem, setHistoryItem] = useState(null);
  
  const [formData, setFormData] = useState({ articulos: [{ cantidad: '', descripcion: '', marca: '', serie: '', estado: '', inventario: '' }] });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleAfterPrint = () => setPrintMode(null);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  const openModal = (type) => {
    setModalOpen(type);
    
    let articulosIniciales = [{ cantidad: '', descripcion: '', marca: '', serie: '', estado: '', inventario: '' }];
    if ((type === 'baja' || type === 'resguardo') && selectedItems.length > 0) {
      articulosIniciales = inventario.filter(i => selectedItems.includes(i.id));
    }

    setFormData({ 
      fecha: new Date().toISOString().split('T')[0],
      hora: '', origen: '', proveedor: '', nombreProveedor: '', nombreContralor: 'Profr. Juan Carlos Taboada B.',
      folio: '', nombreResguardante: '', areaResguardante: '', observaciones: '', motivo: '',
      guardarEnInventario: false,
      articulos: articulosIniciales
    });
  };

  const handlePrintEtiquetas = () => {
    if (selectedItems.length === 0) return;
    const itemsToPrint = inventario.filter(i => selectedItems.includes(i.id));
    setPrintData(itemsToPrint);
    setPrintMode('etiquetas');
    setTimeout(() => window.print(), 500);
  };

  const handleAddRow = () => {
    setFormData({ ...formData, articulos: [...formData.articulos, { cantidad: '', descripcion: '', marca: '', serie: '', estado: '', inventario: '' }] });
  };

  const handlePrintSubmit = async (e, actionType = 'print') => {
    if (e && e.preventDefault) e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    const toastId = toast.loading('Guardando información...');
    let dataToPrint = { ...formData };
    
    // Guardar en base de datos si es recepción
    if (modalOpen === 'recepcion') {
      try {
        const validItems = formData.articulos.filter(art => art.cantidad || art.descripcion || art.marca);
        
        if (validItems.length > 0) {
          // 1. Guardar el documento general (Acta)
          await addDoc(collection(db, 'actas_recepcion'), {
            fecha: formData.fecha,
            hora: formData.hora,
            origen: formData.origen,
            proveedor: formData.proveedor,
            nombreProveedor: formData.nombreProveedor,
            nombreContralor: formData.nombreContralor,
            observaciones: formData.observaciones,
            articulosTotales: validItems.length,
            fechaRegistro: new Date().toISOString()
          });

          let autoCodeOffsets = {};
          const recepcionArticulos = [];
          // 2. Guardar cada artículo en el inventario
          for (let i = 0; i < validItems.length; i++) {
            const art = validItems[i];
            const qty = Number(art.cantidad) || 1;
            const tempCode = getNextAutoCodeBase(art.descripcion || art.articulo || art.marca, autoCodeOffsets);
            const prefix = generatePrefix(art.descripcion || art.articulo || art.marca);
            autoCodeOffsets[prefix] = (autoCodeOffsets[prefix] || 0) + qty;
            
            const { codes, display } = generateCodeRange(tempCode, qty);
            
            for (const code of codes) {
              await addDoc(collection(db, 'inventario'), {
                codigo: code,
                articulo: `${art.descripcion || ''} ${art.marca || ''}`.trim() || art.articulo || '',
                descripcion: art.descripcion || art.articulo || '',
                marca: art.marca || '',
                modelo: art.modelo || '',
                serie: art.serie || '',
                observaciones: art.observaciones || '',
                ubicacion: 'Bodega Contraloría',
                cantidad: 1,
                estado: art.estado || 'Nuevo',
                fechaIngreso: new Date().toISOString()
              });
            }
            recepcionArticulos.push({ ...art, codigo: display });
          }
          dataToPrint.articulos = recepcionArticulos;
        }
      } catch (error) {
        console.error("Error guardando en Firebase:", error);
        toast.error("Hubo un error al guardar en la base de datos.", { id: toastId });
        setIsSubmitting(false);
        return;
      }
    } else if (modalOpen === 'resguardo') {
      try {
        const validItems = formData.articulos.filter(art => art.cantidad || art.descripcion || art.marca || art.articulo);
        if (validItems.length > 0) {
          let autoCodeOffsets = {};
          // 1. Crear artículos consolidados para guardar en el Acta de Resguardo y para imprimir
          const resguardoArticulos = validItems.map((art, idx) => {
            const qty = Number(art.cantidad) || 1;
            let baseCode = art.codigo || art.inventario || '';
            if (!baseCode) {
              baseCode = getNextAutoCodeBase(art.descripcion || art.articulo || art.marca, autoCodeOffsets);
              const prefix = generatePrefix(art.descripcion || art.articulo || art.marca);
              autoCodeOffsets[prefix] = (autoCodeOffsets[prefix] || 0) + qty;
            }
            art._generatedBaseCode = baseCode; // Guardar el baseCode para usarlo en el paso 2
            const { display } = generateCodeRange(baseCode, qty);
            
            return {
              id: art.id || '',
              cantidad: qty,
              descripcion: art.descripcion || art.articulo || '',
              marca: art.marca || '',
              serie: art.serie || '',
              codigo: display, // Rangos consolidados para la impresión y visualización
              estado: art.estado || 'Bueno'
            };
          });

          // Verificar duplicados en códigos manuales
          for (const art of validItems) {
            const qty = Number(art.cantidad) || 1;
            const baseCode = art._generatedBaseCode || art.codigo || art.inventario;
            if (baseCode) {
               const { codes } = generateCodeRange(baseCode, qty);
               for (const code of codes) {
                 if (inventario.some(i => i.codigo === code && i.id !== art.id)) {
                   toast.error(`El código de inventario ${code} ya existe en el sistema. Usa otro folio.`);
                   setIsSubmitting(false);
                   return;
                 }
               }
            }
          }

          let finalResguardoArticulos = resguardoArticulos;
          const existingResguardo = resguardos.find(r => 
            r.areaResguardante === formData.areaResguardante && 
            r.nombreResguardante === formData.nombreResguardante
          );
          
          if (existingResguardo) {
            const mergedArticulos = existingResguardo.articulos ? [...existingResguardo.articulos] : [];
            for (const newArt of resguardoArticulos) {
              const idx = mergedArticulos.findIndex(a => a.codigo === newArt.codigo);
              if (idx !== -1) {
                mergedArticulos[idx] = { ...mergedArticulos[idx], ...newArt };
              } else {
                mergedArticulos.push(newArt);
              }
            }
            finalResguardoArticulos = mergedArticulos;
            await updateDoc(doc(db, 'resguardos', existingResguardo.id), {
              articulos: mergedArticulos,
              fecha: formData.fecha || existingResguardo.fecha,
              folio: formData.folio || existingResguardo.folio,
              observaciones: formData.observaciones || existingResguardo.observaciones
            });
          } else {
            const resguardoDoc = {
              folio: formData.folio || '',
              fecha: formData.fecha || new Date().toISOString().split('T')[0],
              nombreResguardante: formData.nombreResguardante || '',
              areaResguardante: formData.areaResguardante || '',
              nombreContralor: formData.nombreContralor || 'Profr. Juan Carlos Taboada B.',
              observaciones: formData.observaciones || '',
              articulos: resguardoArticulos,
              fechaRegistro: new Date().toISOString()
            };
            await addDoc(collection(db, 'resguardos'), resguardoDoc);
          }

          // 2. Guardar o actualizar artículos en el Inventario General INDIVIDUALMENTE
          for (let i = 0; i < validItems.length; i++) {
            const art = validItems[i];
            
            if (art.id) {
              // Si ya existe en el inventario, actualizamos su ubicación y estado
              const invItem = inventario.find(i => i.id === art.id);
              const currentHistorial = invItem?.historial || [];
              const itemRef = doc(db, 'inventario', art.id);
              await updateDoc(itemRef, {
                ubicacion: formData.areaResguardante || 'En resguardo',
                estado: art.estado || 'Bueno',
                descripcion: art.descripcion || art.articulo || invItem?.descripcion || invItem?.articulo || '',
                marca: art.marca || invItem?.marca || '',
                modelo: art.modelo || invItem?.modelo || '',
                serie: art.serie || invItem?.serie || '',
                observaciones: art.observaciones || invItem?.observaciones || '',
                historial: [...currentHistorial, {
                  fecha: new Date().toISOString(),
                  accion: "Asignación de Resguardo",
                  detalle: `Asignado a ${formData.nombreResguardante} (Folio ${formData.folio || 'S/F'}).`,
                  usuario: "Contraloría"
                }]
              });
            } else if (formData.guardarEnInventario) {
              // Si no existe y se marcó "Guardar en Inventario", lo desglosamos y guardamos individualmente
              const baseCode = art._generatedBaseCode || art.codigo || art.inventario || `INV-RESG-${Date.now().toString().slice(-4)}${i}`;
              const qty = Number(art.cantidad) || 1;
              const { codes } = generateCodeRange(baseCode, qty);
              
              for (const code of codes) {
                await addDoc(collection(db, 'inventario'), {
                  codigo: code,
                  articulo: `${art.descripcion || ''} ${art.marca || ''}`.trim() || art.articulo || '',
                  descripcion: art.descripcion || art.articulo || '',
                  marca: art.marca || '',
                  modelo: art.modelo || '',
                  serie: art.serie || '',
                  observaciones: art.observaciones || '',
                  ubicacion: formData.areaResguardante || 'En resguardo',
                  cantidad: 1, // Guardado individualmente
                  estado: art.estado || 'Bueno',
                  fechaIngreso: new Date().toISOString()
                });
              }
            }
          }
          // Usar artículos consolidados en la impresión
          dataToPrint.articulos = typeof finalResguardoArticulos !== 'undefined' ? finalResguardoArticulos : resguardoArticulos;
        }
      } catch (error) {
        console.error("Error guardando resguardos en Firebase:", error);
        toast.error("Hubo un error al guardar en la base de datos.", { id: toastId });
        setIsSubmitting(false);
        return;
      }
    }

    if (actionType === 'print') {
      setPrintData(dataToPrint);
      setPrintMode(modalOpen);
      setModalOpen(null);
      toast.success("¡Preparando documento para impresión!", { id: toastId });
      setTimeout(() => { window.print(); setIsSubmitting(false); }, 500);
    } else {
      setModalOpen(null);
      setIsSubmitting(false);
      toast.success("¡Guardado exitosamente en la base de datos!", { id: toastId });
    }
  };

  const handleEditClick = (item) => {
    setEditingItem({ ...item });
    setModalOpen('editItem');
  };

  const migrateToInitials = async () => {
    const confirm = window.confirm("¿Deseas re-generar los códigos al formato de iniciales (ej. VDT-0001)?");
    if (!confirm) return;

    try {
      setIsSubmitting(true);
      toast.loading("Migrando códigos...", { id: 'migrar' });
      
      const counters = {};
      const codeMapping = {}; 
      const oldCodeToNewCode = {}; 
      
      let updatedInv = 0;
      let skippedInv = 0;
      
      const batch = writeBatch(db);
      
      // Sort inventario so we process them in consistent order (by old number if possible)
      const sortedInventario = [...inventario].sort((a, b) => {
         const numA = parseInt((a.codigo || '').match(/\d+$/)?.[0] || 0);
         const numB = parseInt((b.codigo || '').match(/\d+$/)?.[0] || 0);
         return numA - numB;
      });
      
      for (const item of sortedInventario) {
        const currentCode = item.codigo || '';
        
        const isSemanticCode = /^[A-Z]{3}-\d+$/.test(currentCode);
        const isOldAutoCode = currentCode.startsWith('INV-RESG-') || currentCode.startsWith('INV-AUTO-');
        
        if (isSemanticCode || isOldAutoCode || currentCode === '') {
          const prefix = generatePrefix(item.articulo || item.descripcion || '');
          if (!counters[prefix]) counters[prefix] = 0;
          
          counters[prefix]++;
          const newCode = `${prefix}-${String(counters[prefix]).padStart(4, '0')}`;
          
          codeMapping[item.id] = newCode;
          if (currentCode) {
            oldCodeToNewCode[currentCode] = newCode;
          }
          
          if (currentCode !== newCode) {
            batch.update(doc(db, 'inventario', item.id), { codigo: newCode });
            updatedInv++;
          } else {
            codeMapping[item.id] = newCode;
          }
        } else {
          // Manual code
          codeMapping[item.id] = currentCode;
          oldCodeToNewCode[currentCode] = currentCode;
          skippedInv++;
        }
      }
      
      let updatedResg = 0;
      for (const res of resguardos) {
        let changed = false;
        if (res.articulos && Array.isArray(res.articulos)) {
          const newArticulos = res.articulos.map(art => {
            let newCode = art.codigo;
            
            if (art.id && codeMapping[art.id]) {
              newCode = codeMapping[art.id];
            } else if (art.codigo && oldCodeToNewCode[art.codigo]) {
              newCode = oldCodeToNewCode[art.codigo];
            } else if (art.codigo) {
              const isSemanticCode = /^[A-Z]{3}-\d+/.test(art.codigo) || art.codigo.startsWith('INV-RESG-') || art.codigo.startsWith('INV-AUTO-');
              if (isSemanticCode) {
                const correctPrefix = generatePrefix(art.descripcion || art.articulo || art.marca || '');
                if (art.codigo.includes(' al ')) {
                  const parts = art.codigo.split(' al ');
                  const newStart = parts[0].replace(/^[A-Z]{3}-|^INV-RESG-|^INV-AUTO-/, `${correctPrefix}-`);
                  const newEnd = parts[1].replace(/^[A-Z]{3}-|^INV-RESG-|^INV-AUTO-/, `${correctPrefix}-`);
                  newCode = `${newStart} al ${newEnd}`;
                } else {
                  newCode = art.codigo.replace(/^[A-Z]{3}-|^INV-RESG-|^INV-AUTO-/, `${correctPrefix}-`);
                }
              }
            }

            if (newCode && newCode !== art.codigo) {
              changed = true;
              return { ...art, codigo: newCode };
            }
            return art;
          });
          
          if (changed) {
            batch.update(doc(db, 'resguardos', res.id), { articulos: newArticulos });
            updatedResg++;
          }
        }
      }
      
      await batch.commit();
      
      toast.success(`Se actualizaron ${updatedInv} artículos y ${updatedResg} resguardos.`, { id: 'migrar' });
      setIsSubmitting(false);
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar códigos.", { id: 'migrar' });
      setIsSubmitting(false);
    }
  };

  const cleanOrphanedItems = async () => {
    const confirm = window.confirm("¿Deseas buscar y eliminar del Inventario los bienes auto-generados que ya no tienen Acta de Resguardo (bienes huérfanos)?\n\nEsto es útil si eliminaste un acta pero los bienes se quedaron 'atrapados' en el sistema.");
    if (!confirm) return;

    try {
      setIsSubmitting(true);
      toast.loading("Buscando bienes huérfanos...", { id: 'clean' });
      const batch = writeBatch(db);
      let deletedCount = 0;

      for (const item of inventario) {
        // Solo aplica a códigos automáticos (ej. VDT-0001, INV-AUTO-001, INV-RESG-123)
        const isAutoGenerated = /^[A-Z]{3}-\d+$/.test(item.codigo) || 
                               item.codigo?.startsWith('INV-AUTO-') || 
                               item.codigo?.startsWith('INV-RESG-');
                               
        if (!isAutoGenerated) continue;
        // Si están en Bodega, son libres y válidos
        if (item.ubicacion === 'Bodega Contraloría') continue;

        // Comprobar si su código existe en los rangos de algún resguardo
        let foundInResguardo = false;
        for (const res of resguardos) {
          if (res.articulos) {
            for (const art of res.articulos) {
              const expandedCodes = expandCodeRange(art.codigo || '');
              if (expandedCodes.includes(item.codigo)) {
                foundInResguardo = true;
                break;
              }
            }
          }
          if (foundInResguardo) break;
        }

        if (!foundInResguardo) {
          batch.delete(doc(db, 'inventario', item.id));
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        await batch.commit();
        toast.success(`Se eliminaron ${deletedCount} bienes fantasma/huérfanos.`, { id: 'clean' });
      } else {
        toast.success("Inventario limpio. No se encontraron bienes fantasma.", { id: 'clean' });
      }
      setIsSubmitting(false);
    } catch (err) {
      console.error(err);
      toast.error("Error al limpiar inventario.", { id: 'clean' });
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      const originalItem = inventario.find(i => i.id === editingItem.id);
      const currentHistorial = originalItem?.historial || [];
      const newHistorial = [...currentHistorial];
      
      if (originalItem && originalItem.estado !== editingItem.estado) {
        newHistorial.push({
          fecha: new Date().toISOString(),
          accion: "Cambio de Estado",
          detalle: `Estado modificado manualmente de '${originalItem.estado}' a '${editingItem.estado}'.`,
          usuario: "Contraloría"
        });
      }
      if (originalItem && originalItem.ubicacion !== editingItem.ubicacion) {
        newHistorial.push({
          fecha: new Date().toISOString(),
          accion: "Cambio de Ubicación",
          detalle: `Movido manualmente de '${originalItem.ubicacion}' a '${editingItem.ubicacion}'.`,
          usuario: "Contraloría"
        });
      }

      if (originalItem && originalItem.codigo !== editingItem.codigo) {
        if (inventario.some(i => i.codigo === editingItem.codigo && i.id !== editingItem.id)) {
          toast.error(`El código de inventario ${editingItem.codigo} ya está en uso.`);
          return;
        }
        newHistorial.push({
          fecha: new Date().toISOString(),
          accion: "Cambio de Código de Inventario",
          detalle: `Código modificado de '${originalItem.codigo}' a '${editingItem.codigo}'.`,
          usuario: "Contraloría"
        });
      }

      const itemRef = doc(db, 'inventario', editingItem.id);
      await updateDoc(itemRef, {
        codigo: editingItem.codigo,
        articulo: editingItem.articulo,
        descripcion: editingItem.descripcion || editingItem.articulo || '',
        marca: editingItem.marca || '',
        modelo: editingItem.modelo || '',
        serie: editingItem.serie || '',
        observaciones: editingItem.observaciones || '',
        ubicacion: editingItem.ubicacion,
        cantidad: Number(editingItem.cantidad),
        estado: editingItem.estado,
        historial: newHistorial
      });

      // Sincronización con Actas de Resguardo
      try {
        if (originalItem && originalItem.ubicacion !== editingItem.ubicacion) {
          if (originalItem.ubicacion) {
            const oldRes = resguardos.find(r => r.areaResguardante === originalItem.ubicacion);
            if (oldRes && oldRes.articulos) {
              const updatedArts = oldRes.articulos.filter(a => a.codigo !== originalItem.codigo);
              await updateDoc(doc(db, 'resguardos', oldRes.id), { articulos: updatedArts });
            }
          }
          if (editingItem.ubicacion) {
            const newRes = resguardos.find(r => r.areaResguardante === editingItem.ubicacion);
            if (newRes) {
              const updatedArts = newRes.articulos ? [...newRes.articulos] : [];
              const filtered = updatedArts.filter(a => a.codigo !== editingItem.codigo);
              filtered.push({
                id: editingItem.id,
                cantidad: 1,
                descripcion: editingItem.descripcion || editingItem.articulo || '',
                marca: editingItem.marca || '',
                serie: editingItem.serie || '',
                codigo: editingItem.codigo,
                estado: editingItem.estado || 'Bueno'
              });
              await updateDoc(doc(db, 'resguardos', newRes.id), { articulos: filtered });
            }
          }
        } else {
          // Si la ubicación no cambió, actualizar el item dentro del resguardo si existe
          if (editingItem.ubicacion) {
            const currRes = resguardos.find(r => r.areaResguardante === editingItem.ubicacion);
            if (currRes && currRes.articulos) {
              const hasItem = currRes.articulos.some(a => a.codigo === originalItem.codigo);
              if (hasItem) {
                const updatedArts = currRes.articulos.map(a => {
                  if (a.codigo === originalItem.codigo) {
                    return {
                      ...a,
                      descripcion: editingItem.descripcion || editingItem.articulo || '',
                      marca: editingItem.marca || '',
                      serie: editingItem.serie || '',
                      codigo: editingItem.codigo,
                      estado: editingItem.estado || 'Bueno'
                    };
                  }
                  return a;
                });
                await updateDoc(doc(db, 'resguardos', currRes.id), { articulos: updatedArts });
              } else {
                // Si no lo tiene, lo agregamos (para sincronizar ediciones atrasadas)
                const newArt = {
                  id: editingItem.id,
                  cantidad: 1,
                  descripcion: editingItem.descripcion || editingItem.articulo || '',
                  marca: editingItem.marca || '',
                  serie: editingItem.serie || '',
                  codigo: editingItem.codigo,
                  estado: editingItem.estado || 'Bueno'
                };
                const updatedArts = [...currRes.articulos, newArt];
                await updateDoc(doc(db, 'resguardos', currRes.id), { articulos: updatedArts });
              }
            }
          }
        }
      } catch (syncErr) {
        console.error("Error sincronizando con resguardos:", syncErr);
      }
      setModalOpen(null);
      setEditingItem(null);
      toast.success("Cambios guardados correctamente.");
    } catch (error) {
      console.error("Error al actualizar:", error);
      toast.error("Hubo un error al actualizar el artículo.");
    }
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este artículo del inventario de forma permanente?")) {
      toast.promise(
        deleteDoc(doc(db, 'inventario', id)),
        {
          loading: 'Eliminando...',
          success: 'Artículo eliminado correctamente.',
          error: 'Error al eliminar el artículo.'
        }
      );
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    if (window.confirm(`¿Estás seguro de eliminar ${selectedItems.length} artículos seleccionados de forma permanente?`)) {
      try {
        const promises = selectedItems.map(id => deleteDoc(doc(db, 'inventario', id)));
        await Promise.all(promises);
        setSelectedItems([]); // Limpiar selección tras borrar
        toast.success("Artículos eliminados correctamente.");
      } catch (error) {
        console.error("Error en eliminación masiva:", error);
        toast.error("Hubo un error al eliminar los artículos seleccionados.");
      }
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (selectedItems.length === 0) return;
    if (window.confirm(`¿Estás seguro de marcar ${selectedItems.length} artículos seleccionados como '${newStatus}'?`)) {
      const toastId = toast.loading(`Actualizando a ${newStatus}...`);
      try {
        const promises = selectedItems.map(async (id) => {
          const itemRef = doc(db, 'inventario', id);
          const originalItem = inventario.find(i => i.id === id);
          if (originalItem && originalItem.estado !== newStatus) {
            const currentHistorial = originalItem.historial || [];
            await updateDoc(itemRef, { 
              estado: newStatus,
              historial: [...currentHistorial, {
                fecha: new Date().toISOString(),
                accion: "Cambio de Estado Masivo",
                detalle: `Estado modificado de '${originalItem.estado}' a '${newStatus}'.`,
                usuario: "Contraloría"
              }]
            });
          }
        });
        await Promise.all(promises);
        setSelectedItems([]);
        toast.success(`Artículos actualizados a ${newStatus}.`, { id: toastId });
      } catch (error) {
        console.error("Error en actualización masiva:", error);
        toast.error("Hubo un error al actualizar los artículos.", { id: toastId });
      }
    }
  };

  const handleEditResguardoClick = (res) => {
    setEditingResguardo({
      ...res,
      articulos: res.articulos ? res.articulos.map((art, i) => ({ ...art, _uid: i })) : []
    });
    setModalOpen('editResguardo');
    window.scrollTo(0, 0);
  };

  const handleDuplicateResguardo = (res) => {
    const articulosDuplicados = res.articulos ? res.articulos.map(art => ({
      ...art,
      id: '',
      codigo: '',
      inventario: '',
      serie: ''
    })) : [{ cantidad: '', descripcion: '', marca: '', serie: '', estado: 'Bueno', inventario: '' }];

    setFormData({
      fecha: new Date().toISOString().split('T')[0],
      hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false }),
      origen: res.origen || '',
      proveedor: res.proveedor || '',
      nombreProveedor: res.nombreProveedor || '',
      nombreContralor: res.nombreContralor || 'Profr. Juan Carlos Taboada B.',
      folio: '', // Folio en blanco para que le ponga uno nuevo
      nombreResguardante: res.nombreResguardante || '',
      areaResguardante: res.areaResguardante || '',
      observaciones: res.observaciones || '',
      motivo: res.motivo || '',
      guardarEnInventario: true,
      articulos: articulosDuplicados
    });

    setModalOpen('resguardo');
    window.scrollTo(0, 0);
  };

  const handleSaveResguardoEdit = async (e) => {
    e.preventDefault();
    if (!editingResguardo) return;
    
    try {
      const updatePromise = async () => {
      const validItems = editingResguardo.articulos.filter(art => art.cantidad || art.descripcion || art.marca || art.articulo);
      
      const originalResguardo = resguardos.find(r => r.id === editingResguardo.id);
      const originalArticulos = originalResguardo ? originalResguardo.articulos || [] : [];
      
      // Expandir códigos que YA pertenecen a este resguardo para no contarlos como duplicados
      let codesBelongingToThisResguardo = new Set();
      for (const origArt of originalArticulos) {
        if (origArt.codigo) {
           const expanded = expandCodeRange(origArt.codigo);
           expanded.forEach(c => codesBelongingToThisResguardo.add(c));
        }
      }

      // Verificar duplicados
      for (const art of validItems) {
        const qty = Number(art.cantidad) || 1;
        const baseCode = art.codigo || art.inventario;
        if (baseCode) {
           const { codes } = generateCodeRange(baseCode, qty);
           for (const code of codes) {
             if (inventario.some(i => i.codigo === code && i.id !== art.id && !codesBelongingToThisResguardo.has(code))) {
               toast.error(`El código de inventario ${code} ya existe en el sistema. Usa otro folio.`);
               return;
             }
           }
        }
      }

      const resRef = doc(db, 'resguardos', editingResguardo.id);
      
      const removedItems = originalArticulos.filter((origArt, idx) => 
        !validItems.some(vArt => vArt._uid === idx)
      );

      let autoCodeOffsets = {};
      // Asegurar que todos tengan un código, auto-generando si es necesario
      const articulosProcesados = validItems.map((art, idx) => {
        const qty = Number(art.cantidad) || 1;
        let finalCode = art.codigo || art.inventario || '';
        if (!finalCode) {
           const baseCode = getNextAutoCodeBase(art.descripcion || art.articulo || art.marca, autoCodeOffsets);
           const { display } = generateCodeRange(baseCode, qty);
           finalCode = display;
           const prefix = generatePrefix(art.descripcion || art.articulo || art.marca);
           autoCodeOffsets[prefix] = (autoCodeOffsets[prefix] || 0) + qty;
        }
        return {
          id: art.id || '',
          _uid: art._uid, // Preservar para mapeo
          cantidad: qty,
          descripcion: art.descripcion || art.articulo || '',
          marca: art.marca || '',
          serie: art.serie || '',
          codigo: finalCode,
          estado: art.estado || 'Bueno'
        };
      });

      await updateDoc(resRef, {
        folio: editingResguardo.folio || '',
        fecha: editingResguardo.fecha || '',
        nombreResguardante: editingResguardo.nombreResguardante || '',
        areaResguardante: editingResguardo.areaResguardante || '',
        observaciones: editingResguardo.observaciones || '',
        articulos: articulosProcesados.map(a => {
           const copy = { ...a };
           delete copy._uid;
           return copy;
        })
      });

      // Procesar artículos que continúan en el resguardo
      for (const art of articulosProcesados) {
        const origArt = art._uid !== undefined ? originalArticulos[art._uid] : null;
        const oldCode = origArt ? (origArt.codigo || origArt.inventario) : null;
        const newCode = art.codigo;
        
        const expandedNewCodes = expandCodeRange(newCode);
        const expandedOldCodes = oldCode ? expandCodeRange(oldCode) : [];
        
        for (let i = 0; i < expandedNewCodes.length; i++) {
          const code = expandedNewCodes[i];
          const oldCodeMatch = expandedOldCodes[i];
          
          const invItem = inventario.find(inv => 
            inv.codigo === code || 
            (art.id && inv.id === art.id) || 
            (oldCodeMatch && inv.codigo === oldCodeMatch)
          );
          
          if (invItem) {
            const itemRef = doc(db, 'inventario', invItem.id);
            const currentHistorial = invItem.historial || [];
            
            let updateData = {
              ubicacion: editingResguardo.areaResguardante || 'En resguardo'
            };
            
            // Si cambió el código, actualizarlo
            if (invItem.codigo !== code) {
              updateData.codigo = code;
              updateData.historial = [...currentHistorial, {
                fecha: new Date().toISOString(),
                accion: "Cambio de Código",
                detalle: `Código actualizado de '${invItem.codigo}' a '${code}' en revisión de resguardo Folio ${editingResguardo.folio || 'S/F'}.`,
                usuario: "Contraloría"
              }];
            }
            
            // Si cambió el estado, registrar en historial
            if (invItem.estado !== (art.estado || 'Bueno')) {
              updateData.estado = art.estado || 'Bueno';
              updateData.historial = [...(updateData.historial || currentHistorial), {
                fecha: new Date().toISOString(),
                accion: "Cambio de Estado",
                detalle: `Estado actualizado a '${updateData.estado}' durante revisión de resguardo Folio ${editingResguardo.folio || 'S/F'}.`,
                usuario: "Contraloría"
              }];
            } else {
               updateData.estado = art.estado || 'Bueno';
            }
            
            await updateDoc(itemRef, updateData);
          } else {
            // Si el artículo no existe en el catálogo, lo creamos
            await addDoc(collection(db, 'inventario'), {
              codigo: code,
              articulo: `${art.descripcion || ''} ${art.marca || ''}`.trim(),
              ubicacion: editingResguardo.areaResguardante || 'En resguardo',
              cantidad: 1,
              estado: art.estado || 'Bueno',
              serie: art.serie || '',
              fechaIngreso: new Date().toISOString()
            });
          }
        }
        
        // Si se redujo la cantidad, liberar los sobrantes
        for (let i = expandedNewCodes.length; i < expandedOldCodes.length; i++) {
          const codeToRelease = expandedOldCodes[i];
          const invItem = inventario.find(inv => inv.codigo === codeToRelease);
          if (invItem) {
             const itemRef = doc(db, 'inventario', invItem.id);
             const currentHistorial = invItem.historial || [];
             await updateDoc(itemRef, {
               ubicacion: 'Bodega Contraloría',
               historial: [...currentHistorial, {
                 fecha: new Date().toISOString(),
                 accion: "Liberación por Edición de Resguardo",
                 detalle: `Liberado a bodega al reducir cantidad en resguardo Folio ${editingResguardo.folio || 'S/F'}.`,
                 usuario: "Contraloría"
               }]
             });
          }
        }
      }

      // Procesar artículos que fueron ELIMINADOS del resguardo (Liberados)
      for (const art of removedItems) {
        const targetCode = art.codigo || art.inventario;
        const expandedCodes = expandCodeRange(targetCode);
        
        for (const code of expandedCodes) {
          const invItem = inventario.find(i => i.codigo === code || (art.id && i.id === art.id));
          if (invItem) {
            const itemRef = doc(db, 'inventario', invItem.id);
            const currentHistorial = invItem.historial || [];
            
            await updateDoc(itemRef, {
              ubicacion: 'Bodega Contraloría',
              historial: [...currentHistorial, {
                fecha: new Date().toISOString(),
                accion: "Retorno a Bodega",
                detalle: `Liberado del resguardo de ${originalResguardo.nombreResguardante} (Folio ${originalResguardo.folio || 'S/F'}).`,
                usuario: "Contraloría"
              }]
            });
          }
        }
      }
      setModalOpen(null);
      setEditingResguardo(null);
      };

      toast.promise(updatePromise(), {
        loading: 'Guardando cambios del resguardo...',
        success: '¡Resguardo actualizado correctamente!',
        error: 'Error al actualizar el resguardo'
      });

    } catch (error) {
      console.error("Error general:", error);
    }
  };

  const handleDeleteResguardoClick = async (res) => {
    const confirmacion = window.confirm(`¿Estás seguro de eliminar el resguardo con Folio ${res.folio || 'S/F'} de ${res.nombreResguardante}?

Esta acción no se puede deshacer.`);
    if (!confirmacion) return;

    const eliminarArticulos = window.confirm("¿Deseas ELIMINAR PERMANENTEMENTE los artículos de este resguardo del Inventario General de la escuela?\n\n(Aceptar = Borrar mobiliario del sistema, Cancelar = Mantenerlos en el sistema)");
    
    let liberarArticulos = false;
    if (!eliminarArticulos) {
      liberarArticulos = window.confirm("Como decidiste no eliminarlos, ¿deseas regresarlos a la 'Bodega Contraloría' como artículos libres?");
    }

    const deletePromise = async () => {
      if (eliminarArticulos && res.articulos) {
        for (const art of res.articulos) {
          const targetCode = art.codigo || art.inventario;
          const expandedCodes = expandCodeRange(targetCode);
          
          for (const code of expandedCodes) {
            const invItem = inventario.find(i => i.codigo === code);
            if (invItem) {
              await deleteDoc(doc(db, 'inventario', invItem.id));
            }
          }
        }
      } else if (liberarArticulos && res.articulos) {
        for (const art of res.articulos) {
          const targetCode = art.codigo || art.inventario;
          const expandedCodes = expandCodeRange(targetCode);
          
          for (const code of expandedCodes) {
            const invItem = inventario.find(i => i.codigo === code);
            if (invItem) {
              const itemRef = doc(db, 'inventario', invItem.id);
              const currentHistorial = invItem.historial || [];
              await updateDoc(itemRef, {
                ubicacion: 'Bodega Contraloría',
                historial: [...currentHistorial, {
                  fecha: new Date().toISOString(),
                  accion: "Retorno a Bodega",
                  detalle: `Resguardo eliminado. Liberado de ${res.nombreResguardante} (Folio ${res.folio || 'S/F'}).`,
                  usuario: "Contraloría"
                }]
              });
            }
          }
        }
      }
      await deleteDoc(doc(db, 'resguardos', res.id));
    };

    toast.promise(deletePromise(), {
      loading: 'Procesando la eliminación del acta y sus bienes...',
      success: '¡El acta y los bienes seleccionados fueron eliminados correctamente!',
      error: 'Hubo un error al eliminar el resguardo.'
    });
  };

  const toggleSelectAll = () => {
    const filteredIds = filteredInventario.map(item => item.id);
    const allFilteredSelected = filteredIds.every(id => selectedItems.includes(id));
    
    if (allFilteredSelected) {
      setSelectedItems(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedItems(prev => [...new Set([...prev, ...filteredIds])]);
    }
  };

  const toggleSelectItem = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  };

  const handleExportCSV = () => {
    if (filteredInventario.length === 0) {
      alert("No hay artículos en la lista filtrada para exportar.");
      return;
    }
    
    const dataToExport = filteredInventario.map(item => ({
      'Código de Inventario': item.codigo || '',
      'Artículo/Descripción': item.articulo || '',
      'Ubicación': item.ubicacion || '',
      'Cantidad': item.cantidad || 0,
      'Estado Físico': item.estado || '',
      'Número de Serie': item.serie || '',
      'Fecha de Ingreso': item.fechaIngreso ? new Date(item.fechaIngreso).toLocaleDateString() : ''
    }));
    
    const csv = Papa.unparse(dataToExport, { delimiter: ';' });
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Inventario_Mobiliario_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Cálculo de estadísticas generales del inventario
  const totalArticulos = inventario.reduce((sum, item) => sum + (Number(item.cantidad) || 0), 0);
  const libres = inventario.filter(i => i.ubicacion === 'Bodega Contraloría').reduce((sum, item) => sum + (Number(item.cantidad) || 0), 0);

  // Desglose por tipo de artículo (Nuevos vs Usados)
  const inventarioNuevos = inventario.filter(i => i.estado === 'Nuevo');
  const inventarioUsados = inventario.filter(i => i.estado !== 'Nuevo');

  const crearDesglose = (inv) => {
    const agrupado = inv.reduce((acc, item) => {
      const categoria = getCategoryForArticulo(item.articulo);
      if (!acc[categoria]) acc[categoria] = { total: 0, subItems: {} };
      
      const cantidad = Number(item.cantidad) || 0;
      acc[categoria].total += cantidad;
      
      const nombreExacto = item.articulo ? item.articulo.trim() : 'Sin descripción';
      acc[categoria].subItems[nombreExacto] = (acc[categoria].subItems[nombreExacto] || 0) + cantidad;
      
      return acc;
    }, {});

    return Object.entries(agrupado)
      .map(([nombre, data]) => ({ 
        nombre, 
        cantidad: data.total,
        detalles: Object.entries(data.subItems)
          .map(([desc, cant]) => `${cant}x ${desc}`)
          .sort((a, b) => b.localeCompare(a)) 
      }))
      .sort((a, b) => b.cantidad - a.cantidad);
  };

  const desgloseNuevosArray = crearDesglose(inventarioNuevos);
  const desgloseUsadosArray = crearDesglose(inventarioUsados);


  return (
    <>
    <div className={`space-y-6 ${printMode ? "hidden" : ""} print:${receiptPago ? "hidden" : "block"}`}>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Contraloría</h2>
          <p className="text-slate-500 text-sm">Control de ingresos (trámites) e inventario del mobiliario escolar.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex flex-wrap gap-y-2 space-x-8">
          <button
            onClick={() => setActiveTab('pagos')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${activeTab === 'pagos' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <DollarSign className="w-4 h-4 mr-2" /> Registro de Pagos
          </button>
          
          
          <button
            onClick={() => setActiveTab('corte')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${activeTab === 'corte' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <Wallet className="w-4 h-4 mr-2" /> Corte de Caja
          </button>
        </nav>
      </div>
      
      {(!cajaTurno && (activeTab === 'pagos' || activeTab === 'gastos' || activeTab === 'corte')) ? (
         <CajaLockScreen userEmail={currentUser?.email} onCajaAbierta={(id, turno, fondo) => setCajaTurno({id, turno, fondoInicial: fondo})} />
      ) : (
        <>

      {activeTab === 'pagos' && (
        <div className="space-y-6">
          <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h3 className="font-semibold text-slate-700 text-lg">Módulo de Ingresos</h3>
                <div className="flex gap-2">
                  <button onClick={exportarRelacionIngresos} className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 shadow-sm transition-colors">
                    <FileSpreadsheet className="w-4 h-4 mr-2" /> Exportar Relación (CSV)
                  </button>
                  <button onClick={() => setShowPagoAdminModal(true)} className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 shadow-sm transition-colors">
                    <Plus className="w-4 h-4 mr-2" /> Registrar Pago
                  </button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4 border-b border-slate-200">
                <button onClick={() => setActiveIngresoTab('generales')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeIngresoTab === 'generales' ? 'border-primary-600 text-primary-700 bg-primary-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Ingresos Generales</button>
                <button onClick={() => setActiveIngresoTab('extraordinarios')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeIngresoTab === 'extraordinarios' ? 'border-rose-600 text-rose-700 bg-rose-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Exámenes Extraordinarios</button>
              </div>

              <div className="flex flex-col lg:flex-row gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative w-full lg:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="text" placeholder="Buscar alumno/persona..." value={pagosSearch} onChange={(e) => setPagosSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500" />
                </div>
                
                {activeIngresoTab === 'generales' && (
                  <div className="flex gap-2 w-full lg:w-auto">
                    <select value={pagosGrado} onChange={(e) => setPagosGrado(e.target.value)} className="w-full sm:w-auto px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500">
                      <option value="Todos">Todos los grados</option>
                      <option value="1er Grado">1er Grado</option>
                      <option value="2do Grado">2do Grado</option>
                      <option value="3er Grado">3er Grado</option>
                    </select>
                  </div>
                )}

                <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center w-full lg:w-auto bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 uppercase px-2 w-full sm:w-auto">Filtrar por Fechas:</span>
                  <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="px-2 py-1.5 text-sm border border-slate-300 rounded-md bg-white w-full sm:w-auto" />
                  <span className="text-slate-400">-</span>
                  <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="px-2 py-1.5 text-sm border border-slate-300 rounded-md bg-white w-full sm:w-auto" />
                  {(fechaInicio || fechaFin) && (
                    <button onClick={() => { setFechaInicio(''); setFechaFin(''); }} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md" title="Limpiar Fechas"><X className="w-4 h-4"/></button>
                  )}
                </div>
              </div>
            </div>
            
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Folio</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Persona / Alumno</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Concepto</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Monto</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {gastos.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-8 text-slate-500">No hay egresos registrados en este turno.</td></tr>
                ) : gastos.map(g => (
                  <tr key={g.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-mono text-slate-600">{g.id.substring(0, 8).toUpperCase()}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-800">{g.concepto}</div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-800 mt-1">
                        {g.categoria}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-rose-600 font-mono">-$ {parseFloat(g.monto).toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{g.registradoPor}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-700">{cajaTurno?.turno || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{new Date(g.fecha).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'gastos' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold text-slate-800">Control de Gastos (Egresos)</h2>
              <button onClick={() => setShowGastoModal(true)} className="flex items-center px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700">
                <Plus className="w-4 h-4 mr-1" /> Registrar Gasto
              </button>
            </div>
            <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Folio</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Concepto</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Monto</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Responsable</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Turno</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Fecha</th>
                  </tr>
                </thead>
                
              <tbody className="divide-y divide-slate-200">
                {filteredPagos.map(p => (
                  <tr key={p.id}>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{p.folio}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600 font-bold">{p.alumno}</div>
                      <div className="text-xs text-slate-500">{p.grado !== 'N/A' ? `${p.grado} - Grupo ${p.grupo}` : 'Sin grado/grupo asignado'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{p.concepto}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">{p.monto}</td>
                    <td className="px-6 py-4 text-sm">
                      {p.estado === 'Pagado' ? (
                        <span className="text-emerald-600 flex items-center font-bold">
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Pagado el {p.fecha}
                        </span>
                      ) : (
                        <button 
                          onClick={() => registrarCobro(p.id)}
                          className="px-3 py-1 bg-primary-600 text-white rounded-md text-xs font-bold hover:bg-primary-700 shadow-sm"
                        >
                          Registrar Cobro
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>

              </table>
            </div>
          </div>
      )}

      {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mr-4">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Total Ingresos</p>
                  <p className="text-2xl font-bold text-slate-800">
                    ${([...pagosRecientes, ...pagosAdmin, ...pagosExtra].reduce((acc, p) => acc + (Number(p.montoNum || p.monto) || 0), 0)).toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center">
                <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center mr-4">
                  <TrendingDown className="w-6 h-6 text-sky-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Total Egresos</p>
                  <p className="text-2xl font-bold text-slate-800">
                    ${gastos.reduce((acc, g) => acc + (Number(g.monto) || 0), 0).toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                  <Wallet className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Saldo en Caja</p>
                  <p className="text-2xl font-bold text-slate-800">
                    ${(([...pagosRecientes, ...pagosAdmin, ...pagosExtra].reduce((acc, p) => acc + (Number(p.montoNum || p.monto) || 0), 0)) - gastos.reduce((acc, g) => acc + (Number(g.monto) || 0), 0)).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                  <BarChartIcon className="w-5 h-5 mr-2 text-slate-500" /> Balance General
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[{ name: 'Total Histórico', Ingresos: [...pagosRecientes, ...pagosAdmin, ...pagosExtra].reduce((acc, p) => acc + (Number(p.montoNum || p.monto) || 0), 0), Egresos: gastos.reduce((acc, g) => acc + (Number(g.monto) || 0), 0) }]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B'}} tickFormatter={(value) => `${value}`} />
                      <RechartsTooltip cursor={{fill: 'transparent'}} formatter={(value) => [`${Number(value).toFixed(2)}`, '']} />
                      <Legend />
                      <Bar dataKey="Ingresos" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={60} />
                      <Bar dataKey="Egresos" fill="#F43F5E" radius={[4, 4, 0, 0]} maxBarSize={60} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                  <PieChart as PieChartIcon className="w-5 h-5 mr-2 text-slate-500" /> Distribución de Egresos
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={Object.values(gastos.reduce((acc, g) => {
                          const cat = g.concepto || 'Otro';
                          if(!acc[cat]) acc[cat] = { name: cat, value: 0 };
                          acc[cat].value += Number(g.monto) || 0;
                          return acc;
                        }, {}))} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {Object.values(gastos.reduce((acc, g) => {
                          const cat = g.concepto || 'Otro';
                          if(!acc[cat]) acc[cat] = { name: cat, value: 0 };
                          acc[cat].value += Number(g.monto) || 0;
                          return acc;
                        }, {})).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#F43F5E', '#F59E0B', '#3B82F6', '#8B5CF6', '#10B981'][index % 5]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value) => `${Number(value).toFixed(2)}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
      )}

      {activeTab === 'corte' && (
  <div className="space-y-6 max-w-4xl mx-auto">
    {(() => {
      // Calculate current shift totals
      const pagosTurno = [...pagosAdmin, ...pagosExtra].filter(p => p.cajaId === cajaTurno?.id);
      
      const totalEfectivo = pagosTurno.filter(p => p.metodo === 'Efectivo').reduce((acc, p) => acc + (Number(p.montoNum || p.monto) || 0), 0);
      const totalTransferencia = pagosTurno.filter(p => p.metodo === 'Transferencia').reduce((acc, p) => acc + (Number(p.montoNum || p.monto) || 0), 0);
      const totalTerminal = pagosTurno.filter(p => p.metodo === 'Tarjeta').reduce((acc, p) => acc + (Number(p.montoNum || p.monto) || 0), 0);
      
      const totalIngresos = totalEfectivo + totalTransferencia + totalTerminal;
      const totalGastos = gastos.reduce((acc, g) => acc + (Number(g.monto) || 0), 0);
      
      const fondoEfectivo = Number(cajaTurno?.fondoInicial) || 0;
      
      const totalEnCajaFisica = fondoEfectivo + totalEfectivo - totalGastos;
      const totalEnBanco = totalTransferencia + totalTerminal;
      
      return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center justify-between">
            <div className="flex items-center">
              <Wallet className="w-6 h-6 mr-2 text-indigo-600" /> Corte de Caja en Curso
            </div>
            <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-bold">
              Turno {cajaTurno?.turno}
            </span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-500 font-medium mb-1">Fondo Inicial</p>
              <p className="text-xl font-bold text-slate-700">${fondoEfectivo.toFixed(2)}</p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
              <p className="text-sm text-emerald-600 font-medium mb-1">Ingresos (Efectivo)</p>
              <p className="text-xl font-bold text-emerald-700">+ ${totalEfectivo.toFixed(2)}</p>
            </div>
            <div className="bg-rose-50 p-4 rounded-lg border border-rose-200">
              <p className="text-sm text-rose-600 font-medium mb-1">Gastos (Egresos)</p>
              <p className="text-xl font-bold text-rose-700">- ${totalGastos.toFixed(2)}</p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200 shadow-inner">
              <p className="text-sm text-indigo-600 font-bold mb-1">EFECTIVO EN CAJÓN</p>
              <p className="text-2xl font-black text-indigo-700">${totalEnCajaFisica.toFixed(2)}</p>
            </div>
          </div>
          
          <h3 className="text-sm font-bold text-slate-600 mb-3 border-b pb-2">Ingresos No Físicos (Directo a Banco)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-500 font-medium mb-1">Transferencias</p>
              <p className="text-xl font-bold text-slate-700">${totalTransferencia.toFixed(2)}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-500 font-medium mb-1">Terminal (Tarjeta)</p>
              <p className="text-xl font-bold text-slate-700">${totalTerminal.toFixed(2)}</p>
            </div>
            <div className="bg-sky-50 p-4 rounded-lg border border-sky-200">
              <p className="text-sm text-sky-600 font-medium mb-1">Total a Banco</p>
              <p className="text-xl font-bold text-sky-700">${totalEnBanco.toFixed(2)}</p>
            </div>
          </div>
          
          <div className="flex justify-end pt-4 border-t border-slate-200">
            <button onClick={() => handleCerrarCaja({fondoEfectivo, totalEfectivo, totalGastos, totalEnCajaFisica, totalTransferencia, totalTerminal, totalEnBanco})} className="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 shadow-md transition-colors text-lg">
              <Archive className="w-5 h-5 mr-2" /> Cerrar Caja Definitivamente
            </button>
          </div>
        </div>
      )
    })()}
  </div>
)}


      {activeTab === 'resguardos' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex gap-4 items-end">
            <div className="flex-grow">
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Buscar por Resguardante o Folio</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input 
                  type="text" 
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                  placeholder="Ej. Profr. Juan Pérez, Folio 002..." 
                  value={resguardoSearch} 
                  onChange={e => setResguardoSearch(e.target.value)} 
                />
              </div>
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Folio</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Resguardante</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Área / Cargo</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Artículos</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Acciones</th>
                </tr>
              </thead>
              
                            <tbody className="divide-y divide-slate-200">
                {resguardos.length > 0 ? resguardos.filter(r => 
                    searchIncludes(r.resguardante, resguardoSearch) ||
                    searchIncludes(r.folio, resguardoSearch)
                ).map(r => (
                  <tr key={r.id}>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{r.folio || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{r.fecha ? (r.fecha.toDate ? r.fecha.toDate().toLocaleDateString() : r.fecha) : 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-bold">{r.resguardante || 'Desconocido'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{r.area || r.cargo || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {r.articulos ? r.articulos.length : 0} artículos
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                        <button 
                          onClick={() => {
                            setEditingResguardo(r);
                            setModalOpen('editResguardo');
                          }}
                          className="text-primary-600 hover:text-primary-800 font-medium text-xs"
                        >
                          Ver / Editar
                        </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500 italic">No hay actas de resguardo registradas.</td>
                  </tr>
                )}
              </tbody>

            </table>
          </div>
        </div>
      )}
    </>
      )}
    </div>

    {modalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
        <div className={`bg-white rounded-xl shadow-2xl w-full my-8 ${(modalOpen === 'editItem' || modalOpen === 'editResguardo') ? 'max-w-lg' : 'max-w-4xl'}`}>
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
            <h3 className="font-bold text-xl text-slate-800">
              {modalOpen === 'recepcion' ? 'Generar Acta de Recepción' : 
               modalOpen === 'resguardo' ? 'Generar Carta de Resguardo' : 
               modalOpen === 'editResguardo' ? 'Editar Carta de Resguardo' : 
               modalOpen === 'history' ? 'Historial de Movimientos' : 'Editar Bien del Inventario'}
            </h3>
            <button onClick={() => { setModalOpen(null); setEditingItem(null); setEditingResguardo(null); setHistoryItem(null); }} className="text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="p-6">
            {modalOpen === 'editItem' && editingItem ? (
              <form onSubmit={handleSaveEdit}>
                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Código de Inventario</label>
                      <input type="text" value={editingItem.codigo || ''} onChange={e => setEditingItem({...editingItem, codigo: e.target.value})} className="w-full p-2 border rounded font-mono text-sm bg-slate-50" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nombre / Concepto del artículo</label>
                      <input type="text" value={editingItem.articulo || editingItem.descripcion || ''} onChange={e => setEditingItem({...editingItem, articulo: e.target.value, descripcion: e.target.value})} className="w-full p-2 border rounded text-sm" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Marca</label>
                      <input type="text" value={editingItem.marca || ''} onChange={e => setEditingItem({...editingItem, marca: e.target.value})} className="w-full p-2 border rounded text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Modelo</label>
                      <input type="text" value={editingItem.modelo || ''} onChange={e => setEditingItem({...editingItem, modelo: e.target.value})} className="w-full p-2 border rounded text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">No. Serie</label>
                      <input type="text" value={editingItem.serie || ''} onChange={e => setEditingItem({...editingItem, serie: e.target.value})} className="w-full p-2 border rounded text-sm" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad</label>
                      <input type="number" value={editingItem.cantidad || ''} onChange={e => setEditingItem({...editingItem, cantidad: e.target.value})} className="w-full p-2 border rounded text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Estado Físico</label>
                      <select 
                        value={editingItem.estado || 'Bueno'} 
                        onChange={e => setEditingItem({...editingItem, estado: e.target.value})} 
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="Nuevo">Nuevo</option>
                        <option value="Bueno">Bueno</option>
                        <option value="Regular">Regular</option>
                        <option value="Malo">Malo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Ubicación Actual</label>
                      {(() => {
                        const isKnown = uniqueUbicaciones.includes(editingItem.ubicacion);
                        const isCustom = !isKnown && editingItem.ubicacion !== '' && editingItem.ubicacion !== undefined && editingItem.ubicacion !== '---NUEVA---';
                        return (
                          <div className="space-y-2">
                            <select 
                              className="w-full p-2 border rounded text-sm"
                              value={isKnown ? editingItem.ubicacion : (editingItem.ubicacion === '---NUEVA---' || isCustom ? '---NUEVA---' : '')}
                              onChange={e => setEditingItem({...editingItem, ubicacion: e.target.value})}
                            >
                              <option value="">Selecciona una ubicación...</option>
                              {uniqueUbicaciones.map(ub => (
                                <option key={ub} value={ub}>{ub}</option>
                              ))}
                              <option value="---NUEVA---">➕ Agregar nueva área...</option>
                            </select>
                            {(editingItem.ubicacion === '---NUEVA---' || isCustom) && (
                              <input 
                                type="text" 
                                placeholder="Escribe el nombre de la nueva área..." 
                                value={editingItem.ubicacion === '---NUEVA---' ? '' : (editingItem.ubicacion || '')}
                                onChange={e => setEditingItem({...editingItem, ubicacion: e.target.value})}
                                className="w-full p-2 border rounded text-sm border-indigo-400 focus:ring-1 focus:ring-indigo-500 bg-indigo-50"
                                autoFocus
                              />
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones</label>
                    <input type="text" value={editingItem.observaciones || ''} onChange={e => setEditingItem({...editingItem, observaciones: e.target.value})} className="w-full p-2 border rounded text-sm" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button type="button" onClick={() => { setModalOpen(null); setEditingItem(null); }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancelar</button>
                  <button type="submit" className="px-6 py-2 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 shadow-sm">Guardar Cambios</button>
                </div>
              </form>
            ) : modalOpen === 'editResguardo' && editingResguardo ? (
              <form onSubmit={handleSaveResguardoEdit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
                    <input type="date" value={editingResguardo.fecha} onChange={e => setEditingResguardo({...editingResguardo, fecha: e.target.value})} className="w-full p-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Folio</label>
                    <input type="text" value={editingResguardo.folio} onChange={e => setEditingResguardo({...editingResguardo, folio: e.target.value})} className="w-full p-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Resguardante</label>
                    <input type="text" value={editingResguardo.nombreResguardante} onChange={e => setEditingResguardo({...editingResguardo, nombreResguardante: e.target.value})} className="w-full p-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Área o Cargo</label>
                    <input type="text" value={editingResguardo.areaResguardante} onChange={e => setEditingResguardo({...editingResguardo, areaResguardante: e.target.value})} className="w-full p-2 border rounded" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones</label>
                    <textarea rows="2" value={editingResguardo.observaciones || ''} onChange={e => setEditingResguardo({...editingResguardo, observaciones: e.target.value})} className="w-full p-2 border rounded" placeholder="Daños visibles, faltantes..."></textarea>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-slate-700">Artículos incluidos</h4>
                    <button type="button" onClick={() => setEditingResguardo({ ...editingResguardo, articulos: [...editingResguardo.articulos, { cantidad: '', descripcion: '', marca: '', serie: '', estado: 'Bueno', codigo: '' }] })} className="text-sm text-primary-600 hover:text-primary-700 font-medium font-bold">
                      + Añadir fila
                    </button>
                  </div>
                  <div className="space-y-3">
                    {editingResguardo.articulos.map((art, idx) => (
                      <div key={idx} className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="flex gap-2 items-center">
                          <div className="w-16">
                            <input type="number" placeholder="Cant" className="w-full rounded-md border-slate-300 text-sm" value={art.cantidad || ''} onChange={(e) => {
                              const newArts = [...editingResguardo.articulos];
                              newArts[idx].cantidad = e.target.value;
                              setEditingResguardo({...editingResguardo, articulos: newArts});
                            }} />
                          </div>
                          <div className="flex-1">
                            <input type="text" placeholder="Nombre/Concepto del artículo" className="w-full rounded-md border-slate-300 text-sm font-bold" value={art.descripcion || art.articulo || ''} onChange={(e) => {
                              const newArts = [...editingResguardo.articulos];
                              newArts[idx].descripcion = e.target.value;
                              setEditingResguardo({...editingResguardo, articulos: newArts});
                            }} />
                          </div>
                          <div className="w-1/4">
                            <input type="text" placeholder="Código Inventario" className="w-full rounded-md border-slate-300 text-sm" value={art.codigo || art.inventario || ''} onChange={(e) => {
                              const newArts = [...editingResguardo.articulos];
                              newArts[idx].codigo = e.target.value;
                              setEditingResguardo({...editingResguardo, articulos: newArts});
                            }} />
                          </div>
                          <button type="button" onClick={() => {
                            const newArts = editingResguardo.articulos.filter((_, i) => i !== idx);
                            setEditingResguardo({...editingResguardo, articulos: newArts.length ? newArts : [{}]});
                          }} className="p-2 text-slate-400 hover:text-red-500">
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="flex gap-2 items-center">
                           <div className="flex-1">
                              <input type="text" placeholder="Marca" className="w-full rounded-md border-slate-300 text-sm" value={art.marca || ''} onChange={(e) => {
                                const newArts = [...editingResguardo.articulos];
                                newArts[idx].marca = e.target.value;
                                setEditingResguardo({...editingResguardo, articulos: newArts});
                              }} />
                           </div>
                           <div className="flex-1">
                              <input type="text" placeholder="Modelo" className="w-full rounded-md border-slate-300 text-sm" value={art.modelo || ''} onChange={(e) => {
                                const newArts = [...editingResguardo.articulos];
                                newArts[idx].modelo = e.target.value;
                                setEditingResguardo({...editingResguardo, articulos: newArts});
                              }} />
                           </div>
                           <div className="flex-1">
                              <input type="text" placeholder="No. Serie" className="w-full rounded-md border-slate-300 text-sm" value={art.serie || ''} onChange={(e) => {
                                const newArts = [...editingResguardo.articulos];
                                newArts[idx].serie = e.target.value;
                                setEditingResguardo({...editingResguardo, articulos: newArts});
                              }} />
                           </div>
                           <div className="w-32">
                              <select 
                                className="w-full rounded-md border border-slate-300 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 p-2" 
                                value={art.estado || 'Bueno'} 
                                onChange={(e) => {
                                  const newArts = [...editingResguardo.articulos];
                                  newArts[idx].estado = e.target.value;
                                  setEditingResguardo({...editingResguardo, articulos: newArts});
                                }}
                              >
                                <option value="Bueno">Bueno</option>
                                <option value="Nuevo">Nuevo</option>
                                <option value="Regular">Regular</option>
                                <option value="Malo">Malo</option>
                              </select>
                           </div>
                           <div className="flex-1">
                              <input type="text" placeholder="Observaciones" className="w-full rounded-md border-slate-300 text-sm" value={art.observaciones || ''} onChange={(e) => {
                                const newArts = [...editingResguardo.articulos];
                                newArts[idx].observaciones = e.target.value;
                                setEditingResguardo({...editingResguardo, articulos: newArts});
                              }} />
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button type="button" onClick={() => { setModalOpen(null); setEditingResguardo(null); }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancelar</button>
                  <button type="submit" className="px-6 py-2 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-900 shadow-sm">
                    Guardar Cambios
                  </button>
                </div>
              </form>
            ) : modalOpen === 'history' && historyItem ? (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
                  <h4 className="font-bold text-slate-800">{historyItem.articulo}</h4>
                  <p className="text-sm text-slate-500">Código: {historyItem.codigo} | Ubicación Actual: {historyItem.ubicacion}</p>
                </div>
                
                {historyItem.historial && historyItem.historial.length > 0 ? (
                  <div className="relative border-l-2 border-slate-200 ml-3 space-y-6 pb-4">
                    {[...historyItem.historial].reverse().map((entry, idx) => (
                      <div key={idx} className="relative pl-6">
                        <div className="absolute w-4 h-4 bg-primary-500 rounded-full -left-[9px] top-1 border-4 border-white shadow-sm"></div>
                        <div className="bg-white border border-slate-100 shadow-sm p-4 rounded-xl">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-semibold text-slate-800 text-sm">{entry.accion}</span>
                            <span className="text-xs text-slate-400">{new Date(entry.fecha).toLocaleString('es-MX')}</span>
                          </div>
                          <p className="text-sm text-slate-600">{entry.detalle}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                    No hay historial de movimientos para este artículo.
                  </div>
                )}
                
                <div className="flex justify-end pt-4 border-t border-slate-200 mt-4">
                  <button type="button" onClick={() => { setModalOpen(null); setHistoryItem(null); }} className="px-6 py-2 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-900 shadow-sm">
                    Cerrar Historial
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={(e) => handlePrintSubmit(e, 'print')}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
                  <input type="date" value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} className="w-full p-2 border rounded" />
                </div>
                
                {modalOpen === 'recepcion' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Hora de Recepción</label>
                      <input type="time" value={formData.hora} onChange={e => setFormData({...formData, hora: e.target.value})} className="w-full p-2 border rounded" />
                    </div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Doc. de Origen (Factura, etc.)</label><input type="text" className="w-full rounded-lg border-slate-300 focus:ring-primary-500 focus:border-primary-500" value={formData.origen} onChange={e => setFormData({...formData, origen: e.target.value})} /></div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Proveedor</label><input type="text" className="w-full rounded-lg border-slate-300 focus:ring-primary-500 focus:border-primary-500" value={formData.nombreProveedor} onChange={e => setFormData({...formData, nombreProveedor: e.target.value})} /></div>
                  </>
                )}

                {modalOpen === 'resguardo' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Folio (Opcional)</label>
                      <input type="text" placeholder="001" value={formData.folio} onChange={e => setFormData({...formData, folio: e.target.value})} className="w-full p-2 border rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Resguardante</label>
                      <input type="text" placeholder="Profr. Juan Pérez" value={formData.nombreResguardante} onChange={e => setFormData({...formData, nombreResguardante: e.target.value})} className="w-full p-2 border rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Área o Cargo</label>
                      <input type="text" placeholder="Ej. Aula 3 / Maestro de Historia" value={formData.areaResguardante} onChange={e => setFormData({...formData, areaResguardante: e.target.value})} className="w-full p-2 border rounded" />
                    </div>
                    <div className="md:col-span-2 mt-2">
                      <label className="flex items-center space-x-3 text-sm font-medium text-slate-700 cursor-pointer p-4 bg-indigo-50 rounded-xl border border-indigo-200 hover:bg-indigo-100 transition-colors">
                        <input type="checkbox" checked={formData.guardarEnInventario} onChange={e => setFormData({...formData, guardarEnInventario: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500 w-5 h-5" />
                        <span>Guardar estos artículos automáticamente en el <strong>Inventario General</strong> de la escuela.</span>
                      </label>
                    </div>
                  </>
                )}
                
                {modalOpen === 'baja' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Motivo de Baja</label>
                    <input type="text" placeholder="Ej. Daño irreparable, Obsolescencia tecnológica" className="w-full rounded-lg border-slate-300 focus:ring-primary-500 focus:border-primary-500" value={formData.motivo} onChange={e => setFormData({...formData, motivo: e.target.value})} required />
                  </div>
                )}
              </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-slate-700">Artículos a incluir</h4>
                    {modalOpen !== 'baja' && (
                      <button type="button" onClick={handleAddRow} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                        + Añadir fila
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {formData.articulos.map((art, idx) => (
                      <div key={idx} className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="flex gap-2 items-center">
                          <div className="w-16">
                            <input type="number" placeholder="Cant" className="w-full rounded-md border-slate-300 text-sm" value={art.cantidad || ''} onChange={(e) => {
                              const newArts = [...formData.articulos];
                              newArts[idx].cantidad = e.target.value;
                              setFormData({...formData, articulos: newArts});
                            }} />
                          </div>
                          <div className="flex-1">
                            <input type="text" placeholder="Nombre/Concepto del artículo" className="w-full rounded-md border-slate-300 text-sm font-bold" value={art.descripcion || art.articulo || ''} onChange={(e) => {
                              const newArts = [...formData.articulos];
                              newArts[idx].descripcion = e.target.value;
                              setFormData({...formData, articulos: newArts});
                            }} />
                          </div>
                          
                          {modalOpen === 'recepcion' && (
                            <div className="w-1/4">
                              <input type="text" placeholder="Código Inic. (Ej: 1-A-1)" className="w-full rounded-md border-slate-300 text-sm font-bold text-indigo-600" value={art.codigo || ''} onChange={(e) => {
                                const newArts = [...formData.articulos];
                                newArts[idx].codigo = e.target.value;
                                setFormData({...formData, articulos: newArts});
                              }} title="El sistema generará los siguientes folios de forma consecutiva automáticamente." />
                            </div>
                          )}
                          {(modalOpen === 'resguardo' || modalOpen === 'baja') && (
                            <div className="w-1/4">
                              <input type="text" placeholder="Código Inventario" className="w-full rounded-md border-slate-300 text-sm" value={art.codigo || art.inventario || ''} onChange={(e) => {
                                const newArts = [...formData.articulos];
                                newArts[idx].codigo = e.target.value;
                                setFormData({...formData, articulos: newArts});
                              }} />
                            </div>
                          )}
                          
                          {modalOpen !== 'baja' && (
                            <button type="button" onClick={() => {
                              const newArts = formData.articulos.filter((_, i) => i !== idx);
                              setFormData({...formData, articulos: newArts.length ? newArts : [{}]});
                            }} className="p-2 text-slate-400 hover:text-red-500">
                              <X className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                        <div className="flex gap-2 items-center">
                           <div className="flex-1">
                              <input type="text" placeholder="Marca" className="w-full rounded-md border-slate-300 text-sm" value={art.marca || ''} onChange={(e) => {
                                const newArts = [...formData.articulos];
                                newArts[idx].marca = e.target.value;
                                setFormData({...formData, articulos: newArts});
                              }} />
                           </div>
                           <div className="flex-1">
                              <input type="text" placeholder="Modelo" className="w-full rounded-md border-slate-300 text-sm" value={art.modelo || ''} onChange={(e) => {
                                const newArts = [...formData.articulos];
                                newArts[idx].modelo = e.target.value;
                                setFormData({...formData, articulos: newArts});
                              }} />
                           </div>
                           <div className="flex-1">
                              <input type="text" placeholder="No. Serie" className="w-full rounded-md border-slate-300 text-sm" value={art.serie || ''} onChange={(e) => {
                                const newArts = [...formData.articulos];
                                newArts[idx].serie = e.target.value;
                                setFormData({...formData, articulos: newArts});
                              }} />
                           </div>
                           {modalOpen === 'baja' ? (
                             <div className="w-1/4">
                               <input type="text" list="ubicaciones-list" placeholder="Ubicación" className="w-full rounded-md border-slate-300 text-sm" value={art.ubicacion || ''} onChange={(e) => { const newArts = [...formData.articulos]; newArts[idx].ubicacion = e.target.value; setFormData({...formData, articulos: newArts}); }} />
                             </div>
                           ) : (
                             <div className="w-32">
                                <select 
                                  className="w-full rounded-md border border-slate-300 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 p-2" 
                                  value={art.estado || 'Bueno'} 
                                  onChange={(e) => {
                                    const newArts = [...formData.articulos];
                                    newArts[idx].estado = e.target.value;
                                    setFormData({...formData, articulos: newArts});
                                  }}
                                >
                                  <option value="Bueno">Bueno</option>
                                  <option value="Nuevo">Nuevo</option>
                                  <option value="Regular">Regular</option>
                                  <option value="Malo">Malo</option>
                                </select>
                             </div>
                           )}
                           <div className="flex-1">
                              <input type="text" placeholder="Observaciones" className="w-full rounded-md border-slate-300 text-sm" value={art.observaciones || ''} onChange={(e) => {
                                const newArts = [...formData.articulos];
                                newArts[idx].observaciones = e.target.value;
                                setFormData({...formData, articulos: newArts});
                              }} />
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              {modalOpen === 'recepcion' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones</label>
                  <textarea rows="2" value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} className="w-full p-2 border rounded" placeholder="Daños visibles, faltantes..."></textarea>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setModalOpen(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium" disabled={isSubmitting}>Cancelar</button>
                {modalOpen === 'resguardo' && (
                  <button type="button" onClick={(e) => handlePrintSubmit(e, 'saveOnly')} className={`px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-sm flex items-center ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={isSubmitting}>
                    {isSubmitting ? 'Guardando...' : 'Guardar Solamente'}
                  </button>
                )}
                <button type="submit" className={`px-6 py-2 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-900 shadow-sm flex items-center ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={isSubmitting}>
                  <Printer className="w-4 h-4 mr-2" /> {isSubmitting ? 'Procesando...' : (modalOpen === 'resguardo' ? 'Guardar y Generar PDF' : 'Imprimir Formato Oficial')}
                </button>
              </div>
            </form>
            )}
          </div>
        </div>
      
      
</div>
    )}

    {printMode === 'recepcion' && printData && <ActaRecepcionPrint data={printData} />}
    {printMode === 'resguardo' && printData && <CartaResguardoPrint data={printData} />}
    {printMode === 'baja' && printData && <ActaBajaPrint data={printData} />}
    {printMode === 'etiquetas' && printData && <EtiquetasPrint items={printData} />}

    {printMode === 'corte' && printData && (
      <div className="hidden print:block page-container relative mx-auto bg-white p-8">
        <div className="page-border opacity-30"></div>
        <div className="text-center mb-8 border-b-[3px] border-slate-800 pb-6 relative">
          <div className="absolute top-0 left-0 text-slate-200">
            <Archive className="w-16 h-16 opacity-50" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-serif">ESC. SEC. GRAL. "RENACIMIENTO"</h1>
          <h2 className="text-sm font-bold text-slate-600 mt-1 uppercase tracking-widest bg-slate-100 inline-block px-3 py-1 rounded-full border border-slate-200">Reporte de Corte de Caja</h2>
          <div className="mt-6 flex justify-between items-center text-sm font-mono">
            <div className="font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200">
              PERIODO: {printData.fechaInicio} al {printData.fechaFin}
            </div>
            <div className="font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200">
              TURNO: {printData.turno}
            </div>
          </div>
        </div>
        
        {(() => {
          const sDate = new Date(printData.fechaInicio + 'T00:00:00');
          const eDate = new Date(printData.fechaFin + 'T23:59:59');
          const allPagos = [...pagosAdmin.map(p => ({...p, sysTipo: 'Admin'})), ...pagosExtra.map(p => ({...p, sysTipo: 'Extra'}))];
          const filtered = allPagos.filter(p => {
            let d = new Date();
            if (p.pagoFecha?.toDate) d = p.pagoFecha.toDate();
            else if (p.createdAt?.toDate) d = p.createdAt.toDate();
            else if (p.pagoFecha) d = new Date(p.pagoFecha);
            else if (p.fecha && p.fecha !== 'Pendiente') {
              const parts = p.fecha.split('/');
              if (parts.length === 3) d = new Date(parts[2], parts[1] - 1, parts[0]);
              else d = new Date(p.fecha);
            }
            return d >= sDate && d <= eDate;
          });
          
          const total = filtered.reduce((acc, p) => acc + (parseFloat(p.monto) || 0), 0);
          const totalAdmin = filtered.filter(p => p.sysTipo === 'Admin').reduce((acc, p) => acc + (parseFloat(p.monto) || 0), 0);
          const totalExtra = filtered.filter(p => p.sysTipo === 'Extra').reduce((acc, p) => acc + (parseFloat(p.monto) || 0), 0);
          
          return (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl text-center">
                  <div className="text-xs font-bold text-slate-500 uppercase">Ingresos Generales</div>
                  <div className="text-2xl font-black text-slate-800">${totalAdmin.toFixed(2)}</div>
                  <div className="text-xs text-slate-400 font-bold">${filtered.filter(p => p.sysTipo === 'Admin').length} Trámites</div>
                </div>
                <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl text-center">
                  <div className="text-xs font-bold text-slate-500 uppercase">Exámenes Extraordinarios</div>
                  <div className="text-2xl font-black text-slate-800">${totalExtra.toFixed(2)}</div>
                  <div className="text-xs text-slate-400 font-bold">${filtered.filter(p => p.sysTipo === 'Extra').length} Trámites</div>
                </div>
                <div className="bg-emerald-50 p-4 border-2 border-emerald-200 rounded-xl text-center">
                  <div className="text-xs font-bold text-emerald-600 uppercase">Total Neto</div>
                  <div className="text-3xl font-black text-emerald-700">${total.toFixed(2)}</div>
                </div>
              </div>
              
              <div className="mt-8">
                <h3 className="text-sm font-bold text-slate-800 uppercase border-b-2 border-slate-200 pb-2 mb-4">Desglose de Movimientos</h3>
                <table className="w-full text-xs font-mono">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="py-2 px-3 text-left border-b border-slate-200">FECHA</th>
                      <th className="py-2 px-3 text-left border-b border-slate-200">FOLIO</th>
                      <th className="py-2 px-3 text-left border-b border-slate-200">ALUMNO</th>
                      <th className="py-2 px-3 text-left border-b border-slate-200">CONCEPTO</th>
                      <th className="py-2 px-3 text-right border-b border-slate-200">MONTO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p, idx) => (
                      <tr key={idx} className="border-b border-slate-100">
                        <td className="py-1.5 px-3">
                          {(() => {
                            let d = new Date();
                            if (p.pagoFecha?.toDate) d = p.pagoFecha.toDate();
                            else if (p.createdAt?.toDate) d = p.createdAt.toDate();
                            else if (p.pagoFecha) d = new Date(p.pagoFecha);
                            return isNaN(d.getTime()) ? (p.fecha || 'N/A') : d.toLocaleDateString();
                          })()}
                        </td>
                        <td className="py-1.5 px-3 font-bold">{p.folio || p.id?.substring(0,6).toUpperCase()}</td>
                        <td className="py-1.5 px-3 truncate max-w-[200px]">{p.alumno || p.nombre}</td>
                        <td className="py-1.5 px-3 truncate max-w-[200px]">{p.concepto}</td>
                        <td className="py-1.5 px-3 text-right font-bold text-emerald-700">${parseFloat(p.monto||0).toFixed(2)}</td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan="5" className="py-4 text-center text-slate-400 italic">No hubo movimientos en este periodo.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
        
        <div className="mt-20 pt-8 grid grid-cols-2 gap-12 text-center">
          <div>
            <div className="border-b-2 border-slate-400 mb-2 h-12"></div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sello de la Institución</span>
          </div>
          <div>
            <div className="border-b-2 border-slate-400 mb-2 h-12"></div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Firma de Entrega / Conformidad</span>
          </div>
        </div>
      </div>
    )}

    
     
      {showPagoAdminModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h3 className="font-bold text-xl text-slate-800 flex items-center">
                <Wallet className="w-5 h-5 mr-2 text-primary-600" /> Registrar Pago Libre
              </h3>
              <button onClick={() => setShowPagoAdminModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleGuardarPagoManual} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Tipo de Ingreso</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setPagoFormData({...pagoFormData, tipo: 'administrativo', detalles: [{concepto: '', monto: ''}]})} className={`p-3 border rounded-xl text-sm font-bold flex flex-col items-center justify-center gap-1 transition-all ${pagoFormData.tipo === 'administrativo' ? 'bg-primary-50 border-primary-500 text-primary-700 ring-1 ring-primary-500' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                      <FileText className="w-5 h-5" /> Trámites Generales
                    </button>
                    <button type="button" onClick={() => setPagoFormData({...pagoFormData, tipo: 'extraordinario', detalles: [{concepto: 'Examen Extraordinario de ', monto: ''}]})} className={`p-3 border rounded-xl text-sm font-bold flex flex-col items-center justify-center gap-1 transition-all ${pagoFormData.tipo === 'extraordinario' ? 'bg-rose-50 border-rose-500 text-rose-700 ring-1 ring-rose-500' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                      <AlertTriangle className="w-5 h-5" /> Examen Extraordinario
                    </button>
                  </div>
                </div>
  
                <div className="relative">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nombre del Alumno</label>
                  <input 
                    type="text" 
                    required 
                    value={pagoFormData.nombre} 
                    onChange={e => {
                      const val = e.target.value;
                      setPagoFormData({...pagoFormData, nombre: val});
                      if(val.length > 1) {
                        const matches = allStudentsRaw.filter(s => {
                           const n = `${s.apellidoPaterno || ''} ${s.apellidoMaterno || ''} ${s.nombres || ''}`.trim();
                           return searchIncludes(n, val);
                        }).slice(0, 5);
                        setStudentSearchMatches(matches);
                        setShowStudentDropdown(matches.length > 0);
                      } else {
                        setShowStudentDropdown(false);
                      }
                    }} 
                    onFocus={() => { if(pagoFormData.nombre.length > 1 && studentSearchMatches.length > 0) setShowStudentDropdown(true); }}
                    onBlur={() => setTimeout(() => setShowStudentDropdown(false), 200)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" 
                    placeholder="Escribe para buscar un alumno..." 
                    autoComplete="off"
                  />
                  {showStudentDropdown && (
                    <ul className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {studentSearchMatches.map(s => {
                        const fullName = `${s.apellidoPaterno || ''} ${s.apellidoMaterno || ''} ${s.nombres || ''}`.trim();
                        return (
                          <li key={s.id} 
                              className="px-4 py-3 hover:bg-primary-50 cursor-pointer text-sm text-slate-700 border-b border-slate-100 last:border-0"
                              onClick={() => {
                                setPagoFormData({...pagoFormData, nombre: fullName});
                                setShowStudentDropdown(false);
                              }}>
                            <div className="font-bold text-slate-800">{fullName}</div>
                            <div className="text-xs text-slate-500 font-medium">{s.grado !== 'N/A' ? `${s.grado} - Grupo ${s.grupo}` : 'Sin asignar'}</div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-bold text-slate-700">Conceptos a Cobrar</label>
                  </div>
                  
                  <div className="space-y-3">
                    {pagoFormData.detalles.map((detalle, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <div className="flex-1">
                          {pagoFormData.tipo === 'administrativo' ? (
                            <select required value={detalle.concepto} onChange={e => {
                                const newDetalles = [...pagoFormData.detalles];
                                newDetalles[index].concepto = e.target.value;
                                setPagoFormData({...pagoFormData, detalles: newDetalles});
                            }} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm">
                              <option value="">Selecciona un concepto...</option>
                              <option value="Constancia de Estudios">Constancia de Estudios</option>
                              <option value="Reposición de Credencial">Reposición de Credencial</option>
                              <option value="Paquete Escolar">Paquete Escolar</option>
                              <option value="Donación / Aportación">Donación / Aportación Voluntaria</option>
                              <option value="Otro">Otro (Especificar en notas)</option>
                            </select>
                          ) : (
                            <input type="text" required value={detalle.concepto} onChange={e => {
                                const newDetalles = [...pagoFormData.detalles];
                                newDetalles[index].concepto = e.target.value;
                                setPagoFormData({...pagoFormData, detalles: newDetalles});
                            }} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 text-sm" placeholder="Ej. Examen Extraordinario de Matemáticas" />
                          )}
                        </div>
                        <div className="w-28 relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                          <input type="number" step="0.01" required value={detalle.monto} onChange={e => {
                              const newDetalles = [...pagoFormData.detalles];
                              newDetalles[index].monto = e.target.value;
                              setPagoFormData({...pagoFormData, detalles: newDetalles});
                          }} className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-bold text-emerald-600 text-sm" placeholder="0.00" />
                        </div>
                        {pagoFormData.detalles.length > 1 && (
                          <button type="button" onClick={() => {
                              const newDetalles = pagoFormData.detalles.filter((_, i) => i !== index);
                              setPagoFormData({...pagoFormData, detalles: newDetalles});
                          }} className="p-2 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors mt-0.5" title="Eliminar">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <button type="button" onClick={() => {
                      setPagoFormData({...pagoFormData, detalles: [...pagoFormData.detalles, {concepto: pagoFormData.tipo === 'extraordinario' ? 'Examen Extraordinario de ' : '', monto: ''}]});
                  }} className="mt-3 text-sm font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Agregar otro concepto
                  </button>
                </div>
  
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 mt-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Monto Total</label>
                    <div className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-emerald-50 text-emerald-700 font-black text-lg flex items-center">
                      <span className="mr-1">$</span>
                      {pagoFormData.detalles.reduce((s, d) => s + (parseFloat(d.monto) || 0), 0).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Método de Pago</label>
                    <select value={pagoFormData.metodo} onChange={e => setPagoFormData({...pagoFormData, metodo: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                      <option value="Efectivo">Efectivo</option>
                      <option value="Transferencia">Transferencia</option>
                      <option value="Depósito">Depósito Bancario</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 mt-4">
                  <button type="button" onClick={() => setShowPagoAdminModal(false)} className="px-5 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Cancelar</button>
                  <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow-sm flex items-center">
                    <CheckCircle2 className="w-5 h-5 mr-2" /> {isSubmitting ? 'Guardando...' : 'Registrar Cobro'}
                  </button>
                </div>
</form>
          </div>
        </div>
      )}

      {receiptPago && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 print:static print:bg-white print:p-0 print:block backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none print:rounded-none print:w-full print:max-w-none relative flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50 sticky top-0 z-10 rounded-t-2xl no-print">
              <h3 className="font-bold text-xl text-slate-800 flex items-center"><Printer className="w-5 h-5 mr-2 text-primary-600"/> Generar Recibo</h3>
              <div className="flex items-center gap-3">
                <button onClick={() => window.print()} className="bg-primary-600 text-white px-5 py-2 rounded-lg font-bold flex items-center hover:bg-primary-700 shadow-sm transition-all hover:scale-105 active:scale-95">
                  <Printer className="w-4 h-4 mr-2"/> Imprimir
                </button>
                <button onClick={() => setReceiptPago(null)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors"><X className="w-6 h-6"/></button>
              </div>
            </div>
            <div className="p-4 sm:p-8 flex-1 bg-slate-200 overflow-y-auto print:bg-white print:overflow-visible print:p-0 flex justify-center items-start">
              <div className="page-container relative mx-auto bg-white" style={{ marginTop: '0', marginBottom: '0' }}>
                <div className="page-border opacity-30"></div>
                <div className="text-center mb-8 border-b-[3px] border-slate-800 pb-6 relative">
                  <div className="absolute top-0 left-0 text-slate-200">
                    <Archive className="w-16 h-16 opacity-50" />
                  </div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight font-serif">ESC. SEC. GRAL. "RENACIMIENTO"</h1>
                  <h2 className="text-sm font-bold text-slate-600 mt-1 uppercase tracking-widest bg-slate-100 inline-block px-3 py-1 rounded-full border border-slate-200">Recibo Oficial de Tr�mite Interno</h2>
                  <div className="mt-6 flex justify-between items-center text-sm font-mono">
                    <div className="font-bold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-md border border-rose-200 flex items-center">
                      FOLIO: {(() => {
                        if (receiptPago.folio) return receiptPago.folio;
                        if (receiptPago.id) return receiptPago.id.substring(0, 6).toUpperCase();
                        return '000000';
                      })()}
                    </div>
                    <div className="font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200">
                      FECHA: {(() => {
                        let dateObj = new Date();
                        if (receiptPago.pagoFecha?.toDate) dateObj = receiptPago.pagoFecha.toDate();
                        else if (receiptPago.createdAt?.toDate) dateObj = receiptPago.createdAt.toDate();
                        else if (receiptPago.pagoFecha) dateObj = new Date(receiptPago.pagoFecha);
                        else if (receiptPago.fecha && receiptPago.fecha !== 'Pendiente') {
                          const parts = receiptPago.fecha.split('/');
                          if (parts.length === 3) dateObj = new Date(parts[2], parts[1] - 1, parts[0]);
                          else dateObj = new Date(receiptPago.fecha);
                        }
                        if (isNaN(dateObj.getTime())) dateObj = new Date();
                        return dateObj.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
                      })()}
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Recibimos de:</span>
                    <div className="text-lg font-bold text-slate-900 bg-slate-50/50 px-4 py-3 border-b-2 border-slate-200">
                      {receiptPago.alumno || receiptPago.nombre}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Por concepto de:</span>
                        <div className="text-sm text-slate-800 bg-slate-50/50 border-b-2 border-slate-200 min-h-[80px]">
                          {receiptPago.detalles && receiptPago.detalles.length > 0 ? (
                            <table className="w-full text-left">
                              <thead>
                                <tr className="border-b border-slate-200 text-xs text-slate-500">
                                  <th className="py-2 px-4 font-bold">Concepto</th>
                                  <th className="py-2 px-4 font-bold text-right w-32">Importe</th>
                                </tr>
                              </thead>
                              <tbody>
                                {receiptPago.detalles.map((d, i) => (
                                  <tr key={i} className="border-b border-slate-100 last:border-0">
                                    <td className="py-2 px-4 font-bold">{d.concepto}</td>
                                    <td className="py-2 px-4 font-bold text-right font-mono text-slate-600">$ {parseFloat(d.monto).toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="px-4 py-3 font-bold">
                               {(receiptPago.concepto || '').split(' + ').map((c, i) => (
                                 <div key={i} className="mb-1.5 last:mb-0 flex items-start before:content-['\\u2022'] before:mr-2 before:text-primary-500">{c}</div>
                               ))}
                            </div>
                          )}
                        </div>
                      </div>
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Forma de Pago:</span>
                      <div className="text-sm font-bold text-slate-800 bg-slate-50/50 px-4 py-3 border-b-2 border-slate-200 min-h-[80px] flex items-center justify-center text-center uppercase tracking-wide">
                        {receiptPago.metodo || 'Efectivo'}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <div className="w-1/2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1 text-right">La Cantidad de:</span>
                      <div className="text-3xl font-black text-emerald-700 bg-emerald-50 px-4 py-3 border-2 border-emerald-200 rounded-xl text-right shadow-inner">
                        ${parseFloat(receiptPago.monto).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-20 pt-8 grid grid-cols-2 gap-12 text-center">
                  <div>
                    <div className="border-b-2 border-slate-400 mb-2 h-12"></div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sello de la Instituci�n</span>
                  </div>
                  <div>
                    <div className="border-b-2 border-slate-400 mb-2 h-12"></div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Firma de Recibido</span>
                  </div>
                </div>
                <div className="mt-12 text-center border-t border-dashed border-slate-300 pt-4">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                    *** Este recibo es v�lido �nicamente para tr�mites administrativos internos ***<br/>
                    No representa un comprobante fiscal. Conserve este documento para cualquier aclaraci�n.
                  </p>
                </div>
                <div className="hidden print:block absolute inset-0 -z-10 flex items-center justify-center opacity-[0.03] pointer-events-none">
                  <h1 className="text-[150px] font-black transform -rotate-45 tracking-tighter">RENACIMIENTO</h1>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
