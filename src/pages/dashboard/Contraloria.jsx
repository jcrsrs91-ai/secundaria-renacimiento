import { useState, useEffect } from 'react';
import { DollarSign, PackageOpen, Plus, FileText, CheckCircle2, Printer, X, Edit2, Trash2, ScanLine, Search, Download, History, Monitor, Laptop, Projector, BookOpen, Tv, Speaker, Keyboard, Mouse, Server, Smartphone, Tablet, Archive, PenTool, Box, Armchair, Cpu } from 'lucide-react';
import toast from 'react-hot-toast';
import Papa from 'papaparse';
import { db } from '../../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import ActaRecepcionPrint from '../../components/ActaRecepcionPrint';
import CartaResguardoPrint from '../../components/CartaResguardoPrint';
import ScannerInventarioModal from '../../components/ScannerInventarioModal';
import EtiquetasPrint from '../../components/EtiquetasPrint';
import ActaBajaPrint from '../../components/ActaBajaPrint';

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
  const [activeTab, setActiveTab] = useState('pagos');

  const pagosRecientes = [
    { folio: 'P-001', alumno: 'Álvarez Gómez Ana', concepto: 'Reposición de Credencial', monto: '$50.00', fecha: '04/06/2026', estado: 'Pagado' },
    { folio: 'P-002', alumno: 'Ruiz Díaz Luis', concepto: 'Constancia de Estudios', monto: '$30.00', fecha: '04/06/2026', estado: 'Pagado' },
  ];

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
    if (!name) return 'INV';
    const firstWord = name.trim().split(' ')[0].toUpperCase();
    const cleaned = firstWord.replace(/[^A-Z]/g, '');
    return cleaned.substring(0, 3) || 'INV';
  };

  const getNextAutoCodeBase = (name, currentOffset = 0) => {
    const prefix = generatePrefix(name);
    let maxNum = 0;
    inventario.forEach(item => {
      if (item.codigo && item.codigo.startsWith(`${prefix}-`)) {
        const match = item.codigo.match(new RegExp(`^${prefix}-(\\d+)`));
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      }
    });
    return `${prefix}-${String(maxNum + 1 + currentOffset).padStart(4, '0')}`;
  };

  const migrarCodigos = async () => {
    try {
      setIsSubmitting(true);
      toast.loading("Migrando códigos antiguos...", { id: 'migrar' });
      
      const toUpdate = inventario.filter(item => item.codigo && item.codigo.includes('INV-AUTO-'));
      
      if (toUpdate.length === 0) {
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
      for (const item of toUpdate) {
        const prefix = generatePrefix(item.articulo);
        if (!prefixCounters[prefix]) prefixCounters[prefix] = 0;
        prefixCounters[prefix]++;
        const newCode = `${prefix}-${String(prefixCounters[prefix]).padStart(4, '0')}`;
        
        await updateDoc(doc(db, 'inventario', item.id), { codigo: newCode });
        actualizados++;
      }
      
      toast.success(`Se actualizaron ${actualizados} códigos exitosamente.`, { id: 'migrar' });
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

  // Filtrar el inventario de acuerdo con los criterios seleccionados
  const filteredInventario = inventario.filter(item => {
    const matchesSearch = !searchTerm || 
      (item.codigo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.articulo || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'Todos' || item.estado === statusFilter;
    const matchesLocation = locationFilter === 'Todos' || item.ubicacion === locationFilter;
    
    return matchesSearch && matchesStatus && matchesLocation;
  }).sort((a, b) => {
    return (a.codigo || '').localeCompare((b.codigo || ''), undefined, { numeric: true, sensitivity: 'base' });
  });

  const [printMode, setPrintMode] = useState(null); // 'recepcion' | 'resguardo' | 'baja' | 'etiquetas'
  const [printData, setPrintData] = useState(null);
  
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

          let autoCodeOffset = 0;
          // 2. Guardar cada artículo en el inventario
          for (let i = 0; i < validItems.length; i++) {
            const art = validItems[i];
            const tempCode = getNextAutoCodeBase(art.descripcion || art.articulo || art.marca, autoCodeOffset);
            autoCodeOffset++;
            await addDoc(collection(db, 'inventario'), {
              codigo: tempCode,
              articulo: `${art.descripcion || ''} ${art.marca || ''}`.trim(),
              ubicacion: 'Bodega Contraloría',
              cantidad: Number(art.cantidad) || 1,
              estado: art.estado || 'Nuevo',
              serie: art.serie || '',
              fechaIngreso: new Date().toISOString()
            });
          }
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
          let autoCodeOffset = 0;
          // 1. Crear artículos consolidados para guardar en el Acta de Resguardo y para imprimir
          const resguardoArticulos = validItems.map((art, idx) => {
            const qty = Number(art.cantidad) || 1;
            let baseCode = art.codigo || art.inventario || '';
            if (!baseCode) {
              baseCode = getNextAutoCodeBase(art.descripcion || art.articulo || art.marca, autoCodeOffset);
              autoCodeOffset += qty;
            }
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
            const baseCode = art.codigo || art.inventario;
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
                historial: [...currentHistorial, {
                  fecha: new Date().toISOString(),
                  accion: "Asignación de Resguardo",
                  detalle: `Asignado a ${formData.nombreResguardante} (Folio ${formData.folio || 'S/F'}).`,
                  usuario: "Contraloría"
                }]
              });
            } else if (formData.guardarEnInventario) {
              // Si no existe y se marcó "Guardar en Inventario", lo desglosamos y guardamos individualmente
              const baseCode = art.codigo || art.inventario || `INV-RESG-${Date.now().toString().slice(-4)}${i}`;
              const qty = Number(art.cantidad) || 1;
              const { codes } = generateCodeRange(baseCode, qty);
              
              for (const code of codes) {
                await addDoc(collection(db, 'inventario'), {
                  codigo: code,
                  articulo: `${art.descripcion || ''} ${art.marca || ''}`.trim(),
                  ubicacion: formData.areaResguardante || 'En resguardo',
                  cantidad: 1, // Guardado individualmente
                  estado: art.estado || 'Bueno',
                  serie: art.serie || '',
                  fechaIngreso: new Date().toISOString()
                });
              }
            }
          }
          // Usar artículos consolidados en la impresión
          dataToPrint.articulos = resguardoArticulos;
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
        ubicacion: editingItem.ubicacion,
        cantidad: Number(editingItem.cantidad),
        estado: editingItem.estado,
        historial: newHistorial
      });
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
      
      // Verificar duplicados
      for (const art of validItems) {
        const qty = Number(art.cantidad) || 1;
        const baseCode = art.codigo || art.inventario;
        if (baseCode) {
           const { codes } = generateCodeRange(baseCode, qty);
           for (const code of codes) {
             if (inventario.some(i => i.codigo === code && i.id !== art.id)) {
               toast.error(`El código de inventario ${code} ya existe en el sistema. Usa otro folio.`);
               return;
             }
           }
        }
      }

      const resRef = doc(db, 'resguardos', editingResguardo.id);
      
      const originalResguardo = resguardos.find(r => r.id === editingResguardo.id);
      const originalArticulos = originalResguardo ? originalResguardo.articulos || [] : [];
      
      const removedItems = originalArticulos.filter((origArt, idx) => 
        !validItems.some(vArt => vArt._uid === idx)
      );

      let autoCodeOffset = 0;
      // Asegurar que todos tengan un código, auto-generando si es necesario
      const articulosProcesados = validItems.map((art, idx) => {
        const qty = Number(art.cantidad) || 1;
        let finalCode = art.codigo || art.inventario || '';
        if (!finalCode) {
           const baseCode = getNextAutoCodeBase(art.descripcion || art.articulo || art.marca, autoCodeOffset);
           const { display } = generateCodeRange(baseCode, qty);
           finalCode = display;
           autoCodeOffset += qty;
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
    const confirmacion = window.confirm(`¿Estás seguro de eliminar el resguardo con Folio ${res.folio || 'S/F'} de ${res.nombreResguardante}?\n\nEsta acción no se puede deshacer.`);
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
            const invItem = inventario.find(i => i.codigo === code || (art.id && i.id === art.id));
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
            const invItem = inventario.find(i => i.codigo === code || (art.id && i.id === art.id));
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
    <div className={printMode ? "hidden" : "space-y-6"}>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Contraloría</h2>
          <p className="text-slate-500 text-sm">Control de ingresos (trámites) e inventario del mobiliario escolar.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pagos')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${activeTab === 'pagos' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <DollarSign className="w-4 h-4 mr-2" /> Registro de Pagos
          </button>
          <button
            onClick={() => setActiveTab('inventario')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${activeTab === 'inventario' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <PackageOpen className="w-4 h-4 mr-2" /> Inventario de Mobiliario
          </button>
          <button
            onClick={() => setActiveTab('resguardos')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${activeTab === 'resguardos' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <FileText className="w-4 h-4 mr-2" /> Historial de Resguardos
          </button>
        </nav>
      </div>

      {activeTab === 'pagos' && (
        <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="font-semibold text-slate-700">Ingresos Recientes</h3>
            <button className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-1" /> Registrar Pago
            </button>
          </div>
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Folio</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Alumno</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Concepto</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Monto</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Estatus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {pagosRecientes.map(p => (
                <tr key={p.folio}>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{p.folio}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{p.alumno}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{p.concepto}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-800">{p.monto}</td>
                  <td className="px-6 py-4 text-sm text-emerald-600 flex items-center">
                    <CheckCircle2 className="w-4 h-4 mr-1" /> {p.estado}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'inventario' && (
        <div className="space-y-6">
          {/* Desglose de Bienes Nuevos */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 shadow-inner">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
              <h4 className="text-lg font-bold text-slate-800 flex items-center">
                <PackageOpen className="w-6 h-6 mr-2 text-indigo-600" /> Bienes Nuevos
              </h4>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 overflow-y-auto pr-2 custom-scrollbar pb-2">
              {desgloseNuevosArray.length > 0 ? desgloseNuevosArray.map((item, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col items-center justify-center text-center hover:border-indigo-300 hover:shadow-md transition-all group">
                  <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 mb-3 transition-colors">
                    {getIconForArticulo(item.nombre)}
                  </div>
                  <span className="text-xs font-semibold text-slate-600 mb-1 line-clamp-2 leading-tight min-h-[2.5rem] flex items-center">{item.nombre}</span>
                  <span className="text-2xl font-black text-indigo-600 mb-2">{item.cantidad}</span>
                  <div className="w-full text-left text-[10px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 flex-1 overflow-y-auto custom-scrollbar min-h-[3rem]">
                    {item.detalles.map((det, i) => (
                      <div key={i} className="truncate" title={det}>• {det}</div>
                    ))}
                  </div>
                </div>
              )) : (
                <div className="col-span-full py-6 text-center text-slate-500 italic">No hay artículos nuevos registrados.</div>
              )}
            </div>
          </div>

          {/* Desglose de Bienes en Uso */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 shadow-inner">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
              <h4 className="text-lg font-bold text-slate-800 flex items-center">
                <Archive className="w-6 h-6 mr-2 text-indigo-600" /> Bienes en Uso (Bueno, Regular, Malo)
              </h4>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 overflow-y-auto pr-2 custom-scrollbar pb-2">
              {desgloseUsadosArray.length > 0 ? desgloseUsadosArray.map((item, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col items-center justify-center text-center hover:border-indigo-300 hover:shadow-md transition-all group">
                  <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 mb-3 transition-colors">
                    {getIconForArticulo(item.nombre)}
                  </div>
                  <span className="text-xs font-semibold text-slate-600 mb-1 line-clamp-2 leading-tight min-h-[2.5rem] flex items-center">{item.nombre}</span>
                  <span className="text-2xl font-black text-indigo-600 mb-2">{item.cantidad}</span>
                  <div className="w-full text-left text-[10px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 flex-1 overflow-y-auto custom-scrollbar min-h-[3rem]">
                    {item.detalles.map((det, i) => (
                      <div key={i} className="truncate" title={det}>• {det}</div>
                    ))}
                  </div>
                </div>
              )) : (
                <div className="col-span-full py-6 text-center text-slate-500 italic">No hay artículos en uso registrados.</div>
              )}
            </div>
          </div>

          {/* Tarjetas de Formatos Oficiales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 flex flex-col justify-between shadow-sm">
              <div className="mb-3">
                <h4 className="font-bold text-blue-900 text-lg">Acta de Recepción (Alta)</h4>
                <p className="text-blue-700 text-xs mt-1">Alta oficial de bienes nuevos o donaciones.</p>
              </div>
              <button onClick={() => openModal('recepcion')} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg shadow-md transition flex items-center justify-center text-sm">
                <Printer className="w-4 h-4 mr-2" /> Generar
              </button>
            </div>
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5 flex flex-col justify-between shadow-sm">
              <div className="mb-3">
                <h4 className="font-bold text-amber-900 text-lg">Carta de Resguardo</h4>
                <p className="text-amber-700 text-xs mt-1">Asignar bienes a maestros o áreas.</p>
              </div>
              <button onClick={() => openModal('resguardo')} className="bg-amber-600 hover:bg-amber-700 text-white p-2 rounded-lg shadow-md transition flex items-center justify-center text-sm">
                <Printer className="w-4 h-4 mr-2" /> Generar
              </button>
            </div>
            <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-xl p-5 flex flex-col justify-between shadow-sm">
              <div className="mb-3">
                <h4 className="font-bold text-rose-900 text-lg">Acta de Baja</h4>
                <p className="text-rose-700 text-xs mt-1">Desecho oficial de bienes inservibles.</p>
              </div>
              <button onClick={() => openModal('baja')} className="bg-rose-600 hover:bg-rose-700 text-white p-2 rounded-lg shadow-md transition flex items-center justify-center text-sm">
                <Printer className="w-4 h-4 mr-2" /> Generar Libre
              </button>
            </div>
          </div>

          {/* BARRA DE BÚSQUEDA Y FILTRADO */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-medium text-slate-500 mb-1">Buscar por Artículo o Código</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input 
                  type="text" 
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                  placeholder="Ej. Silla, Computadora, o INV-..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                />
              </div>
              </div>
            </div>
            
            {inventario.some(item => item.codigo && item.codigo.includes('INV-AUTO-')) && (
              <div className="w-full md:w-auto">
                <button 
                  onClick={migrarCodigos}
                  disabled={isSubmitting}
                  title="Actualiza los códigos antiguos 'INV-AUTO' al nuevo formato basado en el nombre."
                  className="w-full md:w-auto bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 border border-amber-600 rounded-lg text-sm font-bold shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Migrando...' : 'Migrar Códigos Antiguos'}
                </button>
              </div>
            )}

            <div className="w-full md:w-48">
              <label className="block text-xs font-medium text-slate-500 mb-1">Ubicación</label>
              <select 
                className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                value={locationFilter} 
                onChange={e => setLocationFilter(e.target.value)}
              >
                <option value="Todos">Todas las ubicaciones</option>
                {ubicacionesUnicas.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-48">
              <label className="block text-xs font-medium text-slate-500 mb-1">Estado Físico</label>
              <select 
                className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="Todos">Todos los estados</option>
                <option value="Nuevo">Nuevo</option>
                <option value="Bueno">Bueno</option>
                <option value="Regular">Regular</option>
                <option value="Malo">Malo</option>
              </select>
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-semibold text-slate-700">Catálogo de Bienes Activos</h3>
              <div className="flex gap-2">
                {selectedItems.length > 0 && (
                  <>
                    <button onClick={handlePrintEtiquetas} className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 shadow-sm transition-colors mr-1">
                      <Printer className="w-4 h-4 mr-2" /> Imprimir Etiquetas
                    </button>
                    <button onClick={() => openModal('resguardo')} className="flex items-center px-4 py-2 bg-amber-100 text-amber-800 rounded-lg text-sm font-medium hover:bg-amber-200 shadow-sm transition-colors border border-amber-200 mr-1">
                      <FileText className="w-4 h-4 mr-2" /> Generar Resguardo
                    </button>
                    <button onClick={() => openModal('baja')} className="flex items-center px-4 py-2 bg-rose-100 text-rose-800 rounded-lg text-sm font-medium hover:bg-rose-200 shadow-sm transition-colors border border-rose-200 mr-1">
                      <FileText className="w-4 h-4 mr-2" /> Generar Baja
                    </button>
                    <button onClick={() => handleBulkStatusChange('Nuevo')} className="flex items-center px-4 py-2 bg-emerald-100 text-emerald-800 rounded-lg text-sm font-medium hover:bg-emerald-200 shadow-sm transition-colors border border-emerald-200 mr-1">
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Marcar como Nuevo
                    </button>
                    <button onClick={handleBulkDelete} className="flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 shadow-sm transition-colors border border-red-200 mr-2">
                      <Trash2 className="w-4 h-4 mr-2" /> Eliminar ({selectedItems.length})
                    </button>
                  </>
                )}
                <button onClick={handleExportCSV} className="flex items-center px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 shadow-sm transition-colors">
                  <Download className="w-4 h-4 mr-2 text-primary-600" /> Exportar CSV
                </button>
                <button onClick={() => setShowScannerModal(true)} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm transition-colors">
                  <ScanLine className="w-4 h-4 mr-2" /> Escanear Lista (OCR)
                </button>
                <button onClick={() => setModalOpen('recepcion')} className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 shadow-sm transition-colors">
                  <Plus className="w-4 h-4 mr-1" /> Añadir Artículo
                </button>
              </div>
            </div>
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left w-12">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    checked={filteredInventario.length > 0 && filteredInventario.every(item => selectedItems.includes(item.id))}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Código</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Artículo</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Ubicación</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Cantidad</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredInventario.map(item => (
                <tr key={item.id} className={selectedItems.includes(item.id) ? 'bg-indigo-50/50' : ''}>
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => toggleSelectItem(item.id)}
                    />
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{item.codigo}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{item.articulo}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{item.ubicacion}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-800">{item.cantidad}</td>
                  <td className="px-6 py-4 text-sm text-emerald-600 flex items-center">
                    <CheckCircle2 className="w-4 h-4 mr-1" /> {item.estado}
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    <button onClick={() => handleEditClick(item)} className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors mr-1">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteClick(item.id)} className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors mr-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setHistoryItem(item); setModalOpen('history'); }} className="text-amber-600 hover:text-amber-800 p-2 hover:bg-amber-50 rounded-lg transition-colors">
                      <History className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredInventario.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-slate-500">No hay artículos registrados en el inventario que coincidan con los filtros.</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>

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
                {resguardos
                  .filter(res => {
                    if (!resguardoSearch) return true;
                    const query = resguardoSearch.toLowerCase();
                    return (
                      (res.folio || '').toLowerCase().includes(query) ||
                      (res.nombreResguardante || '').toLowerCase().includes(query) ||
                      (res.areaResguardante || '').toLowerCase().includes(query)
                    );
                  })
                  .map(res => {
                    const totalArticulos = res.articulos ? res.articulos.reduce((sum, a) => sum + (Number(a.cantidad) || 0), 0) : 0;
                    return (
                      <tr key={res.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm font-bold text-red-600">{res.folio || 'S/F'}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {res.fecha ? new Date(res.fecha + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-900 uppercase">{res.nombreResguardante}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{res.areaResguardante || '-'}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                          {totalArticulos} {totalArticulos === 1 ? 'artículo' : 'artículos'}
                        </td>
                        <td className="px-6 py-4 text-sm text-right space-x-2">
                          <button 
                            onClick={() => {
                              setPrintData(res);
                              setPrintMode('resguardo');
                              setTimeout(() => window.print(), 500);
                            }}
                            className="text-slate-600 hover:text-slate-800 p-2 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center text-xs font-medium"
                            title="Reimprimir Carta de Resguardo"
                          >
                            <Printer className="w-4 h-4 mr-1" /> Reimprimir
                          </button>
                          <button 
                            onClick={() => handleEditResguardoClick(res)}
                            className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center text-xs font-medium"
                            title="Editar Datos del Resguardo"
                          >
                            <Edit2 className="w-4 h-4 mr-1" /> Editar
                          </button>
                          <button 
                            onClick={() => handleDuplicateResguardo(res)}
                            className="text-emerald-600 hover:text-emerald-800 p-2 hover:bg-emerald-50 rounded-lg transition-colors inline-flex items-center text-xs font-medium"
                            title="Duplicar artículos para una nueva acta"
                          >
                            <Plus className="w-4 h-4 mr-1" /> Duplicar
                          </button>
                          <button 
                            onClick={() => handleDeleteResguardoClick(res)}
                            className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center text-xs font-medium"
                            title="Eliminar Resguardo"
                          >
                            <Trash2 className="w-4 h-4 mr-1" /> Eliminar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                {resguardos.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500 bg-slate-50">
                      No se han emitido Cartas de Resguardo todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
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
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Código de Inventario</label>
                    <input type="text" value={editingItem.codigo} onChange={e => setEditingItem({...editingItem, codigo: e.target.value})} className="w-full p-2 border rounded font-mono text-sm bg-slate-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Artículo (Descripción y Marca)</label>
                    <input type="text" value={editingItem.articulo} onChange={e => setEditingItem({...editingItem, articulo: e.target.value})} className="w-full p-2 border rounded" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad</label>
                      <input type="number" value={editingItem.cantidad} onChange={e => setEditingItem({...editingItem, cantidad: e.target.value})} className="w-full p-2 border rounded" />
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
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ubicación Actual</label>
                    <input type="text" value={editingItem.ubicacion} onChange={e => setEditingItem({...editingItem, ubicacion: e.target.value})} className="w-full p-2 border rounded" />
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
                      <div key={idx} className="flex gap-2">
                        <div className="w-16">
                          <input type="number" placeholder="Cant" className="w-full rounded-md border-slate-300 text-sm" value={art.cantidad || ''} onChange={(e) => {
                            const newArts = [...editingResguardo.articulos];
                            newArts[idx].cantidad = e.target.value;
                            setEditingResguardo({...editingResguardo, articulos: newArts});
                          }} />
                        </div>
                        <div className="flex-1">
                          <input type="text" placeholder="Descripción del artículo" className="w-full rounded-md border-slate-300 text-sm" value={art.descripcion || art.articulo || ''} onChange={(e) => {
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
                        <button type="button" onClick={() => {
                          const newArts = editingResguardo.articulos.filter((_, i) => i !== idx);
                          setEditingResguardo({...editingResguardo, articulos: newArts.length ? newArts : [{}]});
                        }} className="p-2 text-slate-400 hover:text-red-500">
                          <X className="w-5 h-5" />
                        </button>
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
                      <label className="flex items-center space-x-3 text-sm font-medium text-slate-700 cursor-pointer p-4 bg-amber-50 rounded-xl border border-amber-200 hover:bg-amber-100 transition-colors">
                        <input type="checkbox" checked={formData.guardarEnInventario} onChange={e => setFormData({...formData, guardarEnInventario: e.target.checked})} className="rounded text-amber-600 focus:ring-amber-500 w-5 h-5" />
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
                      <div key={idx} className="flex gap-2">
                        <div className="w-16">
                          <input type="number" placeholder="Cant" className="w-full rounded-md border-slate-300 text-sm" value={art.cantidad || ''} onChange={(e) => {
                            const newArts = [...formData.articulos];
                            newArts[idx].cantidad = e.target.value;
                            setFormData({...formData, articulos: newArts});
                          }} />
                        </div>
                        <div className="flex-1">
                          <input type="text" placeholder="Descripción del artículo" className="w-full rounded-md border-slate-300 text-sm" value={art.descripcion || art.articulo || ''} onChange={(e) => {
                            const newArts = [...formData.articulos];
                            newArts[idx].descripcion = e.target.value;
                            setFormData({...formData, articulos: newArts});
                          }} />
                        </div>
                        {modalOpen === 'recepcion' && (
                          <div className="w-1/5">
                            <input type="text" placeholder="Código Inic. (Ej: 1-A-1)" className="w-full rounded-md border-slate-300 text-sm font-bold text-indigo-600" value={art.codigo || ''} onChange={(e) => {
                              const newArts = [...formData.articulos];
                              newArts[idx].codigo = e.target.value;
                              setFormData({...formData, articulos: newArts});
                            }} title="El sistema generará los siguientes folios de forma consecutiva automáticamente." />
                          </div>
                        )}
                        <div className="w-1/5">
                          {modalOpen === 'resguardo' || modalOpen === 'baja' ? (
                            <input type="text" placeholder="Código Inventario" className="w-full rounded-md border-slate-300 text-sm" value={art.codigo || art.inventario || ''} onChange={(e) => {
                              const newArts = [...formData.articulos];
                              newArts[idx].codigo = e.target.value;
                              setFormData({...formData, articulos: newArts});
                            }} />
                          ) : (
                            <input type="text" placeholder="Marca/Modelo" className="w-full rounded-md border-slate-300 text-sm" value={art.marca || ''} onChange={(e) => {
                              const newArts = [...formData.articulos];
                              newArts[idx].marca = e.target.value;
                              setFormData({...formData, articulos: newArts});
                            }} />
                          )}
                        </div>
                        <div className="w-28">
                          {modalOpen === 'recepcion' ? (
                            <input type="text" placeholder="No. Serie" className="w-full rounded-md border-slate-300 text-sm" value={art.serie || ''} onChange={(e) => {
                              const newArts = [...formData.articulos];
                              newArts[idx].serie = e.target.value;
                              setFormData({...formData, articulos: newArts});
                            }} />
                          ) : modalOpen === 'baja' ? (
                            <input type="text" placeholder="Ubicación" className="w-full rounded-md border-slate-300 text-sm" value={art.ubicacion || ''} onChange={(e) => {
                              const newArts = [...formData.articulos];
                              newArts[idx].ubicacion = e.target.value;
                              setFormData({...formData, articulos: newArts});
                            }} />
                          ) : (
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
                          )}
                        </div>
                        
                        {modalOpen !== 'baja' && (
                          <button type="button" onClick={() => {
                            const newArts = formData.articulos.filter((_, i) => i !== idx);
                            setFormData({...formData, articulos: newArts.length ? newArts : [{}]});
                          }} className="p-2 text-slate-400 hover:text-red-500">
                            <X className="w-5 h-5" />
                          </button>
                        )}
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
    
    {showScannerModal && (
      <ScannerInventarioModal 
        onClose={() => setShowScannerModal(false)} 
      />
    )}
    </>
  );
}
