import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, UsersRound, Bell, ArrowRight, ShieldCheck } from 'lucide-react';
import heroImg from '../../assets/hero.png';

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-900 font-sans selection:bg-rose-500 selection:text-white">
      {/* Navbar Glassmorphism */}
      <nav className="fixed w-full z-50 top-0 left-0 border-b border-white/10 bg-slate-900/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-rose-700 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/30">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight leading-tight">Escuela Secundaria</h1>
                <p className="text-sm font-medium text-rose-400">Técnica N°68</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-6">
              <Link to="/pre-inscripcion" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Admisiones</Link>
              <Link to="/panel/portal-familiar" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Portal de Padres</Link>
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
        <div className="absolute inset-0 z-0">
          <img src={heroImg} alt="Estudiantes" className="w-full h-full object-cover opacity-30 mix-blend-luminosity" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/30"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-rose-900/20 to-transparent"></div>
        </div>

        {/* Floating Orbs for Glassmorphism effect */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-600/30 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-6">
              <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
              <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">Ciclo Escolar 2026-2027</span>
            </div>
            <h1 className="text-5xl sm:text-7xl font-extrabold text-white tracking-tight mb-6 leading-[1.1]">
              Forjando el <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-rose-600">Futuro</span> de México.
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 mb-10 font-light leading-relaxed">
              Descubre una comunidad educativa comprometida con la excelencia, la innovación y el desarrollo integral de cada estudiante.
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-5xl mx-auto">
            {/* Card 1 */}
            <Link to="/pre-inscripcion" className="group relative p-1 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 hover:from-rose-500 hover:to-rose-600 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-rose-500/20">
              <div className="absolute inset-0 bg-slate-900/40 rounded-2xl backdrop-blur-xl group-hover:bg-slate-900/10 transition-colors"></div>
              <div className="relative p-6 h-full flex flex-col items-start text-left">
                <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mb-6 group-hover:bg-white/20 group-hover:border-white/30 transition-colors">
                  <GraduationCap className="w-6 h-6 text-rose-400 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Nuevo Ingreso</h3>
                <p className="text-slate-400 text-sm mb-6 group-hover:text-rose-100 transition-colors flex-1">
                  Inicia el proceso de pre-inscripción para el ciclo escolar entrante. Rápido y 100% digital.
                </p>
                <div className="flex items-center text-rose-400 text-sm font-bold group-hover:text-white transition-colors">
                  Iniciar trámite <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            {/* Card 2 */}
            <Link to="/panel/portal-familiar" className="group relative p-1 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 hover:from-blue-500 hover:to-blue-600 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/20">
              <div className="absolute inset-0 bg-slate-900/40 rounded-2xl backdrop-blur-xl group-hover:bg-slate-900/10 transition-colors"></div>
              <div className="relative p-6 h-full flex flex-col items-start text-left">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mb-6 group-hover:bg-white/20 group-hover:border-white/30 transition-colors">
                  <UsersRound className="w-6 h-6 text-blue-400 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Portal Familiar</h3>
                <p className="text-slate-400 text-sm mb-6 group-hover:text-blue-100 transition-colors flex-1">
                  Consulta calificaciones, asistencias y expedientes de tus hijos en tiempo real.
                </p>
                <div className="flex items-center text-blue-400 text-sm font-bold group-hover:text-white transition-colors">
                  Acceder al portal <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            {/* Card 3 */}
            <Link to="/avisos" className="group relative p-1 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 hover:from-amber-500 hover:to-amber-600 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-amber-500/20">
              <div className="absolute inset-0 bg-slate-900/40 rounded-2xl backdrop-blur-xl group-hover:bg-slate-900/10 transition-colors"></div>
              <div className="relative p-6 h-full flex flex-col items-start text-left">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mb-6 group-hover:bg-white/20 group-hover:border-white/30 transition-colors">
                  <Bell className="w-6 h-6 text-amber-400 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Avisos Escolares</h3>
                <p className="text-slate-400 text-sm mb-6 group-hover:text-amber-100 transition-colors flex-1">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
            <GraduationCap className="w-6 h-6 text-slate-400" />
            <div>
              <p className="text-sm font-bold text-slate-300">EST N°68</p>
              <p className="text-xs text-slate-500">Acapulco, Gro.</p>
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
