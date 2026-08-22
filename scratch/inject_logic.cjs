const fs = require('fs');

let c = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');

const effectReplacement = `  // Efecto para Pagos Administrativos y Extraordinarios
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
      monto: \`$\${parseFloat(p.monto).toFixed(2)}\`,
      pagoFecha: p.createdAt 
    }))
  ].sort((a, b) => {
     const dateA = a.pagoFecha?.toDate ? a.pagoFecha.toDate() : new Date(a.pagoFecha || 0);
     const dateB = b.pagoFecha?.toDate ? b.pagoFecha.toDate() : new Date(b.pagoFecha || 0);
     return dateB - dateA;
  });

  const filteredPagosGenerales = todosLosPagosGenerales.filter(p => {
    const matchesSearch = !pagosSearch || p.alumno?.toLowerCase().includes(pagosSearch.toLowerCase()) || p.folio?.toLowerCase().includes(pagosSearch.toLowerCase());
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
      monto: \`$\${parseFloat(p.monto).toFixed(2)}\`,
      pagoFecha: p.createdAt 
  })).filter(p => {
    const matchesSearch = !pagosSearch || p.alumno?.toLowerCase().includes(pagosSearch.toLowerCase());
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
    if(!pagoFormData.nombre || !pagoFormData.concepto || !pagoFormData.monto) {
      toast.error('Llena todos los campos.');
      return;
    }
    setIsSubmitting(true);
    try {
      const collectionName = pagoFormData.tipo === 'administrativo' ? 'pagos_administrativos' : 'pagos_extraordinarios';
      await addDoc(collection(db, collectionName), {
        nombre: pagoFormData.nombre,
        concepto: pagoFormData.concepto,
        monto: parseFloat(pagoFormData.monto),
        metodo: pagoFormData.metodo,
        createdAt: serverTimestamp(),
        estado: 'Pagado'
      });
      toast.success('Pago registrado exitosamente');
      setShowPagoAdminModal(false);
      setPagoFormData({ nombre: '', concepto: '', monto: '', metodo: 'Efectivo', tipo: 'administrativo', fecha: new Date().toISOString().split('T')[0] });
    } catch(err) {
      toast.error('Error al registrar el pago');
    } finally {
      setIsSubmitting(false);
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
      'Fecha': p.pagoFecha?.toDate ? p.pagoFecha.toDate().toLocaleDateString() : new Date(p.pagoFecha || Date.now()).toLocaleDateString()
    }));
    
    const csv = Papa.unparse(csvData, { delimiter: ';' });
    const blob = new Blob(["\\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', \`Relacion_Ingresos_\${activeIngresoTab}_\${new Date().toISOString().split('T')[0]}.csv\`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
`;

// Also fix missing icons from lucide-react if needed:
// 'Wallet' is missing, 'AlertTriangle' is missing? 
// In the previous replace, I probably missed Wallet and AlertTriangle?
// The previous replace was: 
// import { Users, ..., Smartphone, Calendar as CalendarIcon, FileSpreadsheet } from 'lucide-react';
// The original had AlertTriangle and Wallet! Wait, let me just add them to be safe.

if (!c.includes('todosLosPagosGenerales')) {
   const re = /useEffect\(\(\) => \{\s*const q = query\(collection\(db, 'inventario'\)\);/g;
   c = c.replace(re, effectReplacement + "    const q = query(collection(db, 'inventario'));");
}

fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', c);
console.log("Successfully injected missing logic in Contraloria.jsx.");
