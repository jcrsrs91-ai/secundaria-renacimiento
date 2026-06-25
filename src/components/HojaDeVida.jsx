import { useState, useRef, useEffect } from 'react';
import { X, Save, Edit, User, Heart, Users, Camera, StopCircle, Printer } from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import HojaInscripcionPrint from './HojaInscripcionPrint';

export default function HojaDeVida({ student, onClose, onSave }) {
  const [showPrintMode, setShowPrintMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [grupo, setGrupo] = useState(student.grupo || '');
  const [taller, setTaller] = useState(student.taller || '');

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
    'F': 'Ofimática (6031)'
  };

  const handleGrupoChange = (e) => {
    const val = e.target.value;
    setGrupo(val);
    if (talleresMap[val]) {
      setTaller(talleresMap[val]);
    }
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
        await updateDoc(docRef, { fotoUrl: dataUrl });
        // alert("Fotografía guardada exitosamente.");
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
    
    try {
      const docRef = doc(db, "students", student.id);
      await updateDoc(docRef, data);
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
          <button onClick={() => setShowPrintMode(false)} className="text-gray-500 font-bold hover:text-gray-800 flex items-center bg-gray-200 px-4 py-2 rounded-lg">
             ← Volver al Expediente
          </button>
        </div>
        <div className="py-8">
          <HojaInscripcionPrint data={student} />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-100 rounded-2xl shadow-2xl max-w-5xl w-full my-8 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white rounded-t-2xl sticky top-0 z-10 shadow-sm">
          <div className="flex items-center space-x-3">
            <h2 className="font-extrabold text-2xl text-slate-800">Hoja de Vida del Alumno</h2>
            <span className="bg-primary-100 text-primary-800 text-xs font-bold px-3 py-1 rounded-full">{student.matricula}</span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              student.status === 'Activo' ? 'bg-emerald-100 text-emerald-800' :
              student.status === 'Baja' ? 'bg-rose-100 text-rose-800' :
              student.status === 'Egresado' ? 'bg-blue-100 text-blue-800' :
              'bg-amber-100 text-amber-800'
            }`}>{student.status || 'Activo'}</span>
          </div>
          <div className="flex space-x-2">
            <button onClick={() => setShowPrintMode(true)} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm transition">
              <Printer className="w-4 h-4 mr-2" /> Ficha de Inscripción
            </button>
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} className="flex items-center px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 shadow-sm transition">
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
                
                {/* 1. Datos Académicos */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4">Datos Académicos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500">Matrícula</label>
                      <input type="text" name="matricula" defaultValue={student.matricula} className="mt-1 w-full p-2 border rounded font-bold text-indigo-700 bg-indigo-50" />
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
                        <option value="A" translate="no">A</option><option value="B" translate="no">B</option><option value="C" translate="no">C</option><option value="D" translate="no">D</option><option value="E" translate="no">E</option><option value="F" translate="no">F</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500">Turno</label>
                      <select name="turno" defaultValue={student.turno} className="mt-1 w-full p-2 border rounded" required>
                        <option>Matutino</option><option>Vespertino</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500">Taller / Tecnología</label>
                      <input type="text" name="taller" value={taller} onChange={(e) => setTaller(e.target.value)} className="mt-1 w-full p-2 border rounded" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500">Estatus</label>
                      <select name="status" defaultValue={student.status || 'Activo'} className="mt-1 w-full p-2 border rounded" required>
                        <option value="Activo">Activo</option>
                        <option value="Baja">Baja</option>
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
                  </div>
                </div>

                {/* 2. Datos Personales */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4">Datos Personales</h3>
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
                      <input type="text" name="curp" defaultValue={student.curp} className="mt-1 w-full p-2 border rounded uppercase" />
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
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-slate-500">Calle y Número</label>
                      <div className="flex gap-2">
                        <input type="text" name="calle" defaultValue={student.calle} className="mt-1 flex-1 p-2 border rounded" />
                        <input type="text" name="numero" defaultValue={student.numero} className="mt-1 w-24 p-2 border rounded" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500">Colonia y C.P.</label>
                      <div className="flex gap-2">
                        <input type="text" name="colonia" defaultValue={student.colonia} className="mt-1 flex-1 p-2 border rounded" />
                        <input type="text" name="cp" defaultValue={student.cp} className="mt-1 w-24 p-2 border rounded" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Salud */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4">Información Médica</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500">Tipo de Sangre</label>
                      <input type="text" name="tipoSangre" defaultValue={student.tipoSangre} className="mt-1 w-full p-2 border rounded" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500">Usa Lentes</label>
                      <select name="lentes" defaultValue={student.lentes || 'NO'} className="mt-1 w-full p-2 border rounded">
                        <option value="NO">NO</option><option value="SÍ">SÍ</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-slate-500">Alergias</label>
                      <input type="text" name="alergias" defaultValue={student.alergias} className="mt-1 w-full p-2 border rounded" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-slate-500">Padecimientos Crónicos</label>
                      <input type="text" name="padecimientos" defaultValue={student.padecimientos} className="mt-1 w-full p-2 border rounded" />
                    </div>
                  </div>
                </div>

                {/* 4. Contactos */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4">Contactos</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded border">
                      <div className="md:col-span-2"><label className="block text-xs font-bold text-slate-600 mb-1">Tutor Principal</label><input type="text" name="tutorNombre" defaultValue={student.tutorNombre} className="w-full p-2 border rounded" /></div>
                      <div><label className="block text-xs font-bold text-slate-600 mb-1">Parentesco</label><input type="text" name="tutorParentesco" defaultValue={student.tutorParentesco} className="w-full p-2 border rounded" /></div>
                      <div><label className="block text-xs font-bold text-slate-600 mb-1">Teléfono</label><input type="text" name="telefono" defaultValue={student.telefono} className="w-full p-2 border rounded" /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded">
                      <div className="md:col-span-2"><label className="block text-xs font-medium text-slate-500 mb-1">Emergencia 1</label><input type="text" name="emergenciaNombre1" defaultValue={student.emergenciaNombre1} className="w-full p-2 border rounded" /></div>
                      <div><label className="block text-xs font-medium text-slate-500 mb-1">Parentesco 1</label><input type="text" name="emergenciaParentesco1" defaultValue={student.emergenciaParentesco1} className="w-full p-2 border rounded" /></div>
                      <div><label className="block text-xs font-medium text-slate-500 mb-1">Teléfono 1</label><input type="text" name="emergenciaTel1" defaultValue={student.emergenciaTel1} className="w-full p-2 border rounded" /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded">
                      <div className="md:col-span-2"><label className="block text-xs font-medium text-slate-500 mb-1">Emergencia 2</label><input type="text" name="emergenciaNombre2" defaultValue={student.emergenciaNombre2} className="w-full p-2 border rounded" /></div>
                      <div><label className="block text-xs font-medium text-slate-500 mb-1">Parentesco 2</label><input type="text" name="emergenciaParentesco2" defaultValue={student.emergenciaParentesco2} className="w-full p-2 border rounded" /></div>
                      <div><label className="block text-xs font-medium text-slate-500 mb-1">Teléfono 2</label><input type="text" name="emergenciaTel2" defaultValue={student.emergenciaTel2} className="w-full p-2 border rounded" /></div>
                    </div>
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
                         <button onClick={cancelCamera} type="button" className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded shadow hover:bg-rose-700">
                           <X className="w-3 h-3" />
                         </button>
                       </div>
                     ) : (
                       <button onClick={startCamera} type="button" className="px-4 py-1.5 bg-slate-800 text-white text-xs font-bold rounded shadow hover:bg-slate-900 flex items-center">
                         <Camera className="w-3 h-3 mr-1.5" /> Tomar Foto
                       </button>
                     )}
                   </div>
                 </div>

                 <div className="flex-1 text-center md:text-left relative z-10 mt-2 md:mt-12 w-full">
                    <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{student.apellidoPaterno} {student.apellidoMaterno}</h3>
                    <h4 className="text-xl font-medium text-slate-600 uppercase mb-6">{student.nombres}</h4>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div><p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Grado</p><p className="font-bold text-slate-800 text-lg">{student.grado}</p></div>
                      <div><p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Grupo</p><p className="font-bold text-primary-700 text-lg">{student.grupo || 'Por Asignar'}</p></div>
                      <div><p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Turno</p><p className="font-bold text-slate-800 text-lg">{student.turno || '-'}</p></div>
                      <div><p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Taller</p><p className="font-bold text-slate-800 text-sm mt-1">{student.taller || '-'}</p></div>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Información Personal */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <div className="flex items-center mb-6 border-b pb-3"><User className="w-6 h-6 mr-3 text-primary-500" /><h4 className="font-bold text-xl text-slate-800">Información Personal</h4></div>
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">CURP</span><span className="font-bold text-slate-700 uppercase tracking-widest">{student.curp}</span></div>
                    <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Género</span><span className="font-bold text-slate-700">{student.genero}</span></div>
                    <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Fecha Nacimiento</span><span className="font-bold text-slate-700">{student.fechaNacimiento}</span></div>
                    <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Escuela Procedencia</span><span className="font-bold text-slate-700 text-right">{student.escuelaProcedencia || '-'}</span></div>
                    <div className="pt-4 border-t border-slate-100">
                      <span className="text-slate-500 font-medium block mb-2">Domicilio Completo</span>
                      <p className="font-semibold text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">{student.calle} #{student.numero}, Col. {student.colonia}, C.P. {student.cp}</p>
                    </div>
                  </div>
                </div>

                {/* Salud */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <div className="flex items-center mb-6 border-b pb-3"><Heart className="w-6 h-6 mr-3 text-rose-500" /><h4 className="font-bold text-xl text-slate-800">Ficha Médica</h4></div>
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Tipo de Sangre</span><span className="font-black text-rose-600 text-lg">{student.tipoSangre}</span></div>
                    <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Usa Lentes</span><span className="font-bold text-slate-700">{student.lentes}</span></div>
                    <div className="pt-2">
                      <span className="text-slate-500 font-medium block mb-2">Alergias Reportadas</span>
                      <p className="font-bold text-rose-800 bg-rose-50 p-3 rounded-lg border border-rose-100">{student.alergias}</p>
                    </div>
                    <div className="pt-2">
                      <span className="text-slate-500 font-medium block mb-2">Padecimientos Crónicos</span>
                      <p className="font-bold text-rose-800 bg-rose-50 p-3 rounded-lg border border-rose-100">{student.padecimientos}</p>
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
                          <p className="font-bold text-lg text-slate-800 mb-1">{student.tutorNombre}</p>
                          <p className="text-indigo-600 font-medium mb-3">{student.tutorParentesco}</p>
                          <div className="bg-white p-2 rounded border border-indigo-100">
                             <p className="font-bold text-slate-700">📞 {student.telefono}</p>
                             {student.correo && <p className="text-slate-500 mt-1 text-xs truncate">✉️ {student.correo}</p>}
                          </div>
                       </div>
                       
                       {(student.emergenciaNombre1 || student.emergenciaNombre2) && (
                         <>
                           <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Emergencia 1</p>
                              <p className="font-bold text-slate-800 mb-1">{student.emergenciaNombre1 || 'N/A'}</p>
                              <p className="text-slate-500 mb-3">{student.emergenciaParentesco1 || '-'}</p>
                              <p className="font-bold text-slate-700 bg-white p-2 rounded border">📞 {student.emergenciaTel1 || '-'}</p>
                           </div>
                           <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Emergencia 2</p>
                              <p className="font-bold text-slate-800 mb-1">{student.emergenciaNombre2 || 'N/A'}</p>
                              <p className="text-slate-500 mb-3">{student.emergenciaParentesco2 || '-'}</p>
                              <p className="font-bold text-slate-700 bg-white p-2 rounded border">📞 {student.emergenciaTel2 || '-'}</p>
                           </div>
                         </>
                       )}
                    </div>
                </div>
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
