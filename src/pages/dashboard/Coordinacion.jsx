import { useState } from 'react';
import { BookOpen, Trophy, Users } from 'lucide-react';
import CuadroHonor from '../../components/CuadroHonor';
import BuscadorAlumnos from '../../components/BuscadorAlumnos';
import HojaDeVida from '../../components/HojaDeVida';
import { materiasPorGrado } from '../../utils/materias';

export default function Coordinacion() {
  const [activeTab, setActiveTab] = useState('reportes');
  const [selectedStudent, setSelectedStudent] = useState(null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Coordinación Académica</h2>
        <p className="text-slate-500 text-sm">Seguimiento de desempeño e índices de reprobación.</p>
      </div>

      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('reportes')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${activeTab === 'reportes' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <BookOpen className="w-4 h-4" /> Reportes e Índice de Reprobación
          </button>
          <button
            onClick={() => setActiveTab('cuadro-honor')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${activeTab === 'cuadro-honor' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <Trophy className="w-4 h-4" /> Cuadro de Honor
          </button>
          <button
            onClick={() => setActiveTab('directorio')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${activeTab === 'directorio' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <Users className="w-4 h-4" /> Directorio de Alumnos
          </button>
        </nav>
      </div>
      
      {/* REPORTES */}
      {activeTab === 'reportes' && (
        <div className="bg-white shadow-sm rounded-xl border border-slate-200 p-6">
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">Módulo de Reportística Académica</h3>
            <p className="text-slate-500 mt-2">Aquí se generarán los cuadros de honor, boletas y reportes de reprobación por materia (NEM).</p>
          </div>
        </div>
      )}
      {/* CUADRO DE HONOR */}
      {activeTab === 'cuadro-honor' && (
        <CuadroHonor />
      )}
      
      {/* DIRECTORIO */}
      {activeTab === 'directorio' && (
        <>
          <BuscadorAlumnos 
            onStudentSelect={(student) => setSelectedStudent(student)} 
            title="Directorio de Alumnos" 
            description="Busca alumnos para ver su expediente académico y calificaciones."
          />
          {selectedStudent && (
            <HojaDeVida 
              student={selectedStudent}
              onClose={() => setSelectedStudent(null)} 
              materiasPorGrado={materiasPorGrado}
            />
          )}
        </>
      )}
    </div>
  );
}
