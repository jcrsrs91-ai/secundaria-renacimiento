import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { Megaphone, Info, AlertTriangle, CheckCircle, GraduationCap } from 'lucide-react';

export default function TutorLogin() {
  const navigate = useNavigate();
  const { loginAsStudent } = useAuth();
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Estados para Tutores
  const [matricula, setMatricula] = useState('');
  const [curp, setCurp] = useState('');

  // Estados para Avisos
  const [avisos, setAvisos] = useState([]);
  const [avisosLoading, setAvisosLoading] = useState(true);

  useEffect(() => {
    fetchAvisos();
  }, []);

  const fetchAvisos = async () => {
    setAvisosLoading(true);
    try {
      const q = query(
        collection(db, 'avisos'),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const snapshot = await getDocs(q);
      const avisosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAvisos(avisosData);
    } catch (error) {
      console.error("Error fetching avisos:", error);
    } finally {
      setAvisosLoading(false);
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
    <div className="min-h-screen bg-slate-900 flex py-12 sm:px-6 lg:px-8 bg-cover bg-center relative" style={{ backgroundImage: "url('/carousel/foto1.jpeg')" }}>
      <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-sm"></div>
      
      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-12 px-4">
        
        {/* Left Panel: Avisos */}
        <div className="flex-1 w-full lg:max-w-xl text-white">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-4xl lg:text-5xl font-extrabold drop-shadow-md">
              Esc. Sec. Téc. N°68 <br/><span className="text-rose-400">"RENACIMIENTO"</span>
            </h2>
            <p className="mt-3 text-lg lg:text-xl text-slate-300 font-light mb-8">
              Portal Familiar y de Alumnos
            </p>
          </div>

          <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 shadow-2xl">
            <h3 className="text-2xl font-bold flex items-center mb-6 text-white border-b border-slate-700/50 pb-4">
              <Megaphone className="mr-3 text-rose-400 h-6 w-6"/> Muro de Avisos
            </h3>
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              {avisosLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-rose-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : avisos.length === 0 ? (
                <div className="text-center py-8 text-slate-400 bg-slate-800/30 rounded-xl border border-slate-700/50 border-dashed">
                  <p>No hay avisos recientes en este momento.</p>
                </div>
              ) : (
                avisos.map(aviso => (
                  <div key={aviso.id} className="bg-slate-800/60 hover:bg-slate-800/80 transition-colors backdrop-blur border border-slate-700 p-5 rounded-xl shadow-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      {aviso.type === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-400" />}
                      {aviso.type === 'success' && <CheckCircle className="h-4 w-4 text-emerald-400" />}
                      {aviso.type === 'info' && <Info className="h-4 w-4 text-rose-400" />}
                      
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        aviso.type === 'warning' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 
                        aviso.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {aviso.type === 'warning' ? 'Importante' : aviso.type === 'success' ? 'Éxito' : 'Información'}
                      </span>
                      {aviso.createdAt && (
                        <span className="text-xs text-slate-400 font-medium">
                          {new Date(aviso.createdAt.seconds * 1000).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-lg text-white mb-2 leading-tight">{aviso.title}</h4>
                    {aviso.content.trim().startsWith('<') ? (
                      <div className="text-slate-300 text-sm leading-relaxed aviso-html-content" dangerouslySetInnerHTML={{ __html: aviso.content }} />
                    ) : (
                      <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{aviso.content}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Login Form */}
        <div className="w-full lg:max-w-md">
          <div className="glass shadow-2xl sm:rounded-2xl overflow-hidden bg-white/95 ring-1 ring-slate-900/5">
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="mx-auto w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4">
                  <GraduationCap className="w-8 h-8 text-rose-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">Acceso Familiar</h3>
                <p className="text-slate-500 text-sm mt-2">Consulta el expediente de tu hijo/a</p>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 bg-rose-50 text-rose-600 text-sm rounded-lg border border-rose-200 animate-in fade-in slide-in-from-top-1">
                  {errorMsg}
                </div>
              )}

              <form className="space-y-6 animate-in fade-in" onSubmit={handleStudentLogin}>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Matrícula Escolar</label>
                  <input type="text" placeholder="Ej. 2024EST68001" required className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-rose-500 focus:border-rose-500 transition-shadow" value={matricula} onChange={e => setMatricula(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">CURP</label>
                  <input type="text" required className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-rose-500 focus:border-rose-500 uppercase transition-shadow" value={curp} onChange={e => setCurp(e.target.value.toUpperCase())} />
                </div>
                <button type="submit" disabled={loading} className="w-full flex justify-center py-2.5 px-4 rounded-lg text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 transition-colors shadow-md">
                  {loading ? 'Buscando...' : 'Entrar a Mi Portal'}
                </button>
              </form>
              
              <div className="mt-6 text-center border-t pt-5">
                <a href="/" className="text-sm font-medium text-slate-500 hover:text-rose-600 transition-colors">
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
