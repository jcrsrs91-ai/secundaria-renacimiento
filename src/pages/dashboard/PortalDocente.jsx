import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { GraduationCap } from 'lucide-react';
import EvaluacionDocenteWidget from '../../components/EvaluacionDocenteWidget';

export default function PortalDocente() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'students'), (snapshot) => {
      const list = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      setStudents(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 no-print">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-primary-600" />
            Portal Docente: Evaluación y Cuadros de Concentración
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Captura las calificaciones de tu asignatura. El sistema calculará automáticamente Existencia, Regulares, Irregulares, Promedio de Aprovechamiento y % de Aprobación para tus cuadros de Coordinación.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-500 no-print">
          Cargando matrícula de alumnos...
        </div>
      ) : (
        <EvaluacionDocenteWidget students={students} />
      )}
    </div>
  );
}
