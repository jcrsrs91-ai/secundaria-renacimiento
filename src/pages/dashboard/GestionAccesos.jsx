import { useState, useEffect } from 'react';
import { collection, query, getDocs, setDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Key, Plus, Trash2, Check, X, ShieldAlert, Edit2, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';
import { autoAcentuar } from '../../utils/format';
import { registrarMovimiento } from '../../utils/bitacora';
import { useAuth } from '../../context/AuthContext';

const AVAILABLE_PERMISSIONS = [
  { id: 'portal-docente', label: 'Portal Docente (Captura de Calificaciones)' },
  { id: 'control-escolar', label: 'Control Escolar' },
  { id: 'coordinacion', label: 'Coordinación Académica' },
  { id: 'asistencia', label: 'Prefectura / Asistencia' },
  { id: 'trabajo-social', label: 'Trabajo Social' },
  { id: 'contraloria', label: 'Contraloría' },
  { id: 'biblioteca', label: 'Biblioteca' },
  { id: 'impresion-documentos', label: 'Impresión de Documentos' },
  { id: 'avisos', label: 'Avisos Escolares' },
  { id: 'buzon', label: 'Buzón de Tutores' },
  { id: 'accesos', label: 'Gestión de Accesos (Super Admin)' }
];

export default function GestionAccesos() {
  const { currentUser } = useAuth();
  const [allowedEmails, setAllowedEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [role, setRole] = useState('docente');
  const [selectedPermissions, setSelectedPermissions] = useState(['portal-docente']);

  useEffect(() => {
    fetchAllowedEmails();
  }, []);

  const fetchAllowedEmails = async () => {
    try {
      const q = query(collection(db, 'allowed_emails'));
      const snapshot = await getDocs(q);
      const emailsData = snapshot.docs.map(docSnap => ({ email: docSnap.id, ...docSnap.data() }));
      setAllowedEmails(emailsData);
    } catch (error) {
      console.error("Error fetching allowed emails:", error);
      toast.error('Error al cargar la lista de accesos');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setIsEditing(true);
      setEmail(item.email || '');
      setNombre(item.nombre || '');
      setRole(item.role || 'staff');
      setSelectedPermissions(item.permissions || []);
    } else {
      setIsEditing(false);
      setEmail('');
      setNombre('');
      setRole('docente');
      setSelectedPermissions(['portal-docente']);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
  };

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    if (newRole === 'docente') {
      setSelectedPermissions(['portal-docente']);
    } else if (newRole === 'coordinacion') {
      setSelectedPermissions(['coordinacion', 'portal-docente']);
    }
  };

  const togglePermission = (permId) => {
    if (selectedPermissions.includes(permId)) {
      setSelectedPermissions(selectedPermissions.filter(p => p !== permId));
    } else {
      setSelectedPermissions([...selectedPermissions, permId]);
    }
  };

  const selectAll = () => {
    setSelectedPermissions(AVAILABLE_PERMISSIONS.map(p => p.id));
  };

  const deselectAll = () => {
    setSelectedPermissions([]);
  };

  const setSoloDocente = () => {
    setRole('docente');
    setSelectedPermissions(['portal-docente']);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.includes('@')) {
      toast.error('Ingresa un correo electrónico válido');
      return;
    }
    if (selectedPermissions.length === 0) {
      toast.error('Selecciona al menos un módulo permitido');
      return;
    }

    try {
      const emailKey = email.toLowerCase().trim();
      await setDoc(doc(db, 'allowed_emails', emailKey), {
        email: emailKey,
        nombre: nombre.trim(),
        role: role,
        permissions: selectedPermissions,
        updatedAt: serverTimestamp(),
        ...(isEditing ? {} : { createdAt: serverTimestamp(), status: 'pending' })
      }, { merge: true });

      await registrarMovimiento(
        currentUser?.email,
        'Gestión de Accesos',
        isEditing ? 'Editar Permisos Usuario' : 'Autorizar Nuevo Usuario',
        `${isEditing ? 'Actualizó permisos de' : 'Dio de alta a'} ${nombre.trim() || emailKey} (${emailKey}) con rol: ${role} [${selectedPermissions.join(', ')}]`
      );
      toast.success(isEditing ? 'Permisos actualizados correctamente' : 'Acceso autorizado correctamente');
      closeModal();
      fetchAllowedEmails();
    } catch (error) {
      console.error("Error saving allowed email:", error);
      toast.error('Error al autorizar el correo');
    }
  };

  const handleDelete = async (emailKey) => {
    if (window.confirm(`¿Estás seguro de revocar el acceso a ${emailKey}?`)) {
      try {
        await deleteDoc(doc(db, 'allowed_emails', emailKey));
        await registrarMovimiento(
          currentUser?.email,
          'Gestión de Accesos',
          'Revocar Acceso',
          `Revocó el acceso del usuario ${emailKey}`
        );
        toast.success('Acceso revocado');
        fetchAllowedEmails();
      } catch (error) {
        console.error("Error deleting allowed email:", error);
        toast.error('Error al revocar acceso');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center">
            <Key className="mr-2 text-primary-600" />
            Gestión de Accesos (Personal y Docentes)
          </h2>
          <p className="text-slate-500 mt-1">Autoriza correos y asigna módulos exclusivos para maestros o personal administrativo.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm font-semibold"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nuevo Acceso (Docente / Personal)
        </button>
      </div>

      <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 flex items-start gap-3">
        <ShieldAlert className="w-6 h-6 text-sky-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-sky-900">¿Cómo dar de alta a un Maestro para capturar calificaciones?</h4>
          <p className="text-sm text-sky-700 mt-1">
            1. Haz clic en <strong>"Nuevo Acceso"</strong>, escribe el nombre y correo del maestro y deja seleccionado el rol <strong>"Docente (Solo Calificaciones)"</strong>.<br/>
            2. Pídele al maestro que entre por única vez a <strong>web-tec-68.web.app/registro-staff</strong> con ese correo para crear su contraseña.<br/>
            3. Al iniciar sesión, el maestro <strong>solo verá el módulo "Portal Docente (Calificaciones)"</strong> para subir sus calificaciones e imprimir sus cuadros para Coordinación.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Cargando lista de accesos...</div>
        ) : allowedEmails.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No hay correos autorizados. Haz clic en "Nuevo Acceso" para agregar uno.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <th className="px-6 py-3 font-medium text-sm">Nombre / Docente</th>
                  <th className="px-6 py-3 font-medium text-sm">Correo Autorizado</th>
                  <th className="px-6 py-3 font-medium text-sm">Rol</th>
                  <th className="px-6 py-3 font-medium text-sm">Módulos Permitidos</th>
                  <th className="px-6 py-3 font-medium text-sm text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allowedEmails.map((item) => (
                  <tr key={item.email} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {item.nombre || <span className="text-slate-400 font-normal italic">Se registrará al crear cuenta</span>}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">{item.email}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                        item.role === 'docente'
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : item.role === 'coordinacion'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {item.role === 'docente' ? 'Docente' : item.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      <div className="flex flex-wrap gap-1 max-w-md">
                        {item.permissions?.map(p => {
                          const permLabel = AVAILABLE_PERMISSIONS.find(ap => ap.id === p)?.label || p;
                          return (
                            <span
                              key={p}
                              className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                p === 'portal-docente'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {permLabel}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1">
                      <button
                        onClick={() => openModal(item)}
                        className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Editar Permisos / Nombre"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.email)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Revocar Acceso"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl my-8">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <h3 className="text-lg font-bold text-slate-800">
                {isEditing ? 'Editar Acceso y Permisos' : 'Autorizar Nuevo Acceso'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Maestro o Personal</label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(autoAcentuar(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Ej. Profr. Carlos Gómez"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Rol en el Plantel</label>
                  <select
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 bg-white focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="docente">Docente (Solo Calificaciones)</option>
                    <option value="coordinacion">Coordinación Académica</option>
                    <option value="staff">Secretaría / Administrativo</option>
                    <option value="admin">Administrador General</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  disabled={isEditing}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-slate-100 disabled:text-slate-500"
                  placeholder="maestro@correo.com"
                />
              </div>

              <div>
                <div className="flex flex-wrap justify-between items-end gap-2 mb-2">
                  <label className="block text-sm font-medium text-slate-700">Módulos Permitidos</label>
                  <div className="space-x-2 text-xs flex items-center">
                    <button
                      type="button"
                      onClick={setSoloDocente}
                      className="px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded font-bold hover:bg-indigo-100 flex items-center gap-1"
                    >
                      <GraduationCap className="w-3.5 h-3.5" /> Solo Captura Docente
                    </button>
                    <span className="text-slate-300">|</span>
                    <button type="button" onClick={selectAll} className="text-sky-600 hover:underline">Todos</button>
                    <span className="text-slate-300">|</span>
                    <button type="button" onClick={deselectAll} className="text-slate-500 hover:underline">Ninguno</button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-4 rounded-xl border border-slate-200 max-h-64 overflow-y-auto custom-scrollbar">
                  {AVAILABLE_PERMISSIONS.map(perm => {
                    const isChecked = selectedPermissions.includes(perm.id);
                    const isDocentePerm = perm.id === 'portal-docente';
                    return (
                      <label
                        key={perm.id}
                        className={`flex items-center space-x-2 cursor-pointer p-2 rounded-lg transition-colors border ${
                          isChecked
                            ? isDocentePerm
                              ? 'bg-emerald-50 border-emerald-300 font-semibold'
                              : 'bg-white border-primary-300 font-medium'
                            : 'border-transparent hover:bg-white hover:border-slate-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePermission(perm.id)}
                          className="rounded text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-slate-700 select-none">{perm.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center font-semibold shadow-sm"
                >
                  <Check className="h-4 w-4 mr-2" />
                  {isEditing ? 'Guardar Cambios' : 'Autorizar Correo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
