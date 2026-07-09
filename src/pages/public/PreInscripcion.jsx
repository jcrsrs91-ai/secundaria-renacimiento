import { useState } from 'react';
import { UserPlus, ClipboardList, Search, Upload, Printer } from 'lucide-react';
import { db, storage } from '../../firebase';
import { collection, addDoc, updateDoc, doc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import HojaInscripcionPrint from '../../components/HojaInscripcionPrint';

export default function PreInscripcion() {
  const [activeTab, setActiveTab] = useState('nuevo'); // 'nuevo', 'reinscripcion', 'reimprimir', 'completar'
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [finalData, setFinalData] = useState(null);

  // Estados de búsqueda
  const [lookupMatricula, setLookupMatricula] = useState('');
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

  const handleLookup = async (e) => {
    e.preventDefault();
    setLookupError('');
    setIsSubmitting(true);
    setLoadingMessage('Buscando expediente...');
    try {
      const q = query(
        collection(db, "students"),
        where("matricula", "==", lookupMatricula),
        where("curp", "==", lookupCurp.toUpperCase())
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setLookupError('No se encontró ningún expediente con esos datos.');
        setIsSubmitting(false);
        return;
      }
      
      const data = querySnapshot.docs[0].data();
      const id = querySnapshot.docs[0].id;

      if (data.grado === '3er Grado' || data.grado === '3ero') {
        setLookupError('¡Felicidades por graduarte! Los alumnos de 3er Grado ya no pueden reinscribirse.');
        setIsSubmitting(false);
        return;
      }

      let nextGrado = "2do Grado";
      if (data.grado === '2do Grado' || data.grado === '2do') nextGrado = "3er Grado";

      setStudentData({ id, ...data, grado: nextGrado });
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
        where("curp", "==", lookupCurp.toUpperCase())
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setLookupError('No se encontró ninguna ficha generada con esa CURP.');
        setIsSubmitting(false);
        return;
      }
      
      // Mostrar la ficha directamente
      setFinalData(querySnapshot.docs[0].data());
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
        where("curp", "==", lookupCurp.toUpperCase())
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setLookupError('No se encontró ningún expediente con esa CURP.');
        setIsSubmitting(false);
        return;
      }
      
      setStudentData({ id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() });
    } catch (error) {
      setLookupError('Error de conexión: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
    }
  };

  const handleCurpInput = (e) => {
    let val = e.target.value.toUpperCase();
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
        
        const char17 = val.charAt(16);
        let yearPrefix = "19";
        if (/[A-Z]/.test(char17)) {
          yearPrefix = "20";
        }
        
        const fullYear = yearPrefix + yearStr;
        const fnac = `${fullYear}-${monthStr}-${dayStr}`;
        
        const dateInput = document.querySelector('input[name="fechaNacimiento"]');
        if (dateInput && !dateInput.value) {
          dateInput.value = fnac;
        } else if (dateInput) {
          dateInput.value = fnac; // Forzar actualización aunque haya algo
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
    setLoadingMessage('Trabajando en subir los documentos...');
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
      const currentCurp = data.curp ? data.curp.toUpperCase() : studentData.curp;
      let fotoUrl = studentData?.fotoUrl || null;

      if (photoFile) {
        const photoRef = ref(storage, `student_photos/${currentCurp}_${Date.now()}`);
        await uploadBytes(photoRef, photoFile);
        fotoUrl = await getDownloadURL(photoRef);
      }

      let documentos = studentData?.documentos || {};
      
      const uploadDoc = async (fileObj, docName) => {
        if (fileObj) {
          const docRef = ref(storage, `student_docs/${currentCurp}/${docName}_${Date.now()}.pdf`);
          await uploadBytes(docRef, fileObj);
          const url = await getDownloadURL(docRef);
          documentos[docName] = true;
          return url;
        }
        return studentData?.[docName + 'Url'] || null;
      };

      const actaUrl = await uploadDoc(actaFile, 'acta');
      const curpUrl = await uploadDoc(curpFile, 'curp');
      const certificadoUrl = await uploadDoc(certificadoFile, 'certificado');
      const asignacionUrl = await uploadDoc(asignacionFile, 'asignacion');
      const ineUrl = await uploadDoc(ineFile, 'ine');
      const domicilioUrl = await uploadDoc(domicilioFile, 'domicilio');

      const submissionData = {
        ...studentData,
        ...data,
        fotoUrl,
        actaUrl,
        curpUrl,
        certificadoUrl,
        asignacionUrl,
        ineUrl,
        domicilioUrl,
        documentos,
        curp: currentCurp,
        tipoTramite: activeTab === 'reinscripcion' ? "Reinscripción" : (studentData?.tipoTramite || "Nuevo Ingreso"),
        updatedAt: serverTimestamp()
      };

      if ((activeTab === 'reinscripcion' || activeTab === 'completar') && studentData?.id) {
        const docRef = doc(db, "students", studentData.id);
        await updateDoc(docRef, submissionData);
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
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto py-8">
          <HojaInscripcionPrint data={finalData} />
          <div className="text-center mt-8 print:hidden">
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
    setLookupError('');
    setLookupCurp('');
    setLookupMatricula('');
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
            <button 
              type="button"
              className={`flex-1 py-4 px-2 sm:px-6 text-center font-medium text-sm transition-colors ${activeTab === 'reinscripcion' ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
              onClick={() => changeTab('reinscripcion')}
            >
              <ClipboardList className="inline-block w-5 h-5 sm:mr-2 -mt-1" /> <span className="hidden sm:inline">Reinscripción</span>
            </button>
            <button 
              type="button"
              className={`flex-1 py-4 px-2 sm:px-4 text-center font-medium text-xs sm:text-sm transition-colors ${activeTab === 'reimprimir' ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
              onClick={() => changeTab('reimprimir')}
            >
              <Printer className="inline-block w-4 h-4 sm:w-5 sm:h-5 sm:mr-1 -mt-1" /> <span className="hidden sm:inline">Reimprimir</span>
            </button>
            <button 
              type="button"
              className={`flex-1 py-4 px-2 sm:px-4 text-center font-medium text-xs sm:text-sm transition-colors ${activeTab === 'completar' ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
              onClick={() => changeTab('completar')}
            >
              <Upload className="inline-block w-4 h-4 sm:w-5 sm:h-5 sm:mr-1 -mt-1" /> <span className="hidden sm:inline">Subir Docs</span>
            </button>
          </div>

          <div className="p-4 sm:p-8">
            
            {/* Buscador para Completar Expediente */}
            {activeTab === 'completar' && !studentData && (
              <div className="max-w-md mx-auto py-8">
                <div className="text-center mb-6">
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                  <h3 className="text-lg font-bold">Completar Expediente Digital</h3>
                  <p className="text-sm text-slate-500 mt-1">Ingresa la CURP del alumno para subir los documentos en PDF que te faltaron.</p>
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
                    <label className="block text-sm font-medium">Matrícula</label>
                    <input type="text" className="mt-1 w-full p-2 border rounded" required value={lookupMatricula} onChange={e => setLookupMatricula(e.target.value)} />
                  </div>
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
              <form onSubmit={handleSubmit} className="space-y-8">
                
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
                      <h4 className="font-bold text-blue-800">Completar Expediente de {studentData.nombres}</h4>
                      <p className="text-sm text-blue-700 mt-1">Sube únicamente los documentos que tengas pendientes en formato PDF y guarda los cambios.</p>
                    </div>
                  </div>
                )}

                {/* Ciclo Escolar - Ocultar en Completar Expediente */}
                {activeTab !== 'completar' && (
                  <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Ciclo Escolar</h3>
                    <p className="text-sm text-slate-500 mb-4">Selecciona el ciclo escolar para este trámite.</p>
                    <select name="cicloEscolar" className="block w-full rounded-md shadow-sm p-3 border border-slate-300 font-medium" required defaultValue={studentData?.cicloEscolar || "2026-2027"}>
                      <option value="">Seleccionar ciclo...</option>
                      <option value="2024-2025">2024-2025</option>
                      <option value="2025-2026">2025-2026</option>
                      <option value="2026-2027">2026-2027</option>
                      <option value="2027-2028">2027-2028</option>
                      <option value="2028-2029">2028-2029</option>
                    </select>
                  </div>
                )}

                {/* Fotografía - Ocultar en Completar Expediente */}
                {activeTab !== 'completar' && (
                  <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 text-center">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Fotografía del Alumno</h3>
                    <p className="text-sm text-slate-500 mb-4">Sube una fotografía reciente, tamaño infantil, con fondo claro y rostro descubierto.</p>
                    <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                      <Upload className="w-5 h-5 mr-2 text-slate-400" />
                      Seleccionar Archivo de Imagen
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} required={!studentData?.fotoUrl} />
                    </label>
                    {photoFile && <p className="mt-2 text-sm text-emerald-600 font-medium">Foto seleccionada: {photoFile.name}</p>}
                    {studentData?.fotoUrl && !photoFile && <p className="mt-2 text-sm text-slate-500">Ya tienes una foto guardada. Sube otra solo si deseas cambiarla.</p>}
                  </div>
                )}

                {/* Ocultar secciones 1 a 4 si es 'completar' */}
                {activeTab !== 'completar' && (
                  <>
                    {/* 1. Datos Académicos */}
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4">1. Datos Académicos</h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {activeTab === 'nuevo' ? (
                          <div>
                            <label className="block text-sm font-medium">Grado al que Ingresa</label>
                            <select name="grado" className="mt-1 block w-full rounded-md shadow-sm p-2 border" required>
                              <option value="">Seleccionar</option><option>1er Grado</option><option>2do Grado</option><option>3er Grado</option>
                            </select>
                          </div>
                        ) : (
                          <div>
                            <label className="block text-sm font-medium">Grado al que Ingresa</label>
                            <input type="text" name="grado" className="mt-1 block w-full rounded-md shadow-sm p-2 border bg-gray-100" readOnly value={studentData?.grado || ''} />
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-medium">Grupo</label>
                          <select name="grupo" className="mt-1 block w-full rounded-md shadow-sm p-2 border" required defaultValue={studentData?.grupo}
                            onChange={(e) => {
                              const val = e.target.value;
                              const talleresMap = {
                                'A': 'Climatización y Refrigeración (3181)',
                                'B': 'Administración Contable (6011)',
                                'C': 'Diseño de Circuitos Eléctricos (4021)',
                                'D': 'Administración Contable (6011)',
                                'E': 'Diseño y Mecánica Automotriz (3081)',
                                'F': 'Ofimática (6031)'
                              };
                              const input = document.getElementById('tallerInput');
                              if (input) {
                                input.value = talleresMap[val] || '';
                              }
                            }}
                          >
                            <option value="">Seleccionar</option>
                            <option value="A" translate="no">A</option>
                            <option value="B" translate="no">B</option>
                            <option value="C" translate="no">C</option>
                            <option value="D" translate="no">D</option>
                            <option value="E" translate="no">E</option>
                            <option value="F" translate="no">F</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium">Turno</label>
                          <select name="turno" className="mt-1 block w-full rounded-md shadow-sm p-2 border" required defaultValue={studentData?.turno}>
                            <option value="">Seleccionar</option>
                            <option>Matutino</option><option>Vespertino</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium">Taller / Tecnología</label>
                          <input id="tallerInput" type="text" name="taller" className="mt-1 block w-full rounded-md shadow-sm p-2 border bg-gray-100" required defaultValue={studentData?.taller} placeholder="Se asigna por grupo..." readOnly />
                        </div>
                        {activeTab === 'nuevo' && (
                          <>
                            <div className="md:col-span-4">
                              <label className="block text-sm font-medium">Escuela de Procedencia</label>
                              <input type="text" name="escuelaProcedencia" className="mt-1 block w-full rounded-md shadow-sm p-2 border" required defaultValue={studentData?.escuelaProcedencia} />
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

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-700">Calle</label>
                          <input type="text" name="calle" required className="mt-1 block w-full rounded-md shadow-sm p-2 border" defaultValue={studentData?.calle} />
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
                          <input type="text" name="cp" required className="mt-1 block w-full rounded-md shadow-sm p-2 border" defaultValue={studentData?.cp} />
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
                          <input type="text" name="tutorNombre" required className="mt-1 block w-full rounded-md shadow-sm p-2 border" defaultValue={studentData?.tutorNombre} />
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
                          <input type="tel" name="telefono" required className="mt-1 block w-full rounded-md shadow-sm p-2 border" defaultValue={studentData?.telefono} />
                        </div>
                      </div>
                      
                      <h4 className="font-bold text-slate-700 mt-6 mb-3 border-b pb-1">Contactos de Emergencia (Diferentes al Tutor)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-medium">Nombre de Contacto 1</label>
                          <input type="text" name="emergenciaNombre1" required className="mt-1 block w-full rounded-md shadow-sm p-2 border" defaultValue={studentData?.emergenciaNombre1} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium">Parentesco (C1)</label>
                          <select name="emergenciaParentesco1" className="mt-1 block w-full rounded-md shadow-sm p-2 border" required defaultValue={studentData?.emergenciaParentesco1}>
                            <option value="">Seleccionar</option><option>Madre</option><option>Padre</option><option>Abuelo(a)</option><option>Tío(a)</option><option>Hermano(a)</option><option>Primo(a)</option><option>Cuñado(a)</option><option>Amigo/Vecino</option><option>Otro</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium">Teléfono de Contacto 1</label>
                          <input type="tel" name="emergenciaTel1" required className="mt-1 block w-full rounded-md shadow-sm p-2 border" defaultValue={studentData?.emergenciaTel1} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium">Nombre de Contacto 2</label>
                          <input type="text" name="emergenciaNombre2" required className="mt-1 block w-full rounded-md shadow-sm p-2 border" defaultValue={studentData?.emergenciaNombre2} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium">Parentesco (C2)</label>
                          <select name="emergenciaParentesco2" className="mt-1 block w-full rounded-md shadow-sm p-2 border" required defaultValue={studentData?.emergenciaParentesco2}>
                            <option value="">Seleccionar</option><option>Madre</option><option>Padre</option><option>Abuelo(a)</option><option>Tío(a)</option><option>Hermano(a)</option><option>Primo(a)</option><option>Cuñado(a)</option><option>Amigo/Vecino</option><option>Otro</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium">Teléfono de Contacto 2</label>
                          <input type="tel" name="emergenciaTel2" required className="mt-1 block w-full rounded-md shadow-sm p-2 border" defaultValue={studentData?.emergenciaTel2} />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* 5. Documentación Digital */}
                <div>
                  <h3 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4">5. Documentación Digital en PDF</h3>
                  <p className="text-sm text-slate-500 mb-4">Solo se aceptan archivos en formato PDF.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    <div className="bg-slate-50 p-4 border rounded-lg">
                      <label className="block text-sm font-bold mb-1">Acta de Nacimiento Actualizada <span className="text-red-500">*</span></label>
                      <input type="file" accept="application/pdf" onChange={e => setActaFile(e.target.files[0])} className="w-full text-sm" required={!studentData?.actaUrl} />
                      {actaFile && <p className="text-xs text-emerald-600 mt-1">{actaFile.name}</p>}
                      {studentData?.actaUrl && !actaFile && <p className="text-xs text-blue-600 mt-1">Ya cargado previamente.</p>}
                    </div>

                    <div className="bg-slate-50 p-4 border rounded-lg">
                      <label className="block text-sm font-bold mb-1">CURP formato reciente y legible <span className="text-red-500">*</span></label>
                      <input type="file" accept="application/pdf" onChange={e => setCurpFile(e.target.files[0])} className="w-full text-sm" required={!studentData?.curpUrl} />
                      {curpFile && <p className="text-xs text-emerald-600 mt-1">{curpFile.name}</p>}
                      {studentData?.curpUrl && !curpFile && <p className="text-xs text-blue-600 mt-1">Ya cargada previamente.</p>}
                    </div>

                    <div className="bg-slate-50 p-4 border rounded-lg">
                      <label className="block text-sm font-bold mb-1">Certificado de educación primaria o constancia de 6to <span className="text-slate-400 font-normal">(Opcional por ahora)</span></label>
                      <input type="file" accept="application/pdf" onChange={e => setCertificadoFile(e.target.files[0])} className="w-full text-sm" />
                      {certificadoFile && <p className="text-xs text-emerald-600 mt-1">{certificadoFile.name}</p>}
                      {studentData?.certificadoUrl && !certificadoFile && <p className="text-xs text-blue-600 mt-1">Ya cargado previamente.</p>}
                    </div>

                    <div className="bg-slate-50 p-4 border rounded-lg">
                      <label className="block text-sm font-bold mb-1">Comprobante de Asignación (Portal SEP) <span className="text-slate-400 font-normal">(Si aplica)</span></label>
                      <input type="file" accept="application/pdf" onChange={e => setAsignacionFile(e.target.files[0])} className="w-full text-sm" />
                      {asignacionFile && <p className="text-xs text-emerald-600 mt-1">{asignacionFile.name}</p>}
                      {studentData?.asignacionUrl && !asignacionFile && <p className="text-xs text-blue-600 mt-1">Ya cargado previamente.</p>}
                    </div>

                    <div className="bg-slate-50 p-4 border rounded-lg">
                      <label className="block text-sm font-bold mb-1">Identificación oficial vigente (INE o Pasaporte) <span className="text-slate-400 font-normal">(Opcional por ahora)</span></label>
                      <input type="file" accept="application/pdf" onChange={e => setIneFile(e.target.files[0])} className="w-full text-sm" />
                      {ineFile && <p className="text-xs text-emerald-600 mt-1">{ineFile.name}</p>}
                      {studentData?.ineUrl && !ineFile && <p className="text-xs text-blue-600 mt-1">Ya cargado previamente.</p>}
                    </div>

                    <div className="bg-slate-50 p-4 border rounded-lg">
                      <label className="block text-sm font-bold mb-1">Comprobante de domicilio reciente <span className="text-slate-400 font-normal">(Opcional por ahora)</span></label>
                      <input type="file" accept="application/pdf" onChange={e => setDomicilioFile(e.target.files[0])} className="w-full text-sm" />
                      {domicilioFile && <p className="text-xs text-emerald-600 mt-1">{domicilioFile.name}</p>}
                      {studentData?.domicilioUrl && !domicilioFile && <p className="text-xs text-blue-600 mt-1">Ya cargado previamente.</p>}
                    </div>

                  </div>
                </div>

                <div className="pt-6 border-t border-slate-200 flex justify-between items-center">
                  <a href="/" className="text-sm text-slate-500 hover:text-slate-700">Cancelar</a>
                  <button type="submit" disabled={isSubmitting} className="inline-flex justify-center rounded-lg border border-transparent bg-primary-600 py-3 px-8 text-sm font-medium text-white shadow-sm hover:bg-primary-700 disabled:opacity-50 transition-colors">
                    {isSubmitting ? 'Guardando archivos...' : (activeTab === 'completar' ? 'Guardar y Generar Acuse' : 'Guardar y Generar Ficha')}
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
