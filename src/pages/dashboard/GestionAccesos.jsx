import { useState, useEffect } from 'react';
import { collection, query, getDocs, setDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Key, Plus, Trash2, Check, X, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

const AVAILABLE_PERMISSIONS = [
  { id: 'control-escolar', label: 'Control Escolar' },
  { id: 'contraloria', label: 'Contraloría' },
  { id: 'trabajo-social', label: 'Trabajo Social' },
  { id: 'coordinacion', label: 'Coordinación Académica' },
  { id: 'asistencia', label: 'Prefectura / Asistencia' },
  { id: 'biblioteca', label: 'Biblioteca' },
  { id: 'impresion-documentos', label: 'Impresión de Documentos' },
  { id: 'avisos', label: 'Avisos Escolares' },
  { id: 'buzon', label: 'Buzón de Tutores' },
  { id: 'accesos', label: 'Gestión de Accesos (Super Admin)' }
];

export default function GestionAccesos() {
  const [allowedEmails, setAllowedEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('staff');
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  useEffect(() => {
    fetchAllowedEmails();
  }, []);

  const fetchAllowedEmails = async () => {
    try {
      const q = query(collection(db, 'allowed_emails'));
      const snapshot = await getDocs(q);
      const emailsData = snapshot.docs.map(doc => ({ email: doc.id, ...doc.data() }));
      setAllowedEmails(emailsData);
    } catch (error) {
      console.error("Error fetching allowed emails:", error);
      toast.error('Error al cargar la lista de accesos');
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setEmail('');
    setRole('staff');
    setSelectedPermissions([]);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.includes('@')) {
      toast.error('Ingresa un correo electrónico válido');
      return;
    }
    
    try {
      const emailKey = email.toLowerCase().trim();
      await setDoc(doc(db, 'allowed_emails', emailKey), {
        email: emailKey,
        role: role,
        permissions: selectedPermissions,
        createdAt: serverTimestamp(),
        status: 'pending' // pending until they register
      });
      
      toast.success('Acceso autorizado correctamente');
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
        // También idealmente deberíamos deshabilitar al usuario en Auth y borrar de 'users',
        // pero por ahora bloqueamos el login del frontend o futuros registros.
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center">
            <Key className="mr-2 text-primary-600" />
            Gestión de Accesos
          </h2>
          <p className="text-slate-500 mt-1">Autoriza correos y asigna módulos para el personal de la escuela.</p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nuevo Acceso
        </button>
      </div>

      <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 flex items-start gap-3">
        <ShieldAlert className="w-6 h-6 text-sky-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-sky-900">¿Cómo funciona?</h4>
          <p className="text-sm text-sky-700 mt-1">
            Agrega el correo electrónico de la persona a la que deseas darle acceso. Luego, asígnale las pestañas que podrá ver.
            Una vez agregado, dile a esa persona que ingrese a <strong>tu-escuela.com/registro-staff</strong> con su correo para que ella misma cree su contraseña.
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
                  <th className="px-6 py-3 font-medium text-sm">Correo Autorizado</th>
                  <th className="px-6 py-3 font-medium text-sm">Rol</th>
                  <th className="px-6 py-3 font-medium text-sm">Permisos Asignados</th>
                  <th className="px-6 py-3 font-medium text-sm text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allowedEmails.map((item) => (
                  <tr key={item.email} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-800">{item.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 capitalize">{item.role}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {item.permissions?.map(p => (
                          <span key={p} className="bg-slate-100 px-2 py-0.5 rounded text-[10px] uppercase font-bold text-slate-600">
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(item.email)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Revocar Acceso"
                      >
                        <Trash2 className="h-5 w-5" />
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
                Dar Nuevo Acceso
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="ejemplo@escuela.edu.mx"
                />
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-sm font-medium text-slate-700">Módulos Permitidos</label>
                  <div className="space-x-2 text-xs">
                    <button type="button" onClick={selectAll} className="text-sky-600 hover:underline">Seleccionar Todos</button>
                    <span className="text-slate-300">|</span>
                    <button type="button" onClick={deselectAll} className="text-slate-500 hover:underline">Ninguno</button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-4 rounded-xl border border-slate-200 h-64 overflow-y-auto custom-scrollbar">
                  {AVAILABLE_PERMISSIONS.map(perm => (
                    <label key={perm.id} className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                        className="rounded text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-slate-700 select-none">{perm.label}</span>
                    </label>
                  ))}
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
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Autorizar Correo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
