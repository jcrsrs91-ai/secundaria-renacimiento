import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ShieldCheck, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegistroStaff() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // 1. Verificar si el correo está autorizado en 'allowed_emails'
      const allowedDocRef = doc(db, 'allowed_emails', email.toLowerCase());
      const allowedDocSnap = await getDoc(allowedDocRef);
      
      if (!allowedDocSnap.exists()) {
        toast.error('Este correo no está autorizado para registrarse.');
        setLoading(false);
        return;
      }
      
      const permissionsData = allowedDocSnap.data();

      // 2. Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 3. Crear documento en 'users' con los permisos asignados
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        nombre: nombre,
        role: permissionsData.role || 'staff',
        permissions: permissionsData.permissions || [],
        createdAt: new Date()
      });

      toast.success('Cuenta creada exitosamente. Ingresando...');
      navigate('/panel');
    } catch (error) {
      console.error("Error al registrar:", error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Este correo ya tiene una cuenta registrada.');
      } else if (error.code === 'auth/weak-password') {
        toast.error('La contraseña debe tener al menos 6 caracteres.');
      } else {
        toast.error('Hubo un error al crear la cuenta.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex py-12 sm:px-6 lg:px-8 bg-cover bg-center relative" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop')" }}>
      <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-sm"></div>
      
      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center justify-center gap-6 px-4">
        <div className="mb-6 text-center text-white">
          <h2 className="text-3xl font-extrabold drop-shadow-md">
            Esc. Sec. Téc. N°68 <br/><span className="text-primary-400">"RENACIMIENTO"</span>
          </h2>
          <p className="mt-3 text-sm text-slate-300 font-light">
            Registro de Personal Autorizado
          </p>
        </div>

        <div className="w-full">
          <div className="glass shadow-2xl sm:rounded-2xl overflow-hidden bg-white/95 ring-1 ring-slate-900/5">
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                  <UserPlus className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Crear Contraseña</h3>
                <p className="text-sm text-slate-500 mt-2">
                  Ingresa tu correo autorizado para crear tu cuenta de acceso.
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Nombre Completo</label>
                  <div className="mt-1 relative">
                    <input
                      type="text"
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="Ej. Juan Pérez"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Correo Electrónico Autorizado</label>
                  <div className="mt-1 relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="admin@est68.edu.mx"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Crear Contraseña</label>
                  <div className="mt-1">
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="Mínimo 6 caracteres"
                      minLength={6}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verificando y Registrando...' : 'Completar Registro'}
                </button>
              </form>
            </div>
            <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 text-center">
              <Link to="/admin" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                ¿Ya tienes cuenta? Inicia sesión aquí
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
