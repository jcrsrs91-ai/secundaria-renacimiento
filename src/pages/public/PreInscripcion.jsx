import { useState, useEffect } from 'react';
import { useGlobalConfig } from '../../hooks/useGlobalConfig';
import { UserPlus, ClipboardList, Search, Upload, Printer, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { db, storage } from '../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import HojaInscripcionPrint from '../../components/HojaInscripcionPrint';

// Unifica documentos cuando un padre llenó por error "Nuevo Ingreso" existiendo ya el alumno "Activo"
const resolverExpedienteUnificado = (docsSnap) => {
  if (!docsSnap || docsSnap.length === 0) return null;
  const items = docsSnap.map(d => ({ id: d.id, ...d.data() }));

  // Priorizar el expediente Activo (o con matrícula/calificaciones) sobre el Pendiente
  items.sort((a, b) => {
    const aActivo = (a.status || 'Activo') !== 'Pendiente' ? 1 : 0;
    const bActivo = (b.status || 'Activo') !== 'Pendiente' ? 1 : 0;
    if (aActivo !== bActivo) return bActivo - aActivo;
    const aMat = a.matricula ? 1 : 0;
    const bMat = b.matricula ? 1 : 0;
    return bMat - aMat;
  });

  const primary = { ...items[0] };
  const duplicatePendingIds = [];

  for (let i = 1; i < items.length; i++) {
    const sec = items[i];
    if (sec.status === 'Pendiente') {
      duplicatePendingIds.push(sec.id);
    }
    // Copiar campos que estén vacíos en primary pero llenos en el registro secundario (Pendiente)
    Object.keys(sec).forEach(key => {
      if (['id', 'status', 'grado', 'grupo', 'turno', 'taller', 'matricula', 'fotoUrl', 'calificaciones', 'asistencias', 'historial', 'extraordinarios', 'tipoIngreso', 'fechaAlta'].includes(key)) {
        return;
      }
      const valPrimary = primary[key];
      const valSec = sec[key];
      if (key === 'documentos' && valSec && typeof valSec === 'object') {
        primary.documentos = { ...(valSec || {}), ...(primary.documentos || {}) };
      } else if ((valPrimary === undefined || valPrimary === null || valPrimary === '') && valSec !== undefined && valSec !== null && valSec !== '') {
        primary[key] = valSec;
      }
    });
  }

  // Si el primario no tenía grado/grupo pero el secundario sí
  if (!primary.grado && items[1]?.grado) primary.grado = items[1].grado;
  if (!primary.grupo && items[1]?.grupo) primary.grupo = items[1].grupo;
  if (!primary.turno && items[1]?.turno) primary.turno = items[1].turno;
  if (!primary.taller && items[1]?.taller) primary.taller = items[1].taller;

  primary._duplicatePendingIds = duplicatePendingIds;
  return primary;
};

export default function PreInscripcion() {
  const { config } = useGlobalConfig();
  const [activeTab, setActiveTab] = useState('nuevo'); // 'nuevo', 'reinscripcion', 'reimprimir', 'completar'
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [finalData, setFinalData] = useState(null);

  useEffect(() => {
    if (config && config.inscripcionesAbiertas === false && activeTab === 'completar') {
      setActiveTab('nuevo');
    }
    if (config && config.reinscripcionesAbiertas !== true && activeTab === 'reinscripcion') {
      setActiveTab('nuevo');
    }
  }, [config, activeTab]);

  // Estados de búsqueda
  const [lookupCurp, setLookupCurp] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [studentData, setStudentData] = useState(null);

  const [photoFile, setPhotoFile] = useState(null);
  const [actaFile, setActaFile] = useState(null);
  const [curpFile, setCurpFile] = useState(null);
  const [certificadoFile, setCertificadoFile] = useState(null);
  const [asignacionFile, setAsignacionFile] = useState(null);
  const [ineFile, setIneFile] = useState(null);
  const [domicilioFile, setDomicilioFile] = useState(null);
  const [ineContacto1File, setIneContacto1File] = useState(null);
  const [ineContacto2File, setIneContacto2File] = useState(null);

  const handleLookup = async (e) => {
    e.preventDefault();
    setLookupError('');
    setIsSubmitting(true);
    setLoadingMessage('Buscando expediente...');
    try {
      const q = query(
        collection(db, "students"),
        where("curp", "==", lookupCurp.trim().toUpperCase())
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setLookupError('No se encontró ningún expediente con esos datos.');
        setIsSubmitting(false);
        return;
      }
      
      const unified = resolverExpedienteUnificado(querySnapshot.docs);

      if (unified.grado === '3er Grado' || unified.grado === '3ero') {
        setLookupError('¡Felicidades por graduarte! Los alumnos de 3er Grado ya no pueden reinscribirse.');
        setIsSubmitting(false);
        return;
      }

      let nextGrado = "2do Grado";
      if (unified.grado === '2do Grado' || unified.grado === '2do') nextGrado = "3er Grado";

      setStudentData({ ...unified, grado: nextGrado });
    } catch (error) {
      setLookupError('Error de conexión: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReimprimir = async (e) => {
    e.preventDefault();
    setLookupError('');
    setIsSubmitting(true);
    setLoadingMessage('Buscando expediente...');
    try {
      const q = query(
        collection(db, "students"),
        where("curp", "==", lookupCurp.trim().toUpperCase())
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setLookupError('No se encontró ninguna ficha generada con esa CURP.');
        setIsSubmitting(false);
        return;
      }
      
      const unified = resolverExpedienteUnificado(querySnapshot.docs);
      setFinalData(unified);
      setIsSubmitted(true);
    } catch (error) {
      setLookupError('Error de conexión: ' + error.message);
      setIsSubmitting(false);
    }
  };

  const handleLookupCompletar = async (e) => {
    e.preventDefault();
    setLookupError('');
    setIsSubmitting(true);
    setLoadingMessage('Buscando expediente...');
    try {
      const q = query(
        collection(db, "students"),
        where("curp", "==", lookupCurp.trim().toUpperCase())
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setLookupError('No se encontró ningún expediente con esa CURP.');
        setIsSubmitting(false);
        return;
      }
      
      const unified = resolverExpedienteUnificado(querySnapshot.docs);
      setStudentData(unified);
    } catch (error) {
      setLookupError('Error de conexión: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDocFileChange = (e, setter) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.type.startsWith('image/')) {
      const confirmMsg = "Has seleccionado una imagen. Verifica que sea TOTALMENTE LEGIBLE (sin brillos, sin borrosidad y con buena luz). Si el personal de la escuela no puede leer los datos, tu trámite SERÁ CANCELADO automáticamente.\n\n¿Confirmas que la foto es clara y legible?";
      if (!window.confirm(confirmMsg)) {
        e.target.value = '';
        setter(null);
        return;
      }
    }
    setter(file);
  };

  const handleFileChange = (e) => {
    if (activeTab === 'completar' || Boolean(studentData?.id)) {
      e.target.value = '';
      setPhotoFile(null);
      return;
    }
    if (e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
    }
  };

  const handleCurpInput = async (e) => {
    let val = e.target.value.toUpperCase().trim();
    e.target.value = val;
    
    if (val.length === 18) {
      const curpRegex = /^([A-Z][AEIOUX][A-Z]{2}\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])[HM](?:AS|B[CS]|C[CLMSH]|D[FG]|G[TR]|HG|JC|M[CNS]|N[ETL]|OC|PL|Q[TR]|S[PLR]|T[CSL]|VZ|YN|ZS)[B-DF-HJ-NP-TV-Z]{3}[A-Z\d])(\d)$/;
      if (!curpRegex.test(val)) {
        e.target.setCustomValidity("El formato de la CURP es incorrecto. Verifique los caracteres.");
        e.target.reportValidity();
      } else {
        e.target.setCustomValidity("");
        const yearStr = val.substring(4, 6);
        const monthStr = val.substring(6, 8);
        const dayStr = val.substring(8, 10);
        
        let gender = '';
        if (val.length >= 11) {
          const g = val.charAt(10);
          if (g === 'H') gender = 'Hombre';
          if (g === 'M') gender = 'Mujer';
        }
        
        const genderSelect = document.querySelector('select[name="genero"]');
        if (genderSelect && gender) {
          genderSelect.value = gender;
        }

        const char17 = val.charAt(16);
        let yearPrefix = "19";
        if (/[A-Z]/.test(char17)) {
          yearPrefix = "20";
        }
        
        const fullYear = yearPrefix + yearStr;
        const fnac = `${fullYear}-${monthStr}-${dayStr}`;
        
        const dateInput = document.querySelector('input[name="fechaNacimiento"]');
        if (dateInput) {
          dateInput.value = fnac;
        }

        // Si el padre está en "Nuevo Ingreso", verificar automáticamente si la CURP ya existe en el padrón
        if (activeTab === 'nuevo' && (!studentData || studentData.curp !== val)) {
          try {
            const q = query(collection(db, "students"), where("curp", "==", val));
            const snap = await getDocs(q);
            if (!snap.empty) {
              const unified = resolverExpedienteUnificado(snap.docs);
              setPhotoFile(null);
              setStudentData(unified);
              if (config?.inscripcionesAbiertas !== false) {
                setActiveTab('completar');
              }
              toast.success(
                `¡Encontramos el expediente de ${unified.nombres || ''} ${unified.apellidoPaterno || ''}! Se cargaron sus datos para actualizar su expediente activo sin duplicarlo.`,
                { duration: 6000 }
              );
            }
          } catch (err) {
            console.error("Error verificando CURP existente:", err);
          }
        }
      }
    } else if (val.length > 0) {
      e.target.setCustomValidity("La CURP debe tener exactamente 18 caracteres.");
    } else {
      e.target.setCustomValidity("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoadingMessage(activeTab === 'completar' ? 'Guardando actualización de datos...' : 'Verificando expediente y guardando datos...');
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
      const currentCurp = (data.curp ? data.curp : (studentData?.curp || '')).trim().toUpperCase();

      // SIEMPRE verificar en Firestore si ya existe un alumno con esa CURP (evita duplicados cuando el padre entró en "Nuevo Ingreso")
      let targetExisting = studentData;
      let duplicateIdsToClean = studentData?._duplicatePendingIds || [];

      if (currentCurp) {
        const qExist = query(collection(db, "students"), where("curp", "==", currentCurp));
        const existSnap = await getDocs(qExist);
        if (!existSnap.empty) {
          const unified = resolverExpedienteUnificado(existSnap.docs);
          targetExisting = unified;
          duplicateIdsToClean = unified._duplicatePendingIds || [];
        }
      }

      let fotoUrl = targetExisting?.fotoUrl || null;
      const esActualizacionDeExistente = activeTab === 'completar' || Boolean(targetExisting?.id);

      // En Actualización de Datos (o si el alumno ya existe en la escuela), bloquear subida de foto para conservar la foto oficial de Control Escolar
      if (photoFile && !esActualizacionDeExistente) {
        const photoRef = ref(storage, `student_photos/${currentCurp}_${Date.now()}`);
        await uploadBytes(photoRef, photoFile);
        fotoUrl = await getDownloadURL(photoRef);
      }

      let documentos = { ...(targetExisting?.documentos || {}) };
      
      const uploadDoc = async (fileObj, docName) => {
        if (fileObj) {
          const ext = fileObj.name.split('.').pop();
          const docRef = ref(storage, `student_docs/${currentCurp}/${docName}_${Date.now()}.${ext}`);
          await uploadBytes(docRef, fileObj);
          const url = await getDownloadURL(docRef);
          documentos[docName] = true;
          return url;
        }
        return targetExisting?.[docName + 'Url'] || null;
      };

      const actaUrl = await uploadDoc(actaFile, 'acta');
      const curpUrl = await uploadDoc(curpFile, 'curp');
      const certificadoUrl = await uploadDoc(certificadoFile, 'certificado');
      const asignacionUrl = await uploadDoc(asignacionFile, 'asignacion');
      const ineUrl = await uploadDoc(ineFile, 'ine');
      const domicilioUrl = await uploadDoc(domicilioFile, 'domicilio');
      const ineContacto1Url = await uploadDoc(ineContacto1File, 'ineContacto1');
      const ineContacto2Url = await uploadDoc(ineContacto2File, 'ineContacto2');

      // Si el alumno ya existe en la escuela como Activo (o estamos en completar), preservar su grado, grupo, turno, taller, matrícula y estatus
      const isAlreadyRegistered = Boolean(targetExisting?.id);
      const isAlreadyActive = isAlreadyRegistered && (targetExisting.status || 'Activo') !== 'Pendiente';

      if ((activeTab === 'completar' || isAlreadyActive) && targetExisting) {
        if (targetExisting.grado) data.grado = targetExisting.grado;
        if (targetExisting.grupo) data.grupo = targetExisting.grupo;
        if (targetExisting.turno) data.turno = targetExisting.turno;
        if (targetExisting.taller) data.taller = targetExisting.taller;
      }

      const cleanTarget = { ...(targetExisting || {}) };
      delete cleanTarget._duplicatePendingIds;
      delete cleanTarget.id;

      const submissionData = {
        ...cleanTarget,
        ...data,
        fotoUrl,
        actaUrl,
        curpUrl,
        certificadoUrl,
        asignacionUrl,
        ineUrl,
        domicilioUrl,
        ineContacto1Url,
        ineContacto2Url,
        documentos,
        curp: currentCurp,
        tipoTramite: activeTab === 'reinscripcion'
          ? "Reinscripción"
          : isAlreadyActive
          ? (targetExisting?.tipoTramite || "Actualización de Expediente")
          : (targetExisting?.tipoTramite || "Nuevo Ingreso"),
        updatedAt: serverTimestamp()
      };

      if (isAlreadyRegistered && targetExisting?.id) {
        // Preservar estatus Activo si ya era un alumno activo del plantel
        if (isAlreadyActive) {
          submissionData.status = targetExisting.status || "Activo";
        }
        const docRef = doc(db, "students", targetExisting.id);
        await updateDoc(docRef, submissionData);

        // Si había solicitudes "Pendiente" duplicadas de esta misma CURP, eliminarlas tras haber fusionado sus datos en el Activo
        for (const dupId of duplicateIdsToClean) {
          if (dupId && dupId !== targetExisting.id) {
            await deleteDoc(doc(db, "students", dupId)).catch(() => {});
          }
        }
      } else {
        submissionData.status = "Pendiente";
        submissionData.createdAt = serverTimestamp();
        await addDoc(collection(db, "students"), submissionData);
      }
      
      setFinalData(submissionData);
      setIsSubmitted(true);
    } catch (error) {
      console.error("Error: ", error);
      alert("Hubo un error al enviar tu solicitud: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted && finalData) {
    return (
      <div className="min-h-screen bg-slate-50 print:bg-white print:min-h-0">
        <div className="max-w-4xl mx-auto py-8 print:py-0">
          <HojaInscripcionPrint data={finalData} />
          <div className="text-center mt-8 print:hidden no-print">
            <a href="/" className="inline-block py-2.5 px-6 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition">
              Finalizar y Volver al Inicio
            </a>
          </div>
        </div>
      </div>
    );
  }

  const changeTab = (tab) => {
    setActiveTab(tab);
    setStudentData(null);
    setPhotoFile(null);
    setLookupError('');
    setLookupCurp('');
  };

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Portal de Trámites Escolares</h2>
          <p className="mt-2 text-lg text-slate-600">Esc. Sec. Téc. N°68 "RENACIMIENTO"</p>
        </div>

        <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-200">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 flex-wrap sm:flex-nowrap">
            <button 
              type="button"
              className={`flex-1 py-4 px-2 sm:px-6 text-center font-medium text-sm transition-colors ${activeTab === 'nuevo' ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
              onClick={() => changeTab('nuevo')}
            >
              <UserPlus className="inline-block w-5 h-5 sm:mr-2 -mt-1" /> <span className="hidden sm:inline">Nuevo Ingreso</span>
            </button>
            {config?.reinscripcionesAbiertas === true ? (
              <button 
                type="button"
                className={`flex-1 py-4 px-2 sm:px-6 text-center font-medium text-sm transition-colors ${activeTab === 'reinscripcion' ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                onClick={() => changeTab('reinscripcion')}
              >
                <ClipboardList className="inline-block w-5 h-5 sm:mr-2 -mt-1" /> <span className="hidden sm:inline">Reinscripción</span>
              </button>
            ) : (
              <button 
                type="button"
                title="El periodo de reinscripciones ha concluido"
                className="flex-1 py-4 px-2 sm:px-6 text-center font-medium text-sm text-slate-400 bg-slate-100/80 cursor-not-allowed select-none"
                onClick={() => toast.error('El periodo de reinscripciones ha concluido (cerró el 30 de septiembre).')}
              >
                <Lock className="inline-block w-4 h-4 sm:mr-1.5 -mt-0.5 text-slate-400" /> <span className="hidden sm:inline">Reinscripción (Cerrado)</span>
              </button>
            )}
            <button 
              type="button"
              className={`flex-1 py-4 px-2 sm:px-4 text-center font-medium text-xs sm:text-sm transition-colors ${activeTab === 'reimprimir' ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
              onClick={() => changeTab('reimprimir')}
            >
              <Printer className="inline-block w-4 h-4 sm:w-5 sm:h-5 sm:mr-1 -mt-1" /> <span className="hidden sm:inline">Reimprimir</span>
            </button>
            {config?.inscripcionesAbiertas !== false && (
              <button 
                type="button"
                className={`flex-1 py-4 px-2 sm:px-4 text-center font-medium text-xs sm:text-sm transition-colors ${activeTab === 'completar' ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                onClick={() => changeTab('completar')}
              >
                <Upload className="inline-block w-4 h-4 sm:w-5 sm:h-5 sm:mr-1 -mt-1" /> <span className="hidden sm:inline">Actualizar</span>
              </button>
            )}
          </div>

          <div className="p-4 sm:p-8">
            
            {/* Buscador para Actualizar Datos */}
            {activeTab === 'completar' && !studentData && (
              <div className="max-w-md mx-auto py-8">
                <div className="text-center mb-6">
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                  <h3 className="text-lg font-bold">Actualizar Datos del Alumno</h3>
                  <p className="text-sm text-slate-500 mt-1">Ingresa la CURP del alumno para actualizar su información personal, escolar o de contacto.</p>
                </div>
                {lookupError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">{lookupError}</div>}
                <form onSubmit={handleLookupCompletar} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium">CURP del Alumno</label>
                    <input type="text" className="mt-1 w-full p-2 border rounded uppercase" required value={lookupCurp} onChange={e => setLookupCurp(e.target.value)} placeholder="Ingresa los 18 caracteres" />
                  </div>
                  <button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-3 px-4 bg-primary-600 text-white rounded font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors">
                    <Search className="w-5 h-5 mr-2" /> {isSubmitting ? 'Buscando...' : 'Buscar Expediente'}
                  </button>
                </form>
              </div>
            )}
            
            {/* Reimprimir Buscador */}
            {activeTab === 'reimprimir' && (
              <div className="max-w-md mx-auto py-8">
                <div className="text-center mb-6">
                  <Printer className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                  <h3 className="text-lg font-bold">Recupera tu Ficha de Inscripción</h3>
                  <p className="text-sm text-slate-500 mt-1">Si ya habías hecho tu trámite y no guardaste la hoja, ingresa la CURP del alumno para descargarla de nuevo.</p>
                </div>
                {lookupError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">{lookupError}</div>}
                <form onSubmit={handleReimprimir} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium">CURP del Alumno</label>
                    <input type="text" className="mt-1 w-full p-2 border rounded uppercase" required value={lookupCurp} onChange={e => setLookupCurp(e.target.value)} placeholder="Ingresa los 18 caracteres" />
                  </div>
                  <button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-3 px-4 bg-primary-600 text-white rounded font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors">
                    <Search className="w-5 h-5 mr-2" /> {isSubmitting ? 'Buscando...' : 'Buscar y Descargar'}
                  </button>
                </form>
              </div>
            )}

            {/* Buscador para Reinscripción */}
            {activeTab === 'reinscripcion' && !studentData && (
              <div className="max-w-md mx-auto py-8">
                <h3 className="text-lg font-bold text-center mb-4">Busca tu Expediente</h3>
                {lookupError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">{lookupError}</div>}
                <form onSubmit={handleLookup} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium">CURP</label>
                    <input type="text" className="mt-1 w-full p-2 border rounded uppercase" required value={lookupCurp} onChange={e => setLookupCurp(e.target.value)} />
                  </div>
                  <button type="submit" className="w-full flex justify-center py-2 px-4 bg-slate-800 text-white rounded font-medium hover:bg-slate-900 transition-colors">
                    <Search className="w-5 h-5 mr-2" /> Buscar Datos
                  </button>
                </form>
              </div>
            )}

            {/* Formulario Principal */}
            {(activeTab === 'nuevo' || ((activeTab === 'reinscripcion' || activeTab === 'completar') && studentData)) && (
              <form key={studentData?.id || activeTab} onSubmit={handleSubmit} className="space-y-8">
                
                {activeTab === 'reinscripcion' && (
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg flex items-start">
                    <div className="flex-1">
                      <h4 className="font-bold text-emerald-800">¡Hola, {studentData.nombres}!</h4>
                      <p className="text-sm text-emerald-700 mt-1">Tus datos han sido cargados. Estás siendo reinscrito(a) a <b>{studentData.grado}</b>. Por favor, revisa tus datos y actualiza los que hayan cambiado (ej. teléfonos, domicilio o temas médicos).</p>
                    </div>
                  </div>
                )}

                {activeTab === 'completar' && (
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-start mb-6">
                    <div className="flex-1">
                      <h4 className="font-bold text-blue-800">Actualizar Expediente de {studentData.nombres} {studentData.apellidoPaterno}</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Expediente oficial ubicado en <strong>{studentData.grado} Grupo "{studentData.grupo}" ({studentData.turno || 'Matutino'})</strong>. Revisa y actualiza la información personal, escolar o de contacto y guarda los cambios.
                      </p>
                    </div>
                  </div>
                )}

                {/* Aviso de Requisitos para Nuevo Ingreso */}
                {activeTab === 'nuevo' && (
                  <div className="bg-sky-50 border-l-4 border-sky-600 p-5 rounded-r-lg mb-8 shadow-sm">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <ClipboardList className="h-6 w-6 text-sky-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-bold text-sky-800">
                          Requisitos para Nuevo Ingreso
                        </h3>
                        <div className="mt-2 text-sm text-sky-700 space-y-1">
                          <p className="font-medium mb-2">Para completar tu registro exitosamente, ten a la mano los siguientes documentos escaneados en formato <b>PDF</b>:</p>
                          <ul className="list-disc pl-5 space-y-1">
                            <li><b>Acta de Nacimiento</b> (Formatos vigentes: tradicional sepia/café o formato verde).</li>
                            <li><b>CURP</b> (Formato reciente y legible).</li>
                            <li><b>Certificado de Primaria</b> o Constancia de 6to grado (Opcional por el momento).</li>
                            <li><b>Comprobante de Asignación</b> del portal de la SEP (Si aplica).</li>
                            <li><b>INE vigente del Padre, Madre o Tutor</b>.</li>
                            <li><b>Comprobante de domicilio</b> reciente (Luz, agua o teléfono, no mayor a 3 meses).</li>
                          </ul>
                          <p className="mt-3 text-xs bg-white/60 p-2 rounded text-sky-900 border border-sky-200">
                            <b>Nota:</b> Si el alumno ya está inscrito en la escuela y solo deseas actualizar sus datos, al escribir su <b>CURP</b> el sistema detectará su expediente automáticamente para no duplicarlo.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Fotografía: Bloqueada en Actualización de Datos / Expedientes Existentes */}
                {activeTab === 'completar' || Boolean(studentData?.id) ? (
                  <div className="flex flex-col sm:flex-row items-center gap-4 p-5 bg-slate-100 border border-slate-300 rounded-xl">
                    <div className="w-24 h-32 bg-white border border-slate-300 rounded shadow-xs flex items-center justify-center overflow-hidden shrink-0">
                      {studentData?.fotoUrl ? (
                        <img src={studentData.fotoUrl} alt="Fotografía Oficial" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[11px] text-slate-400 text-center px-2 font-medium">Fotografía en Control Escolar</span>
                      )}
                    </div>
                    <div className="text-center sm:text-left">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 text-xs font-bold mb-1.5">
                        <Lock className="w-3.5 h-3.5 text-slate-600" />
                        Fotografía Oficial Bloqueada
                      </div>
                      <p className="text-sm text-slate-600 font-medium">
                        La fotografía del alumno ya es administrada directamente por <strong>Control Escolar</strong> de la escuela y no requiere ni permite ser modificada en la actualización de datos.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center p-6 bg-slate-50 border border-dashed border-slate-300 rounded-xl">
                    <div className="w-24 h-32 bg-slate-200 border border-slate-400 mb-4 flex items-center justify-center overflow-hidden">
                      {photoFile ? (
                        <img src={URL.createObjectURL(photoFile)} alt="Preview" className="w-full h-full object-cover" />
                      ) : studentData?.fotoUrl ? (
                        <img src={studentData.fotoUrl} alt="Actual" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs text-slate-400 text-center px-2">Foto Tamaño Infantil</span>
                      )}
                    </div>
                    <label className="cursor-pointer bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">
                      <span>Seleccionar Fotografía (Opcional)</span>
                      <input type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
                    </label>
                    {photoFile && <p className="mt-2 text-sm text-emerald-600 font-medium">Foto seleccionada: {photoFile.name}</p>}
                  </div>
                )}
                {/* Secciones 1 a 4 */}
                  <>
                    {/* 1. Datos Académicos */}
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4">1. Datos Académicos</h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {activeTab === 'nuevo' ? (
                          <div>
                            <label className="block text-sm font-medium">Grado al que Ingresa</label>
                            <select name="grado" className="mt-1 block w-full rounded-md shadow-sm p-2 border" required defaultValue={studentData?.grado || ''}>
                              <option value="">Seleccionar</option><option>1er Grado</option><option>2do Grado</option><option>3er Grado</option>
                            </select>
                          </div>
                        ) : (
                          <div>
                            <label className="block text-sm font-medium">Grado al que Ingresa</label>
                            <input type="text" name="grado" className="mt-1 block w-full rounded-md shadow-sm p-2 border bg-gray-100 text-slate-600 cursor-not-allowed" readOnly value={studentData?.grado || ''} />
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-medium">Grupo</label>
                          {activeTab === 'completar' ? (
                            <input type="text" name="grupo" className="mt-1 block w-full rounded-md shadow-sm p-2 border bg-gray-100 text-slate-600 cursor-not-allowed notranslate" readOnly value={studentData?.grupo || ''} />
                          ) : (
                            <select name="grupo" className="mt-1 block w-full rounded-md shadow-sm p-2 border notranslate" required defaultValue={studentData?.grupo}
                              onChange={(e) => {
                                const val = e.target.value;
                                const talleresMap = {
                                  'A': 'Climatización y Refrigeración (3181)',
                                  'B': 'Administración Contable (6011)',
                                  'C': 'Diseño de Circuitos Eléctricos (4021)',
                                  'D': 'Administración Contable (6011)',
                                  'E': 'Diseño y Mecánica Automotriz (3081)',
                                  'F': 'Ofimática (6031)',
                                  'G': 'Climatización y Refrigeración (3181)',
                                  'H': 'Administración Contable (6011)',
                                  'I': 'Diseño de Circuitos Eléctricos (4021)',
                                  'J': 'Administración Contable (6011)',
                                  'K': 'Diseño y Mecánica Automotriz (3081)',
                                  'L': 'Ofimática (6031)'
                                };
                                const input = document.getElementById('tallerInput');
                                if (input) {
                                  input.value = talleresMap[val] || '';
                                }
                                const turnoSel = document.getElementById('turnoSelect');
                                if (turnoSel && val) {
                                  turnoSel.value = ['G', 'H', 'I', 'J', 'K', 'L'].includes(val) ? 'Vespertino' : 'Matutino';
                                }
                              }}
                            >
                              <option value="">Seleccionar</option>
                              <option value="A" translate="no">A (Matutino - Climatización)</option>
                              <option value="B" translate="no">B (Matutino - Contable)</option>
                              <option value="C" translate="no">C (Matutino - Electricidad)</option>
                              <option value="D" translate="no">D (Matutino - Contable)</option>
                              <option value="E" translate="no">E (Matutino - Mecánica)</option>
                              <option value="F" translate="no">F (Matutino - Ofimática)</option>
                              <option value="G" translate="no">G (Vespertino - Climatización)</option>
                              <option value="H" translate="no">H (Vespertino - Contable)</option>
                              <option value="I" translate="no">I (Vespertino - Electricidad)</option>
                              <option value="J" translate="no">J (Vespertino - Contable)</option>
                              <option value="K" translate="no">K (Vespertino - Mecánica)</option>
                              <option value="L" translate="no">L (Vespertino - Ofimática)</option>
                            </select>
                          )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium">¿Es alumno repetidor de este grado?</label>
                            <select name="repetidor" className="mt-1 block w-full rounded-md shadow-sm p-2 border" defaultValue={studentData?.repetidor || 'NO'}>
                              <option value="NO">NO</option>
                              <option value="SÍ">SÍ</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium">Turno</label>
                          {activeTab === 'completar' ? (
                            <input type="text" name="turno" className="mt-1 block w-full rounded-md shadow-sm p-2 border bg-gray-100 text-slate-600 cursor-not-allowed" readOnly value={studentData?.turno || ''} />
                          ) : (
                            <select id="turnoSelect" name="turno" className="mt-1 block w-full rounded-md shadow-sm p-2 border" required defaultValue={studentData?.turno}>
                              <option value="">Seleccionar</option>
                              <option>Matutino</option><option>Vespertino</option>
                            </select>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium">Taller / Tecnología</label>
                          <input id="tallerInput" type="text" name="taller" className="mt-1 block w-full rounded-md shadow-sm p-2 border bg-gray-100" required defaultValue={studentData?.taller} placeholder="Se asigna por grupo..." readOnly />
                        </div>
                        {(activeTab === 'nuevo' || activeTab === 'completar') && (
                          <>
                            <div className="md:col-span-4">
                              <label className="block text-sm font-medium">Escuela de Procedencia</label>
                              <input type="text" name="escuelaProcedencia" className="mt-1 block w-full rounded-md shadow-sm p-2 border" required={activeTab === 'nuevo'} defaultValue={studentData?.escuelaProcedencia} />
                            </div>
                            <div className="md:col-span-3">
                              <label className="block text-sm font-medium">Domicilio de la Escuela</label>
                              <input type="text" name="domicilioEscuela" className="mt-1 block w-full rounded-md shadow-sm p-2 border" defaultValue={studentData?.domicilioEscuela} />
                            </div>
                            <div className="md:col-span-1">
                              <label className="block text-sm font-medium">Promedio Obtenido</label>
                              <input type="text" name="promedioEscuela" className="mt-1 block w-full rounded-md shadow-sm p-2 border" defaultValue={studentData?.promedioEscuela} />
                            </div>
                          </>
                        )}
                        <div>
                          <label className="block text-sm font-medium">¿Cuenta con alguna beca?</label>
                          <select name="tieneBeca" className="mt-1 block w-full rounded-md shadow-sm p-2 border" required defaultValue={studentData?.tieneBeca || 'NO'} onChange={(e) => {
                            const input = document.getElementById('nombreBecaContainer');
                            if(input) input.style.display = e.target.value !== 'NO' ? 'block' : 'none';
                          }}>
                            <option>NO</option><option>SÍ</option>
                          </select>
                        </div>
                          <div>
                            <label className="block text-sm font-medium">Discapacidad o Condición</label>
                            <select name="discapacidad" className="mt-1 block w-full rounded-md shadow-sm p-2 border" defaultValue={studentData?.discapacidad || 'Ninguna'}>
                              <option>Ninguna</option>
                              <option>Ceguera</option>
                              <option>Baja visión</option>
                              <option>Sordera</option>
                              <option>Hipoacusia</option>
                              <option>Sordoceguera</option>
                              <option>Discapacidad motriz</option>
                              <option>Discapacidad intelectual</option>
                              <option>Discapacidad psicosocial</option>
                              <option>Discapacidad múltiple</option>
                              <option>Trastorno del Espectro Autista (TEA)</option>
                              <option>Trastorno por Déficit de Atención (TDAH)</option>
                              <option>Aptitudes Sobresalientes</option>
                            </select>
                          </div>
                        <div id="nombreBecaContainer" style={{display: studentData?.tieneBeca && studentData?.tieneBeca !== 'NO' ? 'block' : 'none'}}>
                          <label className="block text-sm font-medium">Nombre de la Beca</label>
                          <input type="text" name="nombreBeca" className="mt-1 block w-full rounded-md shadow-sm p-2 border" defaultValue={studentData?.nombreBeca} />
                        </div>
                      </div>
                    </div>

                    {/* 2. Datos Personales */}
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4">2. Datos del Alumno</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-medium">Apellido Paterno</label>
                          <input type="text" name="apellidoPaterno" required className="mt-1 block w-full rounded-md p-2 border" defaultValue={studentData?.apellidoPaterno} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium">Apellido Materno</label>
                          <input type="text" name="apellidoMaterno" required className="mt-1 block w-full rounded-md p-2 border" defaultValue={studentData?.apellidoMaterno} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium">Nombre(s)</label>
                          <input type="text" name="nombres" required className="mt-1 block w-full rounded-md p-2 border" defaultValue={studentData?.nombres} />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium">CURP</label>
                          <input type="text" name="curp" required maxLength="18" minLength="18" onChange={handleCurpInput} className="mt-1 block w-full rounded-md p-2 border uppercase" defaultValue={studentData?.curp} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium">Género</label>
                          <select name="genero" className="mt-1 block w-full rounded-md p-2 border" defaultValue={studentData?.genero}>
                            <option>Seleccionar</option><option>Hombre</option><option>Mujer</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium">Fecha de Nacimiento</label>
                          <input type="date" name="fechaNacimiento" required className="mt-1 block w-full rounded-md p-2 border" defaultValue={studentData?.fechaNacimiento} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium">Nacionalidad (País de Nacimiento)</label>
                          <select name="nacionalidad" className="mt-1 block w-full rounded-md p-2 border" defaultValue={studentData?.nacionalidad || 'MEXICANA'}>
                            <option value="MEXICANA">Mexicana</option>
                            <option value="EXTRANJERA">Extranjera</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium">¿Habla alguna Lengua Indígena?</label>
                          <select name="lenguaIndigena" className="mt-1 block w-full rounded-md p-2 border" defaultValue={studentData?.lenguaIndigena || 'NO'} onChange={(e) => {
                             const input = document.getElementById('nombreLenguaContainer');
                             if (e.target.value === 'SÍ') {
                               input.style.display = 'block';
                             } else {
                               input.style.display = 'none';
                             }
                          }}>
                            <option>NO</option>
                            <option>SÍ</option>
                          </select>
                        </div>
                        <div id="nombreLenguaContainer" style={{display: studentData?.lenguaIndigena === 'SÍ' ? 'block' : 'none'}}>
                          <label className="block text-sm font-medium">¿Cuál lengua indígena?</label>
                          <input type="text" name="nombreLenguaIndigena" className="mt-1 block w-full rounded-md p-2 border" defaultValue={studentData?.nombreLenguaIndigena} placeholder="Ej. Náhuatl, Maya..." />
                        </div>
                        <div>
                          <label className="block text-sm font-medium">¿Además de la lengua indígena, habla español?</label>
                          <select name="hablaEspanol" className="mt-1 block w-full rounded-md p-2 border" defaultValue={studentData?.hablaEspanol || 'SÍ'}>
                            <option>SÍ</option>
                            <option>NO</option>
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-700">Calle</label>
                          <input type="text" name="calle" required className="mt-1 block w-full rounded-md shadow-sm p-2 border" defaultValue={studentData?.calle || studentData?.calleNumero} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Número</label>
                          <input type="text" name="numero" required className="mt-1 block w-full rounded-md shadow-sm p-2 border" defaultValue={studentData?.numero} />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-700">Colonia</label>
                          <input type="text" name="colonia" required className="mt-1 block w-full rounded-md shadow-sm p-2 border" defaultValue={studentData?.colonia} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Código Postal</label>
                          <input type="text" name="cp" required className="mt-1 block w-full rounded-md shadow-sm p-2 border" defaultValue={studentData?.cp || studentData?.codigoPostal} />
                        </div>
                      </div>
                    </div>

                    {/* 3. Cédula de Salud */}
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4">3. Cédula de Referencia de Salud</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium">Tipo de Sangre</label>
                          <select name="tipoSangre" required className="mt-1 block w-full rounded-md shadow-sm p-2 border" defaultValue={studentData?.tipoSangre}>
                            <option value="">Seleccionar</option>
                            <option>O+</option>
                            <option>O-</option>
                            <option>A+</option>
                            <option>A-</option>
                            <option>B+</option>
                            <option>B-</option>
                            <option>AB+</option>
                            <option>AB-</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium">¿Usa lentes?</label>
                          <select name="lentes" className="mt-1 block w-full rounded-md shadow-sm p-2 border" defaultValue={studentData?.lentes || "NO"}>
                            <option>NO</option><option>SÍ</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium">Alergias (Especifique, o escriba "Ninguna")</label>
                          <input type="text" name="alergias" required className="mt-1 block w-full rounded-md shadow-sm p-2 border" defaultValue={studentData?.alergias || "Ninguna"} />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium">Enfermedades Crónicas / Padecimientos (Especifique, o escriba "Ninguno")</label>
                          <input type="text" name="padecimientos" required className="mt-1 block w-full rounded-md shadow-sm p-2 border" defaultValue={studentData?.padecimientos || "Ninguno"} />
                        </div>
                      </div>
                    </div>

                    {/* 4. Datos del Tutor */}
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4">4. Datos del Padre, Madre o Tutor</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium">Nombre Completo del Tutor principal</label>
                          <input type="text" name="tutorNombre" required className="mt-1 block w-full rounded-md shadow-sm p-2 border" defaultValue={studentData?.tutorNombre || studentData?.tutor} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium">Parentesco</label>
                          <select name="tutorParentesco" className="mt-1 block w-full rounded-md shadow-sm p-2 border" required defaultValue={studentData?.tutorParentesco}>
                            <option value="">Seleccionar</option>
                            <option>Madre</option>
                            <option>Padre</option>
                            <option>Abuelo(a)</option>
                            <option>Tío(a)</option>
                            <option>Hermano(a)</option>
                            <option>Primo(a)</option>
                            <option>Cuñado(a)</option>
                            <option>Tutor Legal (No familiar)</option>
                            <option>Otro</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium">Correo Electrónico (Opcional)</label>
                          <input type="email" name="correo" className="mt-1 block w-full rounded-md shadow-sm p-2 border" defaultValue={studentData?.correo} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium">Teléfono Celular / WhatsApp</label>
                          <input type="tel" name="telefono" required className="mt-1 block w-full rounded-md shadow-sm p-2 border" defaultValue={studentData?.telefono || studentData?.celularTutor} />
                        </div>
                      </div>
                      
                      <h4 className="font-bold text-slate-700 mt-6 mb-3 border-b pb-1">Contactos de Emergencia (Diferentes al Tutor)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-medium">Nombre de Contacto 1</label>
                          <input type="text" name="emergenciaNombre1" required className="mt-1 block w-full rounded-md shadow-sm p-2 border" defaultValue={studentData?.emergenciaNombre1 || studentData?.referencia1} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium">Parentesco (C1)</label>
                          <select name="emergenciaParentesco1" className="mt-1 block w-full rounded-md shadow-sm p-2 border" required defaultValue={studentData?.emergenciaParentesco1}>
                            <option value="">Seleccionar</option><option>Madre</option><option>Padre</option><option>Abuelo(a)</option><option>Tío(a)</option><option>Hermano(a)</option><option>Primo(a)</option><option>Cuñado(a)</option><option>Amigo/Vecino</option><option>Otro</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium">Teléfono de Contacto 1</label>
                          <input type="tel" name="emergenciaTel1" required className="mt-1 block w-full rounded-md shadow-sm p-2 border" defaultValue={studentData?.emergenciaTel1 || studentData?.celularRef1} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium">Nombre de Contacto 2</label>
                          <input type="text" name="emergenciaNombre2" required className="mt-1 block w-full rounded-md shadow-sm p-2 border" defaultValue={studentData?.emergenciaNombre2 || studentData?.referencia2} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium">Parentesco (C2)</label>
                          <select name="emergenciaParentesco2" className="mt-1 block w-full rounded-md shadow-sm p-2 border" required defaultValue={studentData?.emergenciaParentesco2}>
                            <option value="">Seleccionar</option><option>Madre</option><option>Padre</option><option>Abuelo(a)</option><option>Tío(a)</option><option>Hermano(a)</option><option>Primo(a)</option><option>Cuñado(a)</option><option>Amigo/Vecino</option><option>Otro</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium">Teléfono de Contacto 2</label>
                          <input type="tel" name="emergenciaTel2" required className="mt-1 block w-full rounded-md shadow-sm p-2 border" defaultValue={studentData?.emergenciaTel2 || studentData?.celularRef2} />
                        </div>
                      </div>
                    </div>
                  </>

                {/* 5. Documentación Digital (Oculta al actualizar datos) */}
                {activeTab !== 'completar' && (
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4">5. Documentación Digital en PDF</h3>
                    <p className="text-sm text-slate-500 mb-4">Solo se aceptan archivos en formato PDF o imagen clara.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      <div className="bg-slate-50 p-4 border rounded-lg">
                        <label className="block text-sm font-bold mb-1">
                          Acta de Nacimiento <span className="text-red-500">*</span>
                          <p className="text-xs text-slate-500 font-normal mt-1 leading-tight">
                            Serán válidos los formatos oficiales vigentes (tanto en formato tradicional sepia/café como el formato verde).
                          </p>
                        </label>
                        <input type="file" accept="application/pdf,image/*" onChange={e => handleDocFileChange(e, setActaFile)} className="w-full text-sm" required={!studentData?.actaUrl} />
                        {actaFile && <p className="text-xs text-emerald-600 mt-1">{actaFile.name}</p>}
                        {studentData?.actaUrl && !actaFile && <p className="text-xs text-blue-600 mt-1">Ya cargado previamente.</p>}
                      </div>

                      <div className="bg-slate-50 p-4 border rounded-lg">
                        <label className="block text-sm font-bold mb-1">CURP formato reciente y legible <span className="text-red-500">*</span></label>
                        <input type="file" accept="application/pdf,image/*" onChange={e => handleDocFileChange(e, setCurpFile)} className="w-full text-sm" required={!studentData?.curpUrl} />
                        {curpFile && <p className="text-xs text-emerald-600 mt-1">{curpFile.name}</p>}
                        {studentData?.curpUrl && !curpFile && <p className="text-xs text-blue-600 mt-1">Ya cargada previamente.</p>}
                      </div>

                      <div className="bg-slate-50 p-4 border rounded-lg">
                        <label className="block text-sm font-bold mb-1">Certificado de educación primaria o constancia de 6to <span className="text-slate-400 font-normal">(Opcional por ahora)</span></label>
                        <input type="file" accept="application/pdf,image/*" onChange={e => handleDocFileChange(e, setCertificadoFile)} className="w-full text-sm" />
                        {certificadoFile && <p className="text-xs text-emerald-600 mt-1">{certificadoFile.name}</p>}
                        {studentData?.certificadoUrl && !certificadoFile && <p className="text-xs text-blue-600 mt-1">Ya cargado previamente.</p>}
                      </div>

                      <div className="bg-slate-50 p-4 border rounded-lg">
                        <label className="block text-sm font-bold mb-1">Comprobante de Asignación (Portal SEP) <span className="text-slate-400 font-normal">(Si aplica)</span></label>
                        <input type="file" accept="application/pdf,image/*" onChange={e => handleDocFileChange(e, setAsignacionFile)} className="w-full text-sm" />
                        {asignacionFile && <p className="text-xs text-emerald-600 mt-1">{asignacionFile.name}</p>}
                        {studentData?.asignacionUrl && !asignacionFile && <p className="text-xs text-blue-600 mt-1">Ya cargado previamente.</p>}
                      </div>

                      <div className="bg-slate-50 p-4 border rounded-lg">
                        <label className="block text-sm font-bold mb-1">Identificación oficial del Tutor (INE) <span className="text-red-500">*</span></label>
                        <input type="file" accept="application/pdf,image/*" onChange={e => handleDocFileChange(e, setIneFile)} className="w-full text-sm" required={!studentData?.ineUrl} />
                        {ineFile && <p className="text-xs text-emerald-600 mt-1">{ineFile.name}</p>}
                        {studentData?.ineUrl && !ineFile && <p className="text-xs text-blue-600 mt-1">Ya cargado previamente.</p>}
                      </div>

                      <div className="bg-slate-50 p-4 border rounded-lg">
                        <label className="block text-sm font-bold mb-1">Comprobante de domicilio reciente <span className="text-red-500">*</span></label>
                        <input type="file" accept="application/pdf,image/*" onChange={e => handleDocFileChange(e, setDomicilioFile)} className="w-full text-sm" required={!studentData?.domicilioUrl} />
                        {domicilioFile && <p className="text-xs text-emerald-600 mt-1">{domicilioFile.name}</p>}
                        {studentData?.domicilioUrl && !domicilioFile && <p className="text-xs text-blue-600 mt-1">Ya cargado previamente.</p>}
                      </div>

                    </div>
                  </div>
                )}

                <div className="pt-6 border-t border-slate-200 flex justify-between items-center">
                  <a href="/" className="text-sm text-slate-500 hover:text-slate-700">Cancelar</a>
                  <button type="submit" disabled={isSubmitting} className="inline-flex justify-center rounded-lg border border-transparent bg-primary-600 py-3 px-8 text-sm font-medium text-white shadow-sm hover:bg-primary-700 disabled:opacity-50 transition-colors">
                    {isSubmitting ? 'Guardando archivos...' : (activeTab === 'completar' ? 'Guardar y Generar Ficha Actualizada' : 'Guardar y Generar Ficha')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {isSubmitting && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm w-full text-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-6"></div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">{loadingMessage || 'Cargando...'}</h3>
            <p className="text-slate-500 text-sm">Por favor, no cierres esta ventana ni des clic de nuevo. Esto puede tomar unos segundos dependiendo de tu conexión.</p>
          </div>
        </div>
      )}
    </div>
  );
}
