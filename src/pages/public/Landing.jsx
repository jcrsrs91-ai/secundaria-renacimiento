import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { Link } from 'react-router-dom';
import { GraduationCap, UsersRound, Bell, ArrowRight, ShieldCheck, Megaphone, Calendar, MapPin, Hash, Phone, Menu, X } from 'lucide-react';

export default function Landing() {
    const [bgIndex, setBgIndex] = useState(1);
  const [noticias, setNoticias] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('matutino');

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const q = query(collection(db, 'avisos'), orderBy('createdAt', 'desc'), limit(10));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(a => a.isActive !== false);
        setNoticias(data);
      } catch (error) {
        console.error("Error fetching news:", error);
      } finally {
        setLoadingNews(false);
      }
    };
    fetchNews();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex(prev => prev >= 9 ? 1 : prev + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 font-sans selection:bg-sky-700 selection:text-white">
      {/* Navbar Glassmorphism */}
      <nav className="fixed w-full z-50 top-0 left-0 border-b border-white/10 bg-slate-900/40 backdrop-blur-md flex flex-col">
        <div className="bg-sky-600/95 text-white text-[10px] sm:text-xs py-1.5 px-4 flex justify-center sm:justify-between items-center w-full shadow-md">
          <div className="hidden md:flex items-center justify-between max-w-7xl mx-auto w-full px-2 lg:px-6">
            <span className="flex items-center gap-1.5 font-medium"><MapPin className="w-3.5 h-3.5" /> Calle Alta Quebradora y And. 24 Febrero S/N, Cd. Renacimiento, Acapulco</span>
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-1.5 font-bold tracking-wider"><Hash className="w-3.5 h-3.5" /> C.C.T. 12DST0077B</span>
              <span className="flex items-center gap-1.5 font-bold tracking-wider"><Phone className="w-3.5 h-3.5" /> Tel. 744 441 5678</span>
            </div>
          </div>
          <div className="flex md:hidden items-center justify-center gap-4 w-full">
            <span className="flex items-center gap-1 font-bold"><Hash className="w-3 h-3" /> 12DST0077B</span>
            <span className="flex items-center gap-1 font-bold"><Phone className="w-3 h-3" /> 744 441 5678</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3">
              <img src="/logo-escuela.png" alt="Logo EST68" className="w-12 h-12 object-contain drop-shadow-lg" />
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight leading-tight">Escuela Secundaria</h1>
                <p className="text-sm font-medium text-sky-400">Técnica N°68</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-6">
              <Link to="/pre-inscripcion" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Admisiones</Link>
              <Link to="/acceso-padres" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Portal de Padres</Link>
              <Link to="/admin" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-all hover:scale-105 active:scale-95">
                <ShieldCheck className="w-4 h-4" />
                Acceso Personal
              </Link>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-300 hover:text-white p-2">
                {mobileMenuOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-[112px] left-0 w-full bg-slate-900 border-b border-white/10 z-40 p-4 flex flex-col gap-4 shadow-xl animate-in slide-in-from-top-2">
          <Link to="/pre-inscripcion" className="text-white font-medium p-3 bg-white/5 rounded-lg text-center" onClick={() => setMobileMenuOpen(false)}>Admisiones</Link>
          <Link to="/acceso-padres" className="text-white font-medium p-3 bg-white/5 rounded-lg text-center" onClick={() => setMobileMenuOpen(false)}>Portal de Padres</Link>
          <Link to="/admin" className="text-white font-bold p-3 bg-primary-600 rounded-lg flex justify-center items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
            <ShieldCheck className="w-5 h-5" /> Acceso Personal (Admin)
          </Link>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 sm:pt-40 sm:pb-24 overflow-hidden min-h-[90vh] flex items-center">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0 bg-slate-950">
          <img 
            key={bgIndex}
            src={`/carousel/foto${bgIndex}.jpeg`} 
            alt="Fondo Instalaciones" 
            className="w-full h-full object-cover opacity-90 animate-in fade-in duration-1000" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
        </div>

        {/* Floating Orbs for Glassmorphism effect */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-700/30 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="relative z-10 max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col xl:flex-row gap-12 items-center xl:items-start">
          
          {/* Left Column: Text and Cards */}
          <div className="flex-1 text-center xl:text-left w-full mt-4 sm:mt-12">
            <h1 className="text-5xl sm:text-7xl font-extrabold text-white tracking-tight mb-6 leading-[1.1] drop-shadow-lg">
              Por la superación <br className="hidden sm:block"/> de <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-sky-600">México.</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-200 mb-10 font-medium leading-relaxed drop-shadow-md max-w-2xl mx-auto xl:mx-0">
              Descubre una comunidad educativa comprometida con la excelencia, la innovación y el desarrollo integral de cada estudiante.
            </p>

            {/* Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-12 max-w-3xl mx-auto xl:mx-0">
            {/* Card 1 */}
            <Link to="/pre-inscripcion" className="group relative p-1 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 hover:from-sky-500 hover:to-sky-600 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-sky-500/30">
              <div className="absolute inset-0 bg-slate-950/60 rounded-2xl backdrop-blur-xl group-hover:bg-slate-900/40 transition-colors"></div>
              <div className="relative p-6 h-full flex flex-col items-start text-left">
                <div className="w-12 h-12 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center mb-6 group-hover:bg-white/20 group-hover:border-white/30 transition-colors">
                  <GraduationCap className="w-6 h-6 text-sky-400 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Nuevo Ingreso</h3>
                <p className="text-slate-300 text-sm mb-6 group-hover:text-sky-50 transition-colors flex-1">
                  Inicia el proceso de pre-inscripción para el ciclo escolar entrante. Rápido y 100% digital.
                </p>
                <div className="flex items-center text-sky-400 text-sm font-bold group-hover:text-white transition-colors">
                  Iniciar trámite <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            {/* Card 2 */}
            <Link to="/acceso-padres" className="group relative p-1 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 hover:from-sky-500 hover:to-sky-600 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-sky-500/30">
              <div className="absolute inset-0 bg-slate-950/60 rounded-2xl backdrop-blur-xl group-hover:bg-slate-900/40 transition-colors"></div>
              <div className="relative p-6 h-full flex flex-col items-start text-left">
                <div className="w-12 h-12 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center mb-6 group-hover:bg-white/20 group-hover:border-white/30 transition-colors">
                  <UsersRound className="w-6 h-6 text-sky-400 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Portal Familiar</h3>
                <p className="text-slate-300 text-sm mb-6 group-hover:text-sky-50 transition-colors flex-1">
                  Consulta calificaciones, asistencias y expedientes de tus hijos en tiempo real.
                </p>
                <div className="flex items-center text-sky-400 text-sm font-bold group-hover:text-white transition-colors">
                  Acceder al portal <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            {/* Card 3 */}
            <Link to="/avisos" className="group relative p-1 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 hover:from-indigo-500 hover:to-indigo-600 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/30">
              <div className="absolute inset-0 bg-slate-950/60 rounded-2xl backdrop-blur-xl group-hover:bg-slate-900/40 transition-colors"></div>
              <div className="relative p-6 h-full flex flex-col items-start text-left">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mb-6 group-hover:bg-white/20 group-hover:border-white/30 transition-colors">
                  <Bell className="w-6 h-6 text-indigo-400 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Avisos Escolares</h3>
                <p className="text-slate-300 text-sm mb-6 group-hover:text-indigo-50 transition-colors flex-1">
                  Mantente informado sobre suspensiones, eventos y comunicados oficiales.
                </p>
                <div className="flex items-center text-indigo-400 text-sm font-bold group-hover:text-white transition-colors">
                  Ver comunicados <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
            </div>
          </div>

          {/* Right Column: Avisos Panel */}
          <div className="w-full xl:w-[450px] shrink-0 mt-12 xl:mt-0 flex flex-col items-center xl:items-end">
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-sky-950/40 border border-sky-500/30 backdrop-blur-md mb-6 shadow-[0_0_15px_rgba(14,165,233,0.3)]">
              <span className="flex h-3 w-3 rounded-full bg-sky-400 animate-pulse"></span>
              <span className="text-sm font-bold text-white uppercase tracking-widest drop-shadow-md">Ciclo Escolar 2026-2027</span>
            </div>
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl h-[600px] flex flex-col overflow-hidden shadow-2xl w-full">
              <div className="bg-sky-600/90 px-6 py-4 flex flex-col gap-4 border-b border-white/10 shrink-0">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Megaphone className="w-5 h-5" /> Muro de Avisos
                </h2>
                <div className="flex bg-slate-900/40 p-1 rounded-lg">
                  <button 
                    onClick={() => setActiveTab('matutino')}
                    className={`flex-1 py-1.5 text-xs sm:text-sm font-bold rounded-md transition-all duration-300 ${activeTab === 'matutino' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
                  >
                    ☀️ Matutino
                  </button>
                  <button 
                    onClick={() => setActiveTab('vespertino')}
                    className={`flex-1 py-1.5 text-xs sm:text-sm font-bold rounded-md transition-all duration-300 ${activeTab === 'vespertino' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
                  >
                    🌙 Vespertino
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {loadingNews ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="w-8 h-8 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
                  </div>
                ) : noticias.length === 0 ? (
                  <div className="flex justify-center items-center h-full text-slate-300 text-sm text-center px-4">
                    No hay avisos recientes por el momento.
                  </div>
                ) : (
                  noticias.filter(a => !a.turno || a.turno === 'ambos' || a.turno === activeTab).map((aviso) => (
                    <div key={aviso.id} className="bg-white/10 border border-white/10 rounded-2xl p-5 hover:bg-white/15 transition-colors group">
                      <div className="flex items-start justify-between mb-3 border-b border-white/10 pb-3">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${aviso.type === 'warning' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'}`}>
                          {aviso.type === 'warning' ? 'Importante' : 'Informativo'}
                        </span>
                        {aviso.createdAt && (
                          <div className="flex items-center text-[10px] text-slate-400 font-medium">
                            {new Date(aviso.createdAt?.seconds * 1000).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-white mb-2 leading-tight">{aviso.title}</h3>
                      {aviso.imageUrl && (
                        <div className="mb-4 rounded-xl overflow-hidden border border-white/10">
                          <img src={aviso.imageUrl} alt="Flyer del Aviso" className="w-full h-auto object-cover max-h-48" />
                        </div>
                      )}
                      <p className="text-slate-300 text-xs mb-4 line-clamp-3 leading-relaxed whitespace-pre-wrap">{aviso.content}</p>
                      <Link to="/avisos" className="text-xs font-bold text-sky-400 hover:text-sky-300 transition-colors flex items-center w-max">
                        Leer completo <ArrowRight className="w-3 h-3 ml-1" />
                      </Link>
                    </div>
                  ))
                )}
              </div>
              <div className="p-4 border-t border-white/10 bg-slate-900/50 shrink-0 text-center">
                <Link to="/avisos" className="text-sm font-bold text-white hover:text-sky-400 transition-colors inline-flex items-center">
                  Ver historial de comunicados <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>

            {/* Calendario SEP Button */}
            <a href="https://calendarioescolar.sep.gob.mx/" target="_blank" rel="noreferrer" className="w-full mt-4 flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-emerald-600/80 to-emerald-800/80 hover:from-emerald-500 hover:to-emerald-700 transition-colors border border-emerald-500/30 shadow-lg group backdrop-blur-md">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                   <Calendar className="w-5 h-5 text-white" />
                 </div>
                 <div className="text-left">
                   <p className="text-xs text-emerald-100 font-medium leading-none mb-1">Sitio Oficial</p>
                   <p className="text-sm font-bold text-white leading-none">Calendario SEP</p>
                 </div>
               </div>
               <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
            </a>

          </div>
        </div>
      </div>

      
      {/* Footer */}
      <footer className="border-t border-white/10 bg-slate-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity">
            <img src="/logo-escuela.png" alt="Logo EST68" className="w-10 h-10 object-contain" />
            <div>
              <p className="text-sm font-bold text-slate-300">EST N°68 "Renacimiento"</p>
              <p className="text-xs text-slate-500">Acapulco, Gro.</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex flex-col items-center sm:items-start gap-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Síguenos en Facebook</p>
              <div className="flex items-center gap-4">
                <a href="https://www.facebook.com/share/1E6q5vyfNT/" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-slate-300 hover:text-blue-500 transition-colors">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  Turno Matutino
                </a>
                <span className="text-slate-700">|</span>
                <a href="https://www.facebook.com/share/1BGQzeaAVc/" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-slate-300 hover:text-blue-500 transition-colors">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  Turno Vespertino
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end gap-2">
            <p className="text-slate-500 text-sm">© {new Date().getFullYear()} Escuela Secundaria Técnica N°68.</p>
            <Link to="/admin" className="text-xs font-medium text-slate-400 hover:text-white border-b border-transparent hover:border-white transition-colors">
              Intranet Administrativa
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
