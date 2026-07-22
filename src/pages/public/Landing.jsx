import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, UsersRound, Bell, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Landing() {
  const [bgIndex, setBgIndex] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex(prev => prev >= 9 ? 1 : prev + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 font-sans selection:bg-rose-700 selection:text-white">
      {/* Navbar Glassmorphism */}
      <nav className="fixed w-full z-50 top-0 left-0 border-b border-white/10 bg-slate-900/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3">
              <img src="/logo-escuela.png" alt="Logo EST68" className="w-12 h-12 object-contain drop-shadow-lg" />
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight leading-tight">Escuela Secundaria</h1>
                <p className="text-sm font-medium text-rose-400">Técnica N°68</p>
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
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 sm:pt-40 sm:pb-24 overflow-hidden min-h-[90vh] flex items-center">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0 bg-slate-950">
          <img 
            key={bgIndex}
            src={`/carousel/foto${bgIndex}.jpeg`} 
            alt="Fondo Instalaciones" 
            className="w-full h-full object-cover opacity-60 animate-in fade-in duration-1000" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-900/40"></div>
        </div>

        {/* Floating Orbs for Glassmorphism effect */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-700/30 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-amber-600/20 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6">
              <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
              <span className="text-xs font-medium text-slate-200 uppercase tracking-wider shadow-sm">Ciclo Escolar 2026-2027</span>
            </div>
            <h1 className="text-5xl sm:text-7xl font-extrabold text-white tracking-tight mb-6 leading-[1.1] drop-shadow-lg">
              Por la superación <br className="hidden sm:block"/> de <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-rose-600">México.</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-200 mb-10 font-medium leading-relaxed drop-shadow-md">
              Descubre una comunidad educativa comprometida con la excelencia, la innovación y el desarrollo integral de cada estudiante.
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-5xl mx-auto">
            {/* Card 1 */}
            <Link to="/pre-inscripcion" className="group relative p-1 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 hover:from-rose-500 hover:to-rose-600 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-rose-500/30">
              <div className="absolute inset-0 bg-slate-950/60 rounded-2xl backdrop-blur-xl group-hover:bg-slate-900/40 transition-colors"></div>
              <div className="relative p-6 h-full flex flex-col items-start text-left">
                <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mb-6 group-hover:bg-white/20 group-hover:border-white/30 transition-colors">
                  <GraduationCap className="w-6 h-6 text-rose-400 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Nuevo Ingreso</h3>
                <p className="text-slate-300 text-sm mb-6 group-hover:text-rose-50 transition-colors flex-1">
                  Inicia el proceso de pre-inscripción para el ciclo escolar entrante. Rápido y 100% digital.
                </p>
                <div className="flex items-center text-rose-400 text-sm font-bold group-hover:text-white transition-colors">
                  Iniciar trámite <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            {/* Card 2 */}
            <Link to="/acceso-padres" className="group relative p-1 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 hover:from-rose-500 hover:to-rose-600 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-rose-500/30">
              <div className="absolute inset-0 bg-slate-950/60 rounded-2xl backdrop-blur-xl group-hover:bg-slate-900/40 transition-colors"></div>
              <div className="relative p-6 h-full flex flex-col items-start text-left">
                <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mb-6 group-hover:bg-white/20 group-hover:border-white/30 transition-colors">
                  <UsersRound className="w-6 h-6 text-rose-400 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Portal Familiar</h3>
                <p className="text-slate-300 text-sm mb-6 group-hover:text-rose-50 transition-colors flex-1">
                  Consulta calificaciones, asistencias y expedientes de tus hijos en tiempo real.
                </p>
                <div className="flex items-center text-rose-400 text-sm font-bold group-hover:text-white transition-colors">
                  Acceder al portal <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            {/* Card 3 */}
            <Link to="/avisos" className="group relative p-1 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 hover:from-amber-500 hover:to-amber-600 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-amber-500/30">
              <div className="absolute inset-0 bg-slate-950/60 rounded-2xl backdrop-blur-xl group-hover:bg-slate-900/40 transition-colors"></div>
              <div className="relative p-6 h-full flex flex-col items-start text-left">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mb-6 group-hover:bg-white/20 group-hover:border-white/30 transition-colors">
                  <Bell className="w-6 h-6 text-amber-400 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Avisos Escolares</h3>
                <p className="text-slate-300 text-sm mb-6 group-hover:text-amber-50 transition-colors flex-1">
                  Mantente informado sobre suspensiones, eventos y comunicados oficiales.
                </p>
                <div className="flex items-center text-amber-400 text-sm font-bold group-hover:text-white transition-colors">
                  Ver comunicados <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
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
