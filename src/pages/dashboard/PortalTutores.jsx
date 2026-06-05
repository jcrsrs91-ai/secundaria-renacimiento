import { useState } from 'react';
import { Newspaper, User, BellRing, FileText, CheckCircle2, Clock } from 'lucide-react';

export default function PortalTutores() {
  const [activeTab, setActiveTab] = useState('muro');

  const noticias = [
    { id: 1, titulo: 'Aviso Importante: Suspensión de Clases', fecha: '03 Jun 2026', desc: 'Por indicaciones de la SEP, el día viernes no habrá clases debido a Consejo Técnico Escolar.', autor: 'Dirección' },
    { id: 2, titulo: 'Firma de Boletas - 2do Trimestre', fecha: '28 May 2026', desc: 'Se les cita a la junta para entrega de calificaciones el próximo lunes a las 08:00 AM en la explanada.', autor: 'Control Escolar' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header del Alumno */}
      <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-64 h-64 rounded-full bg-primary-600 blur-3xl opacity-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center md:items-start gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-slate-800 rounded-full border-4 border-slate-700 flex items-center justify-center text-3xl font-bold">
              A
            </div>
            <div>
              <h2 className="text-2xl font-bold">Álvarez Gómez Ana</h2>
              <p className="text-slate-400 mt-1">Matrícula: 2024EST68001 | 3er Grado Grupo "A"</p>
              <div className="mt-3 flex gap-2">
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold border border-emerald-500/30 flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Alumno Activo
                </span>
                <span className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-xs font-semibold border border-primary-500/30">
                  Taller: Climatización
                </span>
              </div>
            </div>
          </div>
          <div className="text-center md:text-right">
            <p className="text-sm text-slate-400 mb-1">Última asistencia registrada:</p>
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
          {noticias.map(n => (
            <div key={n.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-rose-50 text-rose-500 rounded-lg">
                    <BellRing className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{n.titulo}</h3>
                    <p className="text-xs text-slate-500">Publicado por {n.autor} • {n.fecha}</p>
                  </div>
                </div>
              </div>
              <p className="text-slate-600">{n.desc}</p>
            </div>
          ))}
          
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-bold text-blue-800 mb-2">Directorio de Dependencias de Apoyo</h3>
            <p className="text-sm text-blue-600 mb-4">¿Necesitas ayuda médica, familiar o legal? Consulta las instituciones disponibles para ti.</p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Ver Directorio (Módulo 9)</button>
          </div>
        </div>
      )}

      {/* Expediente Académico */}
      {activeTab === 'expediente' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Calificaciones */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden md:col-span-2">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center"><FileText className="w-4 h-4 mr-2" /> Boleta de Calificaciones (NEM)</h3>
            </div>
            <table className="min-w-full divide-y divide-slate-200">
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
                  <td className="px-6 py-3 text-sm text-slate-900 text-center">9.0</td>
                  <td className="px-6 py-3 text-sm text-slate-900 text-center">8.5</td>
                  <td className="px-6 py-3 text-sm font-bold text-slate-900 text-center">8.7</td>
                </tr>
                <tr>
                  <td className="px-6 py-3 text-sm text-slate-600 pl-10">Inglés</td>
                  <td className="px-6 py-3 text-sm text-slate-900 text-center">10</td>
                  <td className="px-6 py-3 text-sm text-slate-900 text-center">9.5</td>
                  <td className="px-6 py-3 text-sm font-bold text-slate-900 text-center">9.7</td>
                </tr>
                <tr className="bg-slate-50 font-semibold"><td colSpan="4" className="px-6 py-2 text-xs text-slate-600">Saberes y Pensamiento Científico</td></tr>
                <tr>
                  <td className="px-6 py-3 text-sm text-slate-600 pl-10">Matemáticas</td>
                  <td className="px-6 py-3 text-sm text-slate-900 text-center">8.0</td>
                  <td className="px-6 py-3 text-sm text-rose-600 font-bold text-center">5.0</td>
                  <td className="px-6 py-3 text-sm font-bold text-rose-600 text-center">6.5</td>
                </tr>
                <tr>
                  <td className="px-6 py-3 text-sm text-slate-600 pl-10">Tecnologías (Climatización)</td>
                  <td className="px-6 py-3 text-sm text-slate-900 text-center">10</td>
                  <td className="px-6 py-3 text-sm text-slate-900 text-center">10</td>
                  <td className="px-6 py-3 text-sm font-bold text-emerald-600 text-center">10</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          {/* Alertas */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-800 border-b pb-2 mb-4">Estado de Cuenta</h3>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Constancia de Estudios (04/06/2026)</span>
              <span className="text-sm font-bold text-emerald-600">Pagado</span>
            </div>
            <div className="mt-4">
              <button className="w-full text-center py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition">Solicitar nuevo trámite</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
