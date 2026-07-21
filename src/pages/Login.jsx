import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { ShieldCheck } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Estados para Staff
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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

  return (
    <div className="min-h-screen bg-slate-900 flex py-12 sm:px-6 lg:px-8 bg-cover bg-center relative" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop')" }}>
      <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-sm"></div>
      
      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center justify-center gap-6 px-4">
        
        <div className="mb-6 text-center text-white">
          <h2 className="text-3xl font-extrabold drop-shadow-md">
            Esc. Sec. Téc. N°68 <br/><span className="text-primary-400">"RENACIMIENTO"</span>
          </h2>
          <p className="mt-3 text-sm text-slate-300 font-light">
            Sistema Integral de Gestión Escolar
          </p>
        </div>

        <div className="w-full">
          <div className="glass shadow-2xl sm:rounded-2xl overflow-hidden bg-white/95 ring-1 ring-slate-900/5">
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                  <ShieldCheck className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">Acceso Administrativo</h3>
                <p className="text-slate-500 text-sm mt-2">Uso exclusivo del personal escolar</p>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 bg-rose-50 text-rose-600 text-sm rounded-lg border border-rose-200 animate-in fade-in slide-in-from-top-1">
                  {errorMsg}
                </div>
              )}

              <form className="space-y-6 animate-in fade-in" onSubmit={handleStaffLogin}>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Correo Institucional</label>
                  <input type="email" required className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500 transition-shadow" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Contraseña</label>
                  <input type="password" required className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500 transition-shadow" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                <button type="submit" disabled={loading} className="w-full flex justify-center py-2.5 px-4 rounded-lg text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-md">
                  {loading ? 'Entrando...' : 'Ingresar al Panel'}
                </button>
              </form>
              
              <div className="mt-6 text-center border-t pt-5">
                <a href="/" className="text-sm font-medium text-slate-500 hover:text-primary-600 transition-colors">
                  Volver a la página principal
                </a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
