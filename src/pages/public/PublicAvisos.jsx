import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { Link } from 'react-router-dom';
import { Megaphone, Calendar, ArrowLeft, FileText, Download } from 'lucide-react';

export default function PublicAvisos() {
  const [avisos, setAvisos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('matutino');

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const q = query(collection(db, 'avisos'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(a => a.isActive !== false);
        setAvisos(data);
      } catch (error) {
        console.error("Error fetching news:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-sky-500/30 selection:text-sky-900">
      <nav className="bg-slate-900 border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <ArrowLeft className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight leading-tight group-hover:text-sky-400 transition-colors">Volver al Inicio</h1>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <img src="/logo-escuela.png" alt="Logo EST68" className="w-10 h-10 object-contain drop-shadow-lg" />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-16 h-16 rounded-2xl bg-sky-100 flex items-center justify-center shadow-sm">
            <Megaphone className="w-8 h-8 text-sky-600" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Comunicados Oficiales</h1>
            <p className="text-lg text-slate-500 mt-2 font-medium">Mantente informado de todos los avisos y noticias de la institución.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
          </div>
        ) : avisos.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center shadow-sm">
            <p className="text-slate-500 text-lg font-medium">No hay comunicados publicados en este momento.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {avisos.filter(a => !a.turno || a.turno === 'ambos' || a.turno === activeTab).map((aviso) => (
              <div key={aviso.id} className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-6 border-b border-slate-100 pb-4">
                  <span className={`text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider ${aviso.type === 'warning' ? 'bg-indigo-100 text-indigo-700' : 'bg-sky-100 text-sky-700'}`}>
                    {aviso.type === 'warning' ? 'Aviso Importante' : 'Informativo'}
                  </span>
                  {aviso.createdAt && (
                    <div className="flex items-center text-sm text-slate-500 font-medium bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100">
                      <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                      {new Date(aviso.createdAt?.seconds * 1000).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-4">{aviso.title}</h2>
                
                {/* Legacy image support */}
                {aviso.imageUrl && (!aviso.attachments || aviso.attachments.length === 0) && (
                  <div className="mb-6 rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex justify-center bg-slate-50">
                    <img src={aviso.imageUrl} alt="Comunicado Oficial" className="w-full max-w-3xl max-h-[600px] object-contain" />
                  </div>
                )}
                
                {/* New multiple attachments support */}
                {aviso.attachments && aviso.attachments.length > 0 && (
                  <div className="mb-6 space-y-4">
                    {/* Render images first */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {aviso.attachments.filter(a => a.type === 'image').map((img, idx) => (
                        <div key={idx} className="rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex justify-center bg-slate-50">
                           <img src={img.url} alt={`Adjunto ${idx+1}`} className="w-full max-h-[400px] object-contain cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(img.url, '_blank')} />
                        </div>
                      ))}
                    </div>
                    {/* Render PDFs */}
                    {aviso.attachments.filter(a => a.type === 'pdf').length > 0 && (
                      <div className="flex flex-col gap-2 mt-4">
                        <p className="text-sm font-bold text-slate-700">Archivos Adjuntos:</p>
                        {aviso.attachments.filter(a => a.type === 'pdf').map((pdf, idx) => (
                          <a key={idx} href={pdf.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-sky-300 hover:shadow-sm transition-all group">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center mr-3">
                                <FileText className="w-5 h-5 text-rose-500" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800 group-hover:text-sky-600 transition-colors">{pdf.name}</p>
                                <p className="text-xs text-slate-500">Documento PDF</p>
                              </div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-sky-50 transition-colors">
                               <Download className="w-4 h-4 text-slate-400 group-hover:text-sky-500" />
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-600 text-base leading-relaxed whitespace-pre-wrap">{aviso.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
