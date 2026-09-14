import { useState } from 'react';
import { FileHeart, HeartHandshake, Phone, MapPin, Building2, ExternalLink } from 'lucide-react';
import BuscadorAlumnos from '../../components/BuscadorAlumnos';
import HojaDeVida from '../../components/HojaDeVida';
import { materiasPorGrado } from '../../utils/materias';

export default function TrabajoSocial() {
  const [activeTab, setActiveTab] = useState('fichas');
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Directorio de Instituciones (Módulo 9)
  const directorio = [
    { nombre: 'Emergencias Médicas y Civiles (911)', categoria: 'Emergencias', desc: 'Atención prehospitalaria, seguridad pública y desastres.', tel: '9-1-1', icono: Phone },
    { nombre: 'DIF (Desarrollo Integral de la Familia)', categoria: 'Apoyo Familiar', desc: 'Programas de salud, alimentación y atención comunitaria.', tel: '55 1234 5678', icono: HeartHandshake },
    { nombre: 'SIPINNA', categoria: 'Protección de Menores', desc: 'Protección integral de derechos de niñas, niños y adolescentes.', tel: '55 8765 4321', icono: Building2 },
    { nombre: 'Procuraduría de Protección (PPNNA)', categoria: 'Apoyo Legal', desc: 'Intervención legal y psicológica en casos de maltrato escolar o familiar.', tel: '55 1111 2222', icono: Building2 },
    { nombre: 'Centros de Integración Juvenil (CIJ)', categoria: 'Salud Mental', desc: 'Prevención y atención de adicciones y apoyo psicológico.', tel: '55 3333 4444', icono: HeartHandshake },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Trabajo Social</h2>
        <p className="text-slate-500 text-sm">Expedientes médicos, estudios socioeconómicos y atención a la comunidad.</p>
      </div>

      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('fichas')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${activeTab === 'fichas' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <FileHeart className="w-4 h-4 mr-2" /> Fichas Médicas de Alumnos
          </button>
          <button
            onClick={() => setActiveTab('directorio')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${activeTab === 'directorio' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <Building2 className="w-4 h-4 mr-2" /> Directorio de Dependencias
          </button>
        </nav>
      </div>

      {activeTab === 'fichas' && (
        <>
          <BuscadorAlumnos 
            onStudentSelect={(student) => setSelectedStudent(student)} 
            title="Búsqueda de Expedientes" 
            description="Busca un alumno para consultar su ficha médica, contactos de emergencia y expediente."
          />
          {selectedStudent && (
            <HojaDeVida 
              student={selectedStudent} 
              materiasPorGrado={materiasPorGrado}
              onClose={() => setSelectedStudent(null)} 
            />
          )}
        </>
      )}

      {activeTab === 'directorio' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {directorio.map((inst, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
                  <inst.icono className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-full">{inst.categoria}</span>
              </div>
              <h3 className="font-bold text-slate-800 text-lg mb-2">{inst.nombre}</h3>
              <p className="text-sm text-slate-500 mb-4 h-10">{inst.desc}</p>
              <div className="flex items-center text-sm font-medium text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <Phone className="w-4 h-4 mr-2 text-primary-500" />
                {inst.tel}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
