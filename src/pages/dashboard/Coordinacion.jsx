import { useState, useEffect } from 'react';
import { BookOpen, Trophy, Users } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import CuadroHonor from '../../components/CuadroHonor';
import BuscadorAlumnos from '../../components/BuscadorAlumnos';
import HojaDeVida from '../../components/HojaDeVida';
import EvaluacionDocenteWidget from '../../components/EvaluacionDocenteWidget';
import { materiasPorGrado } from '../../utils/materias';

export default function Coordinacion() {
  const [activeTab, setActiveTab] = useState('reportes');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'students'), (snapshot) => {
      setStudents(snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })));
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      <div className="no-print">
        <h2 className="text-2xl font-bold text-slate-800">Coordinación Académica</h2>
        <p className="text-slate-500 text-sm">Seguimiento de desempeño, cuadros de concentración por asignatura e índices de aprobación.</p>
      </div>

      <div className="border-b border-slate-200 no-print">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('reportes')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${activeTab === 'reportes' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <BookOpen className="w-4 h-4" /> Evaluación y Cuadros de Concentración
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
      
      {/* EVALUACIÓN Y CUADROS DE CONCENTRACIÓN */}
      {activeTab === 'reportes' && (
        <EvaluacionDocenteWidget students={students} />
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
