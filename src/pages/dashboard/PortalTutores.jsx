import { useState, useEffect } from 'react';
import { Newspaper, User, BellRing, FileText, CheckCircle2, Clock, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export default function PortalTutores() {
  const [activeTab, setActiveTab] = useState('muro');
  const { studentSession, logout } = useAuth();
  const [noticias, setNoticias] = useState([]);
  const [loadingAvisos, setLoadingAvisos] = useState(true);

  useEffect(() => {
    const fetchAvisos = async () => {
      try {
        const q = query(
          collection(db, 'avisos'),
          where('isActive', '==', true),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        const snapshot = await getDocs(q);
        const avisosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNoticias(avisosData);
      } catch (error) {
        console.error("Error fetching avisos:", error);
      } finally {
        setLoadingAvisos(false);
      }
    };
    fetchAvisos();
  }, []);

  if (!studentSession) return <div className="p-8 text-center">Cargando...</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header del Alumno */}
      <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-64 h-64 rounded-full bg-primary-600 blur-3xl opacity-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center md:items-start gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-slate-800 rounded-full border-4 border-slate-700 flex items-center justify-center text-3xl font-bold uppercase overflow-hidden">
              {studentSession.fotoUrl ? (
                <img src={studentSession.fotoUrl} alt="Foto" className="w-full h-full object-cover" />
              ) : (
                studentSession.nombres ? studentSession.nombres.charAt(0) : 'A'
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{studentSession.nombres} {studentSession.apellidoPaterno} {studentSession.apellidoMaterno}</h2>
              <p className="text-slate-400 mt-1">Matrícula: {studentSession.matricula} | {studentSession.grado} Grupo "{studentSession.grupo || '-'}"</p>
              <div className="mt-3 flex gap-2">
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold border border-emerald-500/30 flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Alumno Activo
                </span>
                {studentSession.taller && (
                  <span className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-xs font-semibold border border-primary-500/30 flex items-center">
                    Taller: {studentSession.taller.split('(')[0].trim()}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-center md:text-right flex flex-col items-end">
            <button onClick={logout} className="mb-4 flex items-center text-rose-400 hover:text-rose-300 transition-colors text-sm font-semibold">
              <LogOut className="w-4 h-4 mr-1" /> Cerrar Sesión
            </button>
            <p className="text-sm text-slate-400 mb-1">Último acceso al portal:</p>
            <p className="font-semibold flex items-center justify-center md:justify-end text-emerald-400">
              <Clock className="w-4 h-4 mr-2" /> Hoy, 06:55 AM
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('muro')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${activeTab === 'muro' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <Newspaper className="w-4 h-4 mr-2" /> Muro de Noticias
          </button>
          <button
            onClick={() => setActiveTab('expediente')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${activeTab === 'expediente' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <User className="w-4 h-4 mr-2" /> Mi Expediente / Calificaciones
          </button>
        </nav>
      </div>

      {/* Muro de Noticias */}
      {activeTab === 'muro' && (
        <div className="space-y-6">
          {loadingAvisos ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : noticias.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-500">
              No hay avisos recientes por el momento.
            </div>
          ) : (
            noticias.map(n => (
              <div key={n.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-rose-50 text-rose-500 rounded-lg">
                      <BellRing className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{n.title}</h3>
                      <p className="text-xs text-slate-500">
                        {n.createdAt && new Date(n.createdAt.seconds * 1000).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>
                {n.content.trim().startsWith('<') ? (
                  <div className="text-slate-600 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: n.content }} />
                ) : (
                  <p className="text-slate-600 whitespace-pre-wrap">{n.content}</p>
                )}
              </div>
            ))
          )}
          
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-bold text-blue-800 mb-2">Directorio de Dependencias de Apoyo</h3>
            <p className="text-sm text-blue-600 mb-4">¿Necesitas ayuda médica, familiar o legal? Consulta las instituciones disponibles para ti.</p>
            <a href="https://www.gob.mx/sep/acciones-y-programas/directorio-de-dependencias-de-apoyo" target="_blank" rel="noreferrer" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">Ver Directorio</a>
          </div>
        </div>
      )}

      {/* Expediente Académico */}
      {activeTab === 'expediente' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Calificaciones */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden md:col-span-2">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center"><FileText className="w-4 h-4 mr-2" /> Boleta de Calificaciones</h3>
            </div>
            <table className="min-w-full divide-y divide-slate-200 overflow-x-auto block md:table">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Campo Formativo / Disciplina</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Trimestre 1</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Trimestre 2</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Promedio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="bg-slate-50 font-semibold"><td colSpan="4" className="px-6 py-2 text-xs text-slate-600">Lenguajes</td></tr>
                <tr>
                  <td className="px-6 py-3 text-sm text-slate-600 pl-10">Español</td>
                  <td className="px-6 py-3 text-sm text-slate-900 text-center">-</td>
                  <td className="px-6 py-3 text-sm text-slate-900 text-center">-</td>
                  <td className="px-6 py-3 text-sm font-bold text-slate-900 text-center">-</td>
                </tr>
                <tr>
                  <td className="px-6 py-3 text-sm text-slate-600 pl-10">Inglés</td>
                  <td className="px-6 py-3 text-sm text-slate-900 text-center">-</td>
                  <td className="px-6 py-3 text-sm text-slate-900 text-center">-</td>
                  <td className="px-6 py-3 text-sm font-bold text-slate-900 text-center">-</td>
                </tr>
                <tr className="bg-slate-50 font-semibold"><td colSpan="4" className="px-6 py-2 text-xs text-slate-600">Saberes y Pensamiento Científico</td></tr>
                <tr>
                  <td className="px-6 py-3 text-sm text-slate-600 pl-10">Matemáticas</td>
                  <td className="px-6 py-3 text-sm text-slate-900 text-center">-</td>
                  <td className="px-6 py-3 text-sm text-slate-900 text-center">-</td>
                  <td className="px-6 py-3 text-sm font-bold text-slate-900 text-center">-</td>
                </tr>
                <tr>
                  <td className="px-6 py-3 text-sm text-slate-600 pl-10">Tecnologías</td>
                  <td className="px-6 py-3 text-sm text-slate-900 text-center">-</td>
                  <td className="px-6 py-3 text-sm text-slate-900 text-center">-</td>
                  <td className="px-6 py-3 text-sm font-bold text-slate-900 text-center">-</td>
                </tr>
              </tbody>
            </table>
            <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
              <p className="text-xs text-slate-500 italic">Las boletas oficiales se llenarán automáticamente en cuanto los docentes finalicen la captura.</p>
            </div>
          </div>
          
          {/* Documentos Recibidos */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-800 border-b pb-2 mb-4">Expediente Digital</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">Acta de Nacimiento</span>
                <span className="text-sm font-bold text-emerald-600">Entregado</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">CURP</span>
                <span className="text-sm font-bold text-emerald-600">Entregado</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">Certificado de Primaria</span>
                <span className="text-sm font-bold text-emerald-600">Entregado</span>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              <a href="mailto:controlescolar@est68.edu.mx" className="w-full block text-center py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-sm font-bold hover:bg-blue-100 transition">Enviar Correo a Control Escolar</a>
              <a href="tel:7444415678" className="w-full block text-center py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg text-sm font-bold hover:bg-emerald-100 transition">Llamar a Control Escolar (744 441 5678)</a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
