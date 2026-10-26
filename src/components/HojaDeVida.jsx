import { useState, useRef, useEffect } from 'react';
import { X, Save, Edit, User, Heart, Users, Camera, Upload, StopCircle, Printer, Award, FileCheck } from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { isBeforeSept30 } from '../utils/dateRules';
import { registrarMovimiento, detectarCambiosExpediente } from '../utils/bitacora';
import HojaInscripcionPrint from './HojaInscripcionPrint';
import ConstanciaPrint from './ConstanciaPrint';

export default function HojaDeVida({ student, materiasPorGrado = {}, onClose, onSave, readOnly = false }) {
  const { currentUser, userPermissions, userRole } = useAuth();
  
  // Es de solo lectura si se pasa el prop o si no tiene permiso de control escolar (y no es superadmin)
  const isReadOnly = readOnly || (userRole !== 'superadmin' && !(userPermissions || []).includes('control-escolar'));

  const [showPrintMode, setShowPrintMode] = useState(false);
  const [printExtraordinarioSelected, setPrintExtraordinarioSelected] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [grupo, setGrupo] = useState(student.grupo || '');
  const [taller, setTaller] = useState(student.taller || '');
  const [historial, setHistorial] = useState(student.historial || {});
  const [extraordinarios, setExtraordinarios] = useState(student.extraordinarios || []);

  // Estado reactivo para Beca (sincronizado con BecasReport y HojaInscripcionPrint)
  const hasBecaInitial = (
    String(student.tieneBeca || '').toUpperCase().trim().startsWith('S') ||
    (student.nombreBeca && String(student.nombreBeca).trim() !== '' && !['NO', 'NINGUNA', 'N/A'].includes(String(student.nombreBeca).toUpperCase().trim()))
  );
  const [tieneBeca, setTieneBeca] = useState(hasBecaInitial ? 'SÍ' : 'NO');
  const [nombreBeca, setNombreBeca] = useState(
    hasBecaInitial && student.nombreBeca && !['NO', 'NINGUNA', 'N/A'].includes(String(student.nombreBeca).toUpperCase().trim())
      ? student.nombreBeca
      : ''
  );

  // Estado para Documentación entregada
  const [documentos, setDocumentos] = useState(student.documentos || {});

  const handleDocToggle = (key) => {
    setDocumentos(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleHistorialChange = (gradoKey, materiaId, trim, value) => {
    setHistorial(prev => ({
      ...prev,
      [gradoKey]: {
        ...(prev[gradoKey] || {}),
        [materiaId]: {
          ...((prev[gradoKey] || {})[materiaId] || {}),
          [trim]: value
        }
      }
    }));
  };

  const addExtraordinario = () => {
    setExtraordinarios([...extraordinarios, { id: Date.now().toString(), materia: '', calificacion: '', fecha: '', periodo: '' }]);
  };

  const removeExtraordinario = (id) => {
    setExtraordinarios(extraordinarios.filter(e => e.id !== id));
  };

  const handleExtraordinarioChange = (id, field, value) => {
    setExtraordinarios(extraordinarios.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const [isCapturing, setIsCapturing] = useState(false);
  const [fotoPreview, setFotoPreview] = useState(student.fotoUrl || '');
  const videoRef = useRef(null);

  // Limpiar cámara al cerrar
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

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

  const handleGrupoChange = (e) => {
    const val = e.target.value;
    setGrupo(val);
    if (talleresMap[val]) {
      setTaller(talleresMap[val]);
    }
    const turnoEl = document.getElementById('hdv-turno-select');
    if (turnoEl && val) {
      turnoEl.value = ['G', 'H', 'I', 'J', 'K', 'L'].includes(val) ? 'Vespertino' : 'Matutino';
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;
      setFotoPreview(base64String);
      try {
        const docRef = doc(db, "students", student.id);
        await updateDoc(docRef, { fotoUrl: base64String, lastModifiedBy: currentUser?.email || 'Desconocido', lastModifiedAt: new Date().toISOString() });
        const nom = `${student.apellidoPaterno || ''} ${student.apellidoMaterno || ''} ${student.nombres || ''}`.trim().toUpperCase();
        await registrarMovimiento(
          currentUser?.email,
          'Control Escolar (Expediente)',
          'Actualizar Fotografía',
          `Subió nueva fotografía de archivo para el alumno ${nom} (${student.grado || ''} "${student.grupo || ''}")`
        );
        console.log("Foto subida exitosamente");
      } catch (error) {
        console.error("Error al subir foto: ", error);
      }
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Error accessing camera: ", err);
      alert("No se pudo acceder a la cámara. Revisa los permisos del navegador.");
      setIsCapturing(false);
    }
  };

  const takePhoto = async () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 375;
      const ctx = canvas.getContext('2d');
      // Dibujar ajustando al centro
      const video = videoRef.current;
      const size = Math.min(video.videoWidth, video.videoHeight);
      const startX = (video.videoWidth - size) / 2;
      const startY = (video.videoHeight - size) / 2;
      ctx.drawImage(video, startX, startY, size, size, 0, 0, canvas.width, canvas.height);
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
      setFotoPreview(dataUrl);
      
      const stream = video.srcObject;
      stream.getTracks().forEach(track => track.stop());
      setIsCapturing(false);

      // Guardar automáticamente en Firestore
      try {
        const docRef = doc(db, "students", student.id);
        await updateDoc(docRef, { fotoUrl: dataUrl, lastModifiedBy: currentUser?.email || 'Desconocido', lastModifiedAt: new Date().toISOString() });
        const nom = `${student.apellidoPaterno || ''} ${student.apellidoMaterno || ''} ${student.nombres || ''}`.trim().toUpperCase();
        await registrarMovimiento(
          currentUser?.email,
          'Control Escolar (Expediente)',
          'Capturar Fotografía',
          `Tomó fotografía con cámara para el alumno ${nom} (${student.grado || ''} "${student.grupo || ''}")`
        );
      } catch (err) {
        console.error("Error al guardar foto: ", err);
      }
    }
  };

  const cancelCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
    setIsCapturing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    data.historial = historial;
    data.extraordinarios = extraordinarios;
    data.documentos = documentos;
    data.tieneBeca = tieneBeca;
    data.nombreBeca = tieneBeca === 'SÍ' ? (nombreBeca || '').trim().toUpperCase() : '';

    // --- NUEVA LÓGICA DE BAJAS Y FECHAS ---
    if (data.status === 'Baja' && student.status !== 'Baja') {
        if (isBeforeSept30()) {
            data.motivoBaja = 'No Inscrito';
            alert("⚠️ AVISO: Al dar de baja antes del 30 de septiembre, este alumno se clasifica como 'No Inscrito' y no aparecerá en las Bajas Oficiales.");
        } else {
            data.motivoBaja = 'Baja Oficial';
        }
    }

    try {
      const docRef = doc(db, "students", student.id);
      await updateDoc(docRef, { ...data, lastModifiedBy: currentUser?.email || 'Desconocido', lastModifiedAt: new Date().toISOString() });
      const infoBitacora = detectarCambiosExpediente(student, data);
      await registrarMovimiento(
        currentUser?.email,
        'Control Escolar (Expediente)',
        infoBitacora.accion,
        infoBitacora.detalle,
        {
          cambios: infoBitacora.cambios,
          alumnoId: student.id,
          alumnoNombre: infoBitacora.alumnoNombre
        }
      );
      alert("Expediente actualizado exitosamente.");
      onSave({ ...student, ...data });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert("Error al guardar los cambios.");
    }
    setSaving(false);
  };

  if (showPrintMode) {
    return (
      <div className="fixed inset-0 z-[60] bg-gray-100 overflow-y-auto">
        <div className="p-4 bg-white shadow flex justify-between print:hidden sticky top-0 z-10">
          <button onClick={() => {
            setShowPrintMode(false);
            setPrintExtraordinarioSelected(null);
          }} className="text-gray-500 font-bold hover:text-gray-800 flex items-center bg-gray-200 px-4 py-2 rounded-lg">
             ← Volver al Expediente
          </button>
        </div>
        <div className="py-8">
          {printExtraordinarioSelected ? (
            <ConstanciaPrint student={student} type="acreditacion_extraordinario" materiasPorGrado={materiasPorGrado} extraordinarioSelected={printExtraordinarioSelected} />
          ) : (
            <HojaInscripcionPrint data={student} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-100 rounded-2xl shadow-2xl max-w-5xl w-full my-8 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white rounded-t-2xl sticky top-0 z-10 shadow-sm">
          <div className="flex flex-col">
            <div className="flex items-center space-x-3">
              <h2 className="font-extrabold text-2xl text-slate-800">Hoja de Vida del Alumno</h2>
              <span className="bg-primary-100 text-primary-800 text-xs font-bold px-3 py-1 rounded-full">{student.matricula}</span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                student.status === 'Activo' ? 'bg-emerald-100 text-emerald-800' :
                student.status === 'Baja' ? 'bg-sky-100 text-sky-800' :
                student.status === 'Egresado' ? 'bg-blue-100 text-blue-800' :
                'bg-indigo-100 text-indigo-800'
              }`}>{student.status || 'Activo'}</span>
            </div>
            {student.lastModifiedBy && (
              <div className="text-[11px] text-slate-400 mt-1 font-medium flex items-center">
                <span className="mr-1">📝</span> Última modificación por: <span className="font-bold text-slate-500 mx-1">{student.lastModifiedBy}</span> el {new Date(student.lastModifiedAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            <button onClick={() => setShowPrintMode(true)} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm transition">
              <Printer className="w-4 h-4 mr-2" /> Ficha de Inscripción
            </button>
            {!isEditing && !isReadOnly && (
              <button onClick={() => setIsEditing(true)} className="flex items-center px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 shadow-sm transition">
                <Edit className="w-4 h-4 mr-2" /> Habilitar Edición
              </button>
            )}
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {isEditing ? (
             <form id="edit-student-form" onSubmit={handleSubmit} className="space-y-6">
                
                {/* 1. Datos Académicos, Antecedentes y Beca */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4">1. Datos Académicos, Antecedentes y Becas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500">Matrícula</label>
                      <input type="text" name="matricula" defaultValue={student.matricula} className="mt-1 w-full p-2 border rounded font-bold text-indigo-700 bg-indigo-50" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500">Ciclo Escolar</label>
                      <select name="cicloEscolar" defaultValue={student.cicloEscolar || '2026-2027'} className="mt-1 w-full p-2 border rounded">
                        <option value="2024-2025">2024-2025</option>
                        <option value="2025-2026">2025-2026</option>
                        <option value="2026-2027">2026-2027</option>
                        <option value="2027-2028">2027-2028</option>
                        <option value="2028-2029">2028-2029</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500">Grado</label>
                      <select name="grado" defaultValue={student.grado} className="mt-1 w-full p-2 border rounded" required>
                        <option>1er Grado</option><option>2do Grado</option><option>3er Grado</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500">Grupo</label>
                      <select name="grupo" value={grupo} onChange={handleGrupoChange} translate="no" className="notranslate mt-1 w-full p-2 border rounded" required>
                        <option value="A" translate="no">A</option><option value="B" translate="no">B</option><option value="C" translate="no">C</option><option value="D" translate="no">D</option><option value="E" translate="no">E</option><option value="F" translate="no">F</option><option value="G" translate="no">G</option><option value="H" translate="no">H</option><option value="I" translate="no">I</option><option value="J" translate="no">J</option><option value="K" translate="no">K</option><option value="L" translate="no">L</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500">Turno</label>
                      <select id="hdv-turno-select" name="turno" defaultValue={student.turno} className="mt-1 w-full p-2 border rounded" required>
                        <option>Matutino</option><option>Vespertino</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500">Taller / Tecnología</label>
                      <input type="text" name="taller" value={taller} onChange={(e) => setTaller(e.target.value)} className="mt-1 w-full p-2 border rounded" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500">¿Es Repetidor de este Grado?</label>
                      <select name="repetidor" defaultValue={student.repetidor || 'NO'} className="mt-1 w-full p-2 border rounded">
                        <option value="NO">NO</option>
                        <option value="SÍ">SÍ</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500">Estatus</label>
                      <select name="status" defaultValue={student.status || 'Activo'} className="mt-1 w-full p-2 border rounded" required>
                        <option value="Activo">Activo</option>
                        <option value="Baja">Baja</option>
                        <option value="No Inscrito">No Inscrito</option>
                        <option value="Egresado">Egresado</option>
                        <option value="Pendiente">Pendiente</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500">Tipo Ingreso (Matrícula)</label>
                      <select name="tipoIngreso" defaultValue={student.tipoIngreso || 'Nuevo Ingreso'} className="mt-1 w-full p-2 border rounded border-indigo-200 bg-indigo-50" required>
                        <option value="Nuevo Ingreso">Ordinario (Exist. Anterior)</option>
                        <option value="Alta">Alta (Ingresó después)</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-slate-500">Escuela de Procedencia</label>
                      <input type="text" name="escuelaProcedencia" defaultValue={student.escuelaProcedencia} placeholder="Ej. Esc. Prim. ..." className="mt-1 w-full p-2 border rounded uppercase" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500">Promedio Obtenido (Procedencia)</label>
                      <input type="text" name="promedioEscuela" defaultValue={student.promedioEscuela} placeholder="Ej. 8.9" className="mt-1 w-full p-2 border rounded" />
                    </div>
                    <div className="md:col-span-4">
                      <label className="block text-xs font-medium text-slate-500">Domicilio de la Escuela de Procedencia</label>
                      <input type="text" name="domicilioEscuela" defaultValue={student.domicilioEscuela} placeholder="Calle, colonia o localidad de la escuela de procedencia" className="mt-1 w-full p-2 border rounded" />
                    </div>

                    {/* Sub-bloque destacado de Beca */}
                    <div className="md:col-span-4 mt-2 p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div>
                        <label className="block text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-emerald-600" /> ¿Cuenta con alguna Beca?
                        </label>
                        <select
                          name="tieneBeca"
                          value={tieneBeca}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTieneBeca(val);
                            if (val === 'NO') setNombreBeca('');
                            else if (!nombreBeca) setNombreBeca('BECA RITA CETINA');
                          }}
                          className="mt-1 w-full p-2 border border-emerald-300 rounded font-bold text-emerald-900 bg-white"
                        >
                          <option value="NO">NO</option>
                          <option value="SÍ">SÍ</option>
                        </select>
                      </div>
                      {tieneBeca === 'SÍ' && (
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-emerald-800">
                            Nombre / Programa de la Beca (Selecciona de la lista o escribe el nombre)
                          </label>
                          <div className="flex flex-col sm:flex-row gap-2 mt-1">
                            <input
                              type="text"
                              name="nombreBeca"
                              list="programas-beca-list"
                              value={nombreBeca}
                              onChange={(e) => setNombreBeca(e.target.value)}
                              placeholder="Ej. BECA RITA CETINA, BENITO JUÁREZ, ESTATAL..."
                              className="flex-1 p-2 border border-emerald-300 rounded font-semibold uppercase bg-white"
                              required={tieneBeca === 'SÍ'}
                            />
                            <datalist id="programas-beca-list">
                              <option value="BECA RITA CETINA" />
                              <option value="BECA BENITO JUÁREZ" />
                              <option value="BECA ESTATAL" />
                              <option value="BECA POR DISCAPACIDAD / DIF" />
                              <option value="BECA MUNICIPAL" />
                              <option value="BECA BIENESTAR" />
                            </datalist>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {['BECA RITA CETINA', 'BECA BENITO JUÁREZ', 'BECA ESTATAL', 'BECA POR DISCAPACIDAD / DIF'].map((sug) => (
                              <button
                                key={sug}
                                type="button"
                                onClick={() => setNombreBeca(sug)}
                                className={`text-[11px] px-2.5 py-1 rounded-full font-bold border transition ${
                                  nombreBeca.toUpperCase() === sug
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                }`}
                              >
                                {sug}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Datos Personales */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4">2. Datos Personales y Domicilio del Alumno</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500">Nombre(s) *</label>
                      <input type="text" name="nombres" defaultValue={student.nombres} className="mt-1 w-full p-2 border rounded uppercase" required />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500">Apellido Paterno *</label>
                      <input type="text" name="apellidoPaterno" defaultValue={student.apellidoPaterno} className="mt-1 w-full p-2 border rounded uppercase" required />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500">Apellido Materno</label>
                      <input type="text" name="apellidoMaterno" defaultValue={student.apellidoMaterno} className="mt-1 w-full p-2 border rounded uppercase" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500">CURP</label>
                      <input type="text" name="curp" maxLength="18" defaultValue={student.curp} className="mt-1 w-full p-2 border rounded uppercase" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500">Género</label>
                      <select name="genero" defaultValue={student.genero} className="mt-1 w-full p-2 border rounded">
                        <option value="">Seleccionar...</option>
                        <option value="Hombre">Hombre</option>
                        <option value="Mujer">Mujer</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500">Fecha de Nacimiento</label>
                      <input type="date" name="fechaNacimiento" defaultValue={student.fechaNacimiento} className="mt-1 w-full p-2 border rounded" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500">Nacionalidad (País de Nacimiento)</label>
                      <select name="nacionalidad" defaultValue={student.nacionalidad || 'MEXICANA'} className="mt-1 w-full p-2 border rounded">
                        <option value="MEXICANA">Mexicana</option>
                        <option value="EXTRANJERA">Extranjera</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500">¿Habla Lengua Indígena?</label>
                      <select name="lenguaIndigena" defaultValue={student.lenguaIndigena || 'NO'} className="mt-1 w-full p-2 border rounded">
                        <option value="NO">NO</option>
                        <option value="SÍ">SÍ</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500">¿Cuál lengua indígena?</label>
                      <input type="text" name="nombreLenguaIndigena" defaultValue={student.nombreLenguaIndigena} placeholder="Ej. Náhuatl, Mixteco..." className="mt-1 w-full p-2 border rounded" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500">¿Además habla español?</label>
                      <select name="hablaEspanol" className="mt-1 w-full p-2 border rounded" defaultValue={student?.hablaEspanol || 'SÍ'}>
                        <option value="SÍ">SÍ</option>
                        <option value="NO">NO</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-slate-500">Calle y Número</label>
                      <div className="flex gap-2">
                        <input type="text" name="calle" defaultValue={student.calle} placeholder="Calle" className="mt-1 flex-1 p-2 border rounded" />
                        <input type="text" name="numero" defaultValue={student.numero} placeholder="Núm." className="mt-1 w-28 p-2 border rounded" />
                      </div>
                    </div>
                    <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-slate-500">Colonia / Localidad</label>
                        <input type="text" name="colonia" defaultValue={student.colonia} placeholder="Colonia" className="mt-1 w-full p-2 border rounded" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500">Código Postal (C.P.)</label>
                        <input type="text" name="cp" defaultValue={student.cp || student.codigoPostal} placeholder="C.P." className="mt-1 w-full p-2 border rounded" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Salud */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4">3. Cédula de Referencia de Salud e Inclusión</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500">Tipo de Sangre</label>
                      <input
                        type="text"
                        name="tipoSangre"
                        list="tipos-sangre-list"
                        defaultValue={student.tipoSangre}
                        placeholder="Ej. O+, A+, B+..."
                        className="mt-1 w-full p-2 border rounded uppercase"
                      />
                      <datalist id="tipos-sangre-list">
                        <option value="O+" />
                        <option value="O-" />
                        <option value="A+" />
                        <option value="A-" />
                        <option value="B+" />
                        <option value="B-" />
                        <option value="AB+" />
                        <option value="AB-" />
                        <option value="NO ESPECIFICADO" />
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500">¿Usa Lentes?</label>
                      <select name="lentes" defaultValue={student.lentes || 'NO'} className="mt-1 w-full p-2 border rounded">
                        <option value="NO">NO</option><option value="SÍ">SÍ</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500">Discapacidad o Condición (Estadística 911)</label>
                      <select name="discapacidad" defaultValue={student.discapacidad || 'Ninguna'} className="mt-1 w-full p-2 border rounded">
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
                    <div>
                      <label className="block text-xs font-medium text-slate-500">Atención USAER</label>
                      <select name="usaer" className="mt-1 w-full p-2 border rounded" defaultValue={student?.usaer || 'NO'}>
                        <option value="NO">NO</option>
                        <option value="SÍ">SÍ</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-slate-500">Alergias (Especifique, o escriba "Ninguna")</label>
                      <input type="text" name="alergias" defaultValue={student.alergias || 'Ninguna'} className="mt-1 w-full p-2 border rounded" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-slate-500">Enfermedades Crónicas / Padecimientos (Especifique, o escriba "Ninguno")</label>
                      <input type="text" name="padecimientos" defaultValue={student.padecimientos || 'Ninguno'} className="mt-1 w-full p-2 border rounded" />
                    </div>
                  </div>
                </div>

                {/* 4. Contactos */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4">4. Datos del Padre, Madre o Tutor y Contactos de Emergencia</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded border">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-600 mb-1">Nombre Completo del Tutor Principal</label>
                        <input type="text" name="tutorNombre" defaultValue={student.tutorNombre || student.tutor} className="w-full p-2 border rounded" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Parentesco</label>
                        <input
                          type="text"
                          name="tutorParentesco"
                          list="parentescos-list"
                          defaultValue={student.tutorParentesco}
                          placeholder="Madre, Padre, Abuelo(a)..."
                          className="w-full p-2 border rounded"
                        />
                        <datalist id="parentescos-list">
                          <option value="Madre" />
                          <option value="Padre" />
                          <option value="Abuelo(a)" />
                          <option value="Tío(a)" />
                          <option value="Hermano(a)" />
                          <option value="Primo(a)" />
                          <option value="Cuñado(a)" />
                          <option value="Tutor Legal (No familiar)" />
                          <option value="Amigo/Vecino" />
                          <option value="Otro" />
                        </datalist>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Teléfono Celular / WhatsApp</label>
                        <input type="tel" name="telefono" defaultValue={student.telefono || student.celularTutor} className="w-full p-2 border rounded" />
                      </div>
                      <div className="md:col-span-4">
                        <label className="block text-xs font-bold text-slate-600 mb-1">Correo Electrónico del Tutor (Opcional)</label>
                        <input type="email" name="correo" defaultValue={student.correo} placeholder="ejemplo@correo.com" className="w-full p-2 border rounded" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded">
                      <div className="md:col-span-2"><label className="block text-xs font-medium text-slate-500 mb-1">Contacto de Emergencia 1</label><input type="text" name="emergenciaNombre1" defaultValue={student.emergenciaNombre1 || student.referencia1} className="w-full p-2 border rounded" /></div>
                      <div><label className="block text-xs font-medium text-slate-500 mb-1">Parentesco (C1)</label><input type="text" name="emergenciaParentesco1" list="parentescos-list" defaultValue={student.emergenciaParentesco1} className="w-full p-2 border rounded" /></div>
                      <div><label className="block text-xs font-medium text-slate-500 mb-1">Teléfono (C1)</label><input type="tel" name="emergenciaTel1" defaultValue={student.emergenciaTel1 || student.celularRef1} className="w-full p-2 border rounded" /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded">
                      <div className="md:col-span-2"><label className="block text-xs font-medium text-slate-500 mb-1">Contacto de Emergencia 2</label><input type="text" name="emergenciaNombre2" defaultValue={student.emergenciaNombre2 || student.referencia2} className="w-full p-2 border rounded" /></div>
                      <div><label className="block text-xs font-medium text-slate-500 mb-1">Parentesco (C2)</label><input type="text" name="emergenciaParentesco2" list="parentescos-list" defaultValue={student.emergenciaParentesco2} className="w-full p-2 border rounded" /></div>
                      <div><label className="block text-xs font-medium text-slate-500 mb-1">Teléfono (C2)</label><input type="tel" name="emergenciaTel2" defaultValue={student.emergenciaTel2 || student.celularRef2} className="w-full p-2 border rounded" /></div>
                    </div>
                  </div>
                </div>

                {/* 5. Control de Documentación Entregada */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 border-b pb-2 mb-3 flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-indigo-600" /> 5. Control de Documentación Entregada
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">Marca los documentos que el alumno ya entregó físicamente o en el sistema:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { key: 'acta', label: 'Acta de Nacimiento' },
                      { key: 'curp', label: 'CURP Actualizada' },
                      { key: 'certificado', label: 'Certificado de Primaria / Constancia' },
                      { key: 'asignacion', label: 'Comprobante de Asignación SEP' },
                      { key: 'ine', label: 'INE / Identificación del Tutor' },
                      { key: 'domicilio', label: 'Comprobante de Domicilio' }
                    ].map(docItem => (
                      <label
                        key={docItem.key}
                        className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition ${
                          documentos?.[docItem.key]
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={!!documentos?.[docItem.key]}
                          onChange={() => handleDocToggle(docItem.key)}
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                        />
                        <span className="text-xs">{docItem.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 6. Historial Académico */}
                {(student.grado === '2do Grado' || student.grado === '3er Grado') && (
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4">Historial Académico (Para Kárdex)</h3>
                    <p className="text-sm text-slate-500 mb-4">Ingrese las calificaciones de los trimestres (T1, T2, T3) de los años anteriores.</p>
                    
                    {['1er Grado', '2do Grado', '3er Grado'].map((gradoKey) => {
                      if (gradoKey === '2do Grado' && !['3er Grado', 'Egresado'].includes(student.grado)) return null;
                      if (gradoKey === '3er Grado' && !['3er Grado', 'Egresado'].includes(student.grado)) return null;
                      const materias = materiasPorGrado[gradoKey] || [];
                      if (materias.length === 0) return null;
                      
                      return (
                        <div key={gradoKey} className="mb-6">
                          <h4 className="font-bold text-md text-slate-700 bg-slate-100 p-2 rounded">{gradoKey}</h4>
                          <table className="w-full text-sm text-left mt-2 border-collapse">
                            <thead>
                              <tr className="bg-slate-50">
                                <th className="border p-2">Materia</th>
                                <th className="border p-2 w-20 text-center">T1</th>
                                <th className="border p-2 w-20 text-center">T2</th>
                                <th className="border p-2 w-20 text-center">T3</th>
                              </tr>
                            </thead>
                            <tbody>
                              {materias.map(mat => (
                                <tr key={mat.id}>
                                  <td className="border p-2 text-xs">{mat.name}</td>
                                  <td className="border p-1"><input type="number" step="0.1" min="5" max="10" className="w-full p-1 border rounded text-center text-xs" value={historial[gradoKey]?.[mat.id]?.t1 || ''} onChange={(e) => handleHistorialChange(gradoKey, mat.id, 't1', e.target.value)} /></td>
                                  <td className="border p-1"><input type="number" step="0.1" min="5" max="10" className="w-full p-1 border rounded text-center text-xs" value={historial[gradoKey]?.[mat.id]?.t2 || ''} onChange={(e) => handleHistorialChange(gradoKey, mat.id, 't2', e.target.value)} /></td>
                                  <td className="border p-1"><input type="number" step="0.1" min="5" max="10" className="w-full p-1 border rounded text-center text-xs" value={historial[gradoKey]?.[mat.id]?.t3 || ''} onChange={(e) => handleHistorialChange(gradoKey, mat.id, 't3', e.target.value)} /></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* 7. Exámenes Extraordinarios (Edit) */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center border-b pb-2 mb-4">
                    <h3 className="text-lg font-bold text-slate-800">Exámenes Extraordinarios</h3>
                    <button type="button" onClick={addExtraordinario} className="px-3 py-1 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700">
                      + Agregar
                    </button>
                  </div>
                  <div className="space-y-4">
                    {extraordinarios.length === 0 && <p className="text-sm text-slate-500">No hay registros de extraordinarios.</p>}
                    {extraordinarios.map((extra) => (
                      <div key={extra.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-slate-50 p-4 rounded border relative">
                        <button type="button" onClick={() => removeExtraordinario(extra.id)} className="absolute top-2 right-2 text-red-500 hover:text-red-700">
                          <X className="w-4 h-4" />
                        </button>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-slate-600 mb-1">Materia</label>
                          <input type="text" className="w-full p-2 border rounded text-sm" value={extra.materia} onChange={e => handleExtraordinarioChange(extra.id, 'materia', e.target.value)} placeholder="Ej. Matemáticas 1" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Calificación</label>
                          <input type="number" min="6" max="10" step="0.1" className="w-full p-2 border rounded text-sm" value={extra.calificacion} onChange={e => handleExtraordinarioChange(extra.id, 'calificacion', e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Fecha</label>
                          <input type="date" className="w-full p-2 border rounded text-sm" value={extra.fecha} onChange={e => handleExtraordinarioChange(extra.id, 'fecha', e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Periodo</label>
                          <input type="text" className="w-full p-2 border rounded text-sm" value={extra.periodo} onChange={e => handleExtraordinarioChange(extra.id, 'periodo', e.target.value)} placeholder="Ej. Ago 2026" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </form>
          ) : (
            <div className="space-y-8">
              {/* Profile Card */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-8 items-center md:items-start relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-24 bg-primary-600"></div>
                 
                 <div className="flex flex-col items-center mt-8 md:mt-4 z-10">
                   <div className="w-40 h-48 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-slate-100 flex-shrink-0 relative">
                      {isCapturing ? (
                        <video ref={videoRef} className="w-full h-full object-cover transform scale-x-[-1]" autoPlay playsInline muted />
                      ) : fotoPreview ? (
                        <img src={fotoPreview} alt="Foto" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-full h-full p-8 text-slate-300" />
                      )}
                   </div>
                   
                   <div className="mt-3">
                     {isCapturing ? (
                       <div className="flex gap-2">
                         <button onClick={takePhoto} type="button" className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded shadow hover:bg-emerald-700 flex items-center">
                           <Camera className="w-3 h-3 mr-1" /> Capturar
                         </button>
                         <button onClick={cancelCamera} type="button" className="px-3 py-1.5 bg-sky-600 text-white text-xs font-bold rounded shadow hover:bg-sky-700">
                           <X className="w-3 h-3" />
                         </button>
                       </div>
                     ) : (
                       <div className="flex">
                         <button onClick={startCamera} type="button" className="px-4 py-1.5 bg-slate-800 text-white text-xs font-bold rounded shadow hover:bg-slate-900 flex items-center">
                           <Camera className="w-3 h-3 mr-1.5" /> Tomar Foto
                         </button>
                         <label className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded shadow hover:bg-emerald-700 flex items-center cursor-pointer ml-2">
                           <Upload className="w-3 h-3 mr-1.5" /> Subir
                           <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                         </label>
                       </div>
                     )}
                   </div>
                 </div>

                 <div className="flex-1 text-center md:text-left relative z-10 mt-2 md:mt-12 w-full">
                    <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{student.apellidoPaterno} {student.apellidoMaterno}</h3>
                    <h4 className="text-xl font-medium text-slate-600 uppercase mb-6">{student.nombres}</h4>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div><p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Grado</p><p className="font-bold text-slate-800 text-lg">{student.grado}</p></div>
                      <div><p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Grupo</p><p className="font-bold text-primary-700 text-lg">{student.grupo || 'Por Asignar'}</p></div>
                      <div><p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Turno</p><p className="font-bold text-slate-800 text-lg">{student.turno || '-'}</p></div>
                      <div><p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Taller</p><p className="font-bold text-slate-800 text-sm mt-1">{student.taller || '-'}</p></div>
                      <div>
                         <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Beca</p>
                         <p className={`font-bold text-sm mt-1 ${(String(student.tieneBeca || '').toUpperCase().trim().startsWith('S') || (student.nombreBeca && String(student.nombreBeca).trim() !== '' && String(student.nombreBeca).toUpperCase().trim() !== 'NO')) ? 'text-emerald-600' : 'text-slate-500'}`}>
                            {(String(student.tieneBeca || '').toUpperCase().trim().startsWith('S') || (student.nombreBeca && String(student.nombreBeca).trim() !== '' && String(student.nombreBeca).toUpperCase().trim() !== 'NO')) 
                              ? `SÍ - ${student.nombreBeca ? String(student.nombreBeca).toUpperCase().trim() : 'NO ESPECIFICADO'}` 
                              : 'NO'}
                         </p>
                      </div>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Información Personal */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <div className="flex items-center mb-6 border-b pb-3"><User className="w-6 h-6 mr-3 text-primary-500" /><h4 className="font-bold text-xl text-slate-800">Información Personal y Antecedentes</h4></div>
                  <div className="space-y-3.5 text-sm">
                    <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">CURP</span><span className="font-bold text-slate-700 uppercase tracking-widest">{student.curp}</span></div>
                    <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Género</span><span className="font-bold text-slate-700">{student.genero}</span></div>
                    <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Fecha Nacimiento</span><span className="font-bold text-slate-700">{student.fechaNacimiento}</span></div>
                    <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Nacionalidad</span><span className="font-bold text-slate-700">{student.nacionalidad || 'MEXICANA'}</span></div>
                    <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Lengua Indígena</span><span className="font-bold text-slate-700">{student.lenguaIndigena === 'SÍ' ? `SÍ (${student.nombreLenguaIndigena || 'Especificada'})` : 'NO'}</span></div>
                    <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Repetidor de Grado</span><span className="font-bold text-slate-700">{student.repetidor || 'NO'}</span></div>
                    <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Escuela Procedencia</span><span className="font-bold text-slate-700 text-right">{student.escuelaProcedencia || '-'}</span></div>
                    {(student.promedioEscuela || student.domicilioEscuela) && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Promedio / Dom. Esc.</span>
                        <span className="font-bold text-slate-700 text-right">{student.promedioEscuela ? `Prom: ${student.promedioEscuela}` : ''} {student.domicilioEscuela ? `(${student.domicilioEscuela})` : ''}</span>
                      </div>
                    )}
                    <div className="pt-3 border-t border-slate-100">
                      <span className="text-slate-500 font-medium block mb-2">Domicilio Completo</span>
                      <p className="font-semibold text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">{student.calle} #{student.numero}, Col. {student.colonia}, C.P. {student.cp || student.codigoPostal}</p>
                    </div>
                  </div>
                </div>

                {/* Salud */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <div className="flex items-center mb-6 border-b pb-3"><Heart className="w-6 h-6 mr-3 text-sky-500" /><h4 className="font-bold text-xl text-slate-800">Ficha Médica e Inclusión</h4></div>
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Tipo de Sangre</span><span className="font-black text-sky-600 text-lg">{student.tipoSangre || 'NO ESPECIFICADO'}</span></div>
                    <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Usa Lentes</span><span className="font-bold text-slate-700">{student.lentes || 'NO'}</span></div>
                    <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Discapacidad / Condición</span><span className="font-bold text-slate-700">{student.discapacidad || 'Ninguna'}</span></div>
                    <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">USAER</span><span className="font-bold text-slate-700">{student.usaer || 'NO'}</span></div>
                    <div className="pt-2">
                      <span className="text-slate-500 font-medium block mb-2">Alergias Reportadas</span>
                      <p className="font-bold text-sky-800 bg-sky-50 p-3 rounded-lg border border-sky-100">{student.alergias || 'Ninguna'}</p>
                    </div>
                    <div className="pt-2">
                      <span className="text-slate-500 font-medium block mb-2">Padecimientos Crónicos</span>
                      <p className="font-bold text-sky-800 bg-sky-50 p-3 rounded-lg border border-sky-100">{student.padecimientos || 'Ninguno'}</p>
                    </div>
                  </div>
                </div>
                
                {/* Contactos */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2">
                    <div className="flex items-center mb-6 border-b pb-3"><Users className="w-6 h-6 mr-3 text-indigo-500" /><h4 className="font-bold text-xl text-slate-800">Contactos y Red de Apoyo</h4></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                       <div className="bg-indigo-50/50 p-5 rounded-xl border border-indigo-100 shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                          <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-3">Tutor Principal</p>
                          <p className="font-bold text-lg text-slate-800 mb-1">{student.tutorNombre || student.tutor}</p>
                          <p className="text-indigo-600 font-medium mb-3">{student.tutorParentesco}</p>
                          <div className="bg-white p-2 rounded border border-indigo-100">
                             <p className="font-bold text-slate-700">📞 {student.telefono || student.celularTutor}</p>
                             {student.correo && <p className="text-slate-500 mt-1 text-xs truncate">✉️ {student.correo}</p>}
                          </div>
                       </div>
                       
                       {(student.emergenciaNombre1 || student.emergenciaNombre2 || student.referencia1 || student.referencia2) && (
                         <>
                           <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Emergencia 1</p>
                              <p className="font-bold text-slate-800 mb-1">{student.emergenciaNombre1 || student.referencia1 || 'N/A'}</p>
                              <p className="text-slate-500 mb-3">{student.emergenciaParentesco1 || '-'}</p>
                              <p className="font-bold text-slate-700 bg-white p-2 rounded border">📞 {student.emergenciaTel1 || student.celularRef1 || '-'}</p>
                           </div>
                           <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Emergencia 2</p>
                              <p className="font-bold text-slate-800 mb-1">{student.emergenciaNombre2 || student.referencia2 || 'N/A'}</p>
                              <p className="text-slate-500 mb-3">{student.emergenciaParentesco2 || '-'}</p>
                              <p className="font-bold text-slate-700 bg-white p-2 rounded border">📞 {student.emergenciaTel2 || student.celularRef2 || '-'}</p>
                           </div>
                         </>
                       )}
                    </div>
                </div>
              </div>

              {/* 6. Boleta de Calificaciones (Solo Lectura) */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mt-6">
                <div className="flex items-center mb-6 border-b pb-3">
                  <h4 className="font-bold text-xl text-slate-800">Historial Académico y Calificaciones</h4>
                </div>

                {/* Ciclo Actual */}
                <div className="mb-8">
                  <h5 className="font-bold text-lg text-slate-700 mb-4 bg-slate-100 p-2 rounded">Ciclo Actual ({student.grado})</h5>
                  {(() => {
                    const materias = materiasPorGrado[student.grado] || [];
                    if (materias.length === 0) return <p className="text-sm text-slate-500">No hay materias configuradas para este grado.</p>;
                    
                    const califs = student.calificaciones || {};
                    let sumT1 = 0, sumT2 = 0, sumT3 = 0;
                    let countT1 = 0, countT2 = 0, countT3 = 0;
                    let hasReprobada = false;

                    // First pass to check reprobadas
                    materias.forEach(mat => {
                      const t1 = califs['t1']?.[mat.id] ?? califs['T1']?.[mat.id];
                      const t2 = califs['t2']?.[mat.id] ?? califs['T2']?.[mat.id];
                      const t3 = califs['t3']?.[mat.id] ?? califs['T3']?.[mat.id];
                      if (t1 !== undefined && Number(t1) < 6) hasReprobada = true;
                      if (t2 !== undefined && Number(t2) < 6) hasReprobada = true;
                      if (t3 !== undefined && Number(t3) < 6) hasReprobada = true;
                    });

                    const renderCell = (val) => {
                      if (val === undefined || val === null || val === '') return '-';
                      const num = Number(val);
                      return <span className={num < 6 ? 'text-sky-600 font-bold bg-sky-50 px-2 py-1 rounded' : ''}>{num.toFixed(1)}</span>;
                    };

                    return (
                      <>
                        {hasReprobada && (
                          <div className="mb-4 bg-sky-100 text-sky-800 p-3 rounded-lg text-sm font-semibold flex items-center border border-sky-200">
                            <span className="mr-2 text-xl">⚠️</span> Este alumno tiene calificaciones reprobadas (menores a 6.0) en el ciclo actual.
                          </div>
                        )}
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50">
                                <th className="border p-3 font-semibold text-slate-600">Materia</th>
                                <th className="border p-3 text-center font-semibold text-slate-600 w-24">T1</th>
                                <th className="border p-3 text-center font-semibold text-slate-600 w-24">T2</th>
                                <th className="border p-3 text-center font-semibold text-slate-600 w-24">T3</th>
                                <th className="border p-3 text-center font-bold text-slate-700 w-24 bg-slate-100">Final</th>
                              </tr>
                            </thead>
                            <tbody>
                              {materias.map(mat => {
                                const t1 = califs['t1']?.[mat.id] ?? califs['T1']?.[mat.id];
                                const t2 = califs['t2']?.[mat.id] ?? califs['T2']?.[mat.id];
                                const t3 = califs['t3']?.[mat.id] ?? califs['T3']?.[mat.id];
                                
                                if (t1 !== undefined) { sumT1 += Number(t1); countT1++; }
                                if (t2 !== undefined) { sumT2 += Number(t2); countT2++; }
                                if (t3 !== undefined) { sumT3 += Number(t3); countT3++; }

                                let promedioFinal = '-';
                                let numProm = 0;
                                let countProm = 0;
                                if (t1 !== undefined) { numProm += Number(t1); countProm++; }
                                if (t2 !== undefined) { numProm += Number(t2); countProm++; }
                                if (t3 !== undefined) { numProm += Number(t3); countProm++; }
                                
                                if (countProm > 0) {
                                  promedioFinal = (numProm / countProm).toFixed(1);
                                }

                                return (
                                  <tr key={mat.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="border p-3 text-slate-700 font-medium">{mat.name}</td>
                                    <td className="border p-3 text-center">{renderCell(t1)}</td>
                                    <td className="border p-3 text-center">{renderCell(t2)}</td>
                                    <td className="border p-3 text-center">{renderCell(t3)}</td>
                                    <td className="border p-3 text-center bg-slate-50">{renderCell(promedioFinal !== '-' ? promedioFinal : undefined)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot>
                              <tr className="bg-slate-100 font-bold">
                                <td className="border p-3 text-right">PROMEDIO GENERAL</td>
                                <td className="border p-3 text-center text-primary-700">{countT1 > 0 ? renderCell((sumT1 / countT1)) : '-'}</td>
                                <td className="border p-3 text-center text-primary-700">{countT2 > 0 ? renderCell((sumT2 / countT2)) : '-'}</td>
                                <td className="border p-3 text-center text-primary-700">{countT3 > 0 ? renderCell((sumT3 / countT3)) : '-'}</td>
                                <td className="border p-3 text-center text-emerald-700 bg-emerald-50">
                                  {countT1 > 0 || countT2 > 0 || countT3 > 0 ? renderCell(((sumT1 + sumT2 + sumT3) / (countT1 + countT2 + countT3))) : '-'}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Historial Años Anteriores */}
                {['1er Grado', '2do Grado', '3er Grado'].map(gradoKey => {
                  if (gradoKey === student.grado) return null; // Ya se muestra arriba
                  if (student.grado === '1er Grado') return null;
                  if (student.grado === '2do Grado' && gradoKey === '3er Grado') return null;
                  
                  const materias = materiasPorGrado[gradoKey] || [];
                  if (materias.length === 0) return null;
                  const hist = student.historial?.[gradoKey] || {};
                  
                  // Verificar si tiene al menos una calificacion
                  const hasAnyGrade = materias.some(mat => hist[mat.id]?.t1 || hist[mat.id]?.t2 || hist[mat.id]?.t3);
                  if (!hasAnyGrade) return null;

                  return (
                    <div key={gradoKey} className="mb-8">
                      <h5 className="font-bold text-lg text-slate-700 mb-4 bg-slate-50 border p-2 rounded">Kárdex Anterior ({gradoKey})</h5>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50">
                              <th className="border p-2 font-semibold text-slate-600">Materia</th>
                              <th className="border p-2 text-center font-semibold text-slate-600 w-20">T1</th>
                              <th className="border p-2 text-center font-semibold text-slate-600 w-20">T2</th>
                              <th className="border p-2 text-center font-semibold text-slate-600 w-20">T3</th>
                              <th className="border p-2 text-center font-bold text-slate-700 w-20 bg-slate-100">Final</th>
                            </tr>
                          </thead>
                          <tbody>
                            {materias.map(mat => {
                              const t1 = hist[mat.id]?.t1;
                              const t2 = hist[mat.id]?.t2;
                              const t3 = hist[mat.id]?.t3;
                              
                              let numProm = 0;
                              let countProm = 0;
                              if (t1 !== undefined && t1 !== '') { numProm += Number(t1); countProm++; }
                              if (t2 !== undefined && t2 !== '') { numProm += Number(t2); countProm++; }
                              if (t3 !== undefined && t3 !== '') { numProm += Number(t3); countProm++; }
                              
                              const promedioFinal = countProm > 0 ? (numProm / countProm).toFixed(1) : '-';

                              const renderCell = (val) => {
                                if (val === undefined || val === null || val === '') return '-';
                                const num = Number(val);
                                return <span className={num < 6 ? 'text-sky-600 font-bold bg-sky-50 px-1 rounded' : ''}>{num.toFixed(1)}</span>;
                              };

                              return (
                                <tr key={mat.id} className="hover:bg-slate-50">
                                  <td className="border p-2 text-slate-700">{mat.name}</td>
                                  <td className="border p-2 text-center">{renderCell(t1)}</td>
                                  <td className="border p-2 text-center">{renderCell(t2)}</td>
                                  <td className="border p-2 text-center">{renderCell(t3)}</td>
                                  <td className="border p-2 text-center bg-slate-50 font-medium">{renderCell(promedioFinal !== '-' ? promedioFinal : undefined)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}

                  {/* 7. Exámenes Extraordinarios (Solo Lectura) */}
                  {extraordinarios.length > 0 && (
                    <div className="mb-8">
                      <h5 className="font-bold text-lg text-slate-700 mb-4 bg-slate-50 border p-2 rounded">Exámenes Extraordinarios</h5>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50">
                              <th className="border p-2 font-semibold text-slate-600">Materia</th>
                              <th className="border p-2 text-center font-semibold text-slate-600 w-24">Calificación</th>
                              <th className="border p-2 text-center font-semibold text-slate-600 w-32">Fecha</th>
                              <th className="border p-2 text-center font-semibold text-slate-600 w-32">Periodo</th>
                              <th className="border p-2 text-center font-semibold text-slate-600 w-24">Constancia</th>
                            </tr>
                          </thead>
                          <tbody>
                            {extraordinarios.map(extra => (
                              <tr key={extra.id} className="hover:bg-slate-50">
                                <td className="border p-2 text-slate-700 font-bold">{extra.materia}</td>
                                <td className="border p-2 text-center text-emerald-600 font-bold">{extra.calificacion}</td>
                                <td className="border p-2 text-center">{extra.fecha}</td>
                                <td className="border p-2 text-center">{extra.periodo}</td>
                                <td className="border p-2 text-center">
                                  <button 
                                    type="button" 
                                    onClick={() => {
                                      setPrintExtraordinarioSelected(extra);
                                      setShowPrintMode(true);
                                    }}
                                    className="p-1.5 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded transition-colors"
                                    title="Imprimir Constancia"
                                  >
                                    <Printer className="w-4 h-4 mx-auto" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        
        {/* Footer */}
        {isEditing && (
          <div className="px-6 py-4 border-t border-slate-200 bg-white rounded-b-2xl flex justify-end space-x-3 sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
             <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-3 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition">Cancelar</button>
             <button type="submit" form="edit-student-form" disabled={saving} className="flex items-center px-8 py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-50 shadow-md transition transform hover:-translate-y-0.5">
               <Save className="w-5 h-5 mr-2" /> {saving ? 'Guardando...' : 'Guardar Cambios Oficiales'}
             </button>
          </div>
        )}
      </div>
    </div>
  );
}
