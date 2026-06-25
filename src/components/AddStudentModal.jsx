import { useState } from 'react';
import { X, Save, User, GraduationCap, HeartPulse, Users } from 'lucide-react';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function AddStudentModal({ onClose }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Datos Personales
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    curp: '',
    fechaNacimiento: '',
    genero: '',
    
    // Datos Académicos
    matricula: '',
    grado: '',
    grupo: '',
    turno: '',
    escuelaProcedencia: '',
    promedioEscuela: '',
    
    // Datos Médicos
    tipoSangre: '',
    alergias: '',
    padecimientos: '',
    lentes: 'NO',
    
    // Datos del Tutor y Contacto
    tutorNombre: '',
    tutorParentesco: '',
    telefono: '',
    emergenciaNombre1: '',
    emergenciaTel1: '',
    emergenciaParentesco1: '',
    
    // Domicilio
    calle: '',
    numero: '',
    colonia: '',
    cp: ''
  });

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'curp' ? value.toUpperCase() : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombres || !formData.apellidoPaterno || !formData.grado || !formData.grupo) {
      toast.error('Por favor, completa al menos nombres, apellido paterno, grado y grupo.');
      return;
    }

    setLoading(true);
    const idToast = toast.loading('Guardando alumno...');

    try {
      const taller = getTallerPorGrupo(formData.grupo);
      
      await addDoc(collection(db, "students"), {
        ...formData,
        taller: taller,
        status: "Activo",
        fechaRegistro: serverTimestamp()
      });

      toast.success('Alumno agregado correctamente al Directorio Activo.', { id: idToast });
      onClose();
    } catch (error) {
      console.error('Error adding document: ', error);
      toast.error('Hubo un error al guardar el alumno.', { id: idToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Agregar Nuevo Alumno</h2>
            <p className="text-sm text-slate-500">Llena la información para registrar un alumno manualmente.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario Scrolleable */}
        <div className="p-6 overflow-y-auto flex-1">
          <form id="add-student-form" onSubmit={handleSubmit} className="space-y-8">
            
            {/* Sección 1: Personales */}
            <section>
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-primary-500" /> Datos Personales
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre(s) *</label>
                  <input type="text" name="nombres" required value={formData.nombres} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Apellido Paterno *</label>
                  <input type="text" name="apellidoPaterno" required value={formData.apellidoPaterno} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Apellido Materno</label>
                  <input type="text" name="apellidoMaterno" value={formData.apellidoMaterno} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">CURP</label>
                  <input type="text" name="curp" maxLength="18" value={formData.curp} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none uppercase" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Fecha de Nacimiento</label>
                  <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Género</label>
                  <select name="genero" value={formData.genero} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white">
                    <option value="">Seleccionar...</option>
                    <option value="Hombre">Hombre</option>
                    <option value="Mujer">Mujer</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Sección 2: Académicos */}
            <section>
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4 flex items-center">
                <GraduationCap className="w-5 h-5 mr-2 text-indigo-500" /> Datos Académicos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Matrícula</label>
                  <input type="text" name="matricula" value={formData.matricula} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Grado *</label>
                  <select name="grado" required value={formData.grado} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white">
                    <option value="">Seleccionar...</option>
                    <option value="1er Grado">1er Grado</option>
                    <option value="2do Grado">2do Grado</option>
                    <option value="3er Grado">3er Grado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Grupo *</label>
                  <select name="grupo" required value={formData.grupo} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white">
                    <option value="">Seleccionar...</option>
                    {['A','B','C','D','E','F'].map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Turno *</label>
                  <select name="turno" required value={formData.turno} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white">
                    <option value="">Seleccionar...</option>
                    <option value="Matutino">Matutino</option>
                    <option value="Vespertino">Vespertino</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Escuela de Procedencia</label>
                  <input type="text" name="escuelaProcedencia" value={formData.escuelaProcedencia} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Promedio Primaria</label>
                  <input type="number" step="0.1" name="promedioEscuela" value={formData.promedioEscuela} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
              </div>
            </section>

            {/* Sección 3: Tutor y Domicilio */}
            <section>
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-emerald-500" /> Tutor, Contacto y Domicilio
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre Completo del Tutor</label>
                  <input type="text" name="tutorNombre" value={formData.tutorNombre} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Parentesco</label>
                  <input type="text" name="tutorParentesco" value={formData.tutorParentesco} onChange={handleChange} placeholder="Ej. Madre" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Celular del Tutor</label>
                  <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Contacto Emergencia</label>
                  <input type="text" name="emergenciaNombre1" value={formData.emergenciaNombre1} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tel. Emergencia</label>
                  <input type="tel" name="emergenciaTel1" value={formData.emergenciaTel1} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Calle</label>
                  <input type="text" name="calle" value={formData.calle} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Número</label>
                  <input type="text" name="numero" value={formData.numero} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">C.P.</label>
                  <input type="text" name="cp" value={formData.cp} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Colonia</label>
                  <input type="text" name="colonia" value={formData.colonia} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
              </div>
            </section>

            {/* Sección 4: Médicos */}
            <section>
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4 flex items-center">
                <HeartPulse className="w-5 h-5 mr-2 text-rose-500" /> Datos Médicos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo de Sangre</label>
                  <input type="text" name="tipoSangre" value={formData.tipoSangre} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Alergias</label>
                  <input type="text" name="alergias" value={formData.alergias} onChange={handleChange} placeholder="Ninguna" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Usa Lentes</label>
                  <select name="lentes" value={formData.lentes} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white">
                    <option value="NO">NO</option>
                    <option value="SI">SÍ</option>
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Padecimientos Crónicos</label>
                  <input type="text" name="padecimientos" value={formData.padecimientos} onChange={handleChange} placeholder="Ninguno" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
              </div>
            </section>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors">
            Cancelar
          </button>
          <button 
            type="submit" 
            form="add-student-form" 
            disabled={loading}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg transition-colors flex items-center shadow-md disabled:opacity-70"
          >
            <Save className="w-5 h-5 mr-2" />
            {loading ? 'Guardando...' : 'Guardar Alumno'}
          </button>
        </div>

      </div>
    </div>
  );
}
