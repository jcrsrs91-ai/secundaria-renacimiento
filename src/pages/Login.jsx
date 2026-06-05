import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function Login() {
  const navigate = useNavigate();
  const { loginAsStudent } = useAuth();
  const [isStaffTab, setIsStaffTab] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Estados para Staff
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Estados para Tutores
  const [matricula, setMatricula] = useState('');
  const [curp, setCurp] = useState('');

  const handleStaffLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/panel');
    } catch (error) {
      setErrorMsg('Credenciales inválidas o cuenta no existe.');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const q = query(
        collection(db, "students"), 
        where("matricula", "==", matricula),
        where("curp", "==", curp)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setErrorMsg('Matrícula o CURP incorrectos, o el alumno aún no está activo.');
      } else {
        const studentDoc = querySnapshot.docs[0];
        loginAsStudent({ id: studentDoc.id, ...studentDoc.data() });
        navigate('/panel/portal-familiar');
      }
    } catch (error) {
      setErrorMsg('Error al consultar base de datos. ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop')" }}>
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"></div>
      
      <div className="relative sm:mx-auto sm:w-full sm:max-w-md z-10">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
          Esc. Sec. Téc. N°68 <br/><span className="text-primary-400">"RENACIMIENTO"</span>
        </h2>
        <p className="mt-2 text-center text-sm text-slate-300">
          Sistema Integral de Gestión Escolar
        </p>
      </div>

      <div className="relative mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="glass shadow sm:rounded-2xl overflow-hidden bg-white/95">
          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            <button 
              className={`flex-1 py-4 text-sm font-medium ${isStaffTab ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-600' : 'text-slate-500 hover:bg-slate-50'}`}
              onClick={() => setIsStaffTab(true)}
            >
              Personal Escolar
            </button>
            <button 
              className={`flex-1 py-4 text-sm font-medium ${!isStaffTab ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-600' : 'text-slate-500 hover:bg-slate-50'}`}
              onClick={() => setIsStaffTab(false)}
            >
              Tutores y Alumnos
            </button>
          </div>

          <div className="p-8">
            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 text-rose-600 text-sm rounded-lg border border-rose-200">
                {errorMsg}
              </div>
            )}

            {isStaffTab ? (
              <form className="space-y-6" onSubmit={handleStaffLogin}>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Correo Institucional</label>
                  <input type="email" required className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-primary-500" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Contraseña</label>
                  <input type="password" required className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-primary-500" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                <button type="submit" disabled={loading} className="w-full flex justify-center py-2.5 px-4 rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50">
                  {loading ? 'Entrando...' : 'Ingresar al Panel'}
                </button>
              </form>
            ) : (
              <form className="space-y-6" onSubmit={handleStudentLogin}>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Matrícula Escolar</label>
                  <input type="text" placeholder="Ej. 2024EST68001" required className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-primary-500" value={matricula} onChange={e => setMatricula(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">CURP</label>
                  <input type="text" required className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-primary-500 uppercase" value={curp} onChange={e => setCurp(e.target.value.toUpperCase())} />
                </div>
                <button type="submit" disabled={loading} className="w-full flex justify-center py-2.5 px-4 rounded-lg text-sm font-medium text-white bg-slate-800 hover:bg-slate-900 disabled:opacity-50">
                  {loading ? 'Buscando...' : 'Entrar a Mi Portal'}
                </button>
              </form>
            )}
            
            <div className="mt-6 text-center border-t pt-4">
              <a href="/pre-inscripcion" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                ¿Aspirante de nuevo ingreso? Ir al portal
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
