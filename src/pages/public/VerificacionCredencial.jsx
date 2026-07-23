import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { CheckCircle, AlertTriangle, ShieldCheck, User, Phone, Info } from 'lucide-react';

export default function VerificacionCredencial() {
  const { matricula } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const getSchoolCycle = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed, 7 is August
    return month >= 7 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  };

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const q = query(collection(db, 'students'), where('matricula', '==', matricula));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setStudent(snapshot.docs[0].data());
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Error fetching student:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    if (matricula) fetchStudent();
  }, [matricula]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mb-4"></div>
        <p className="text-slate-600 font-medium">Verificando registro en el sistema...</p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Credencial No Encontrada</h1>
        <p className="text-slate-600 mb-6">
          No se encontró un alumno activo con esta matrícula en la base de datos oficial.
        </p>
        <Link to="/" className="px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition">
          Ir al Inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center py-8 px-4 font-sans relative overflow-hidden">
      
      {/* Background Decorative */}
      <div className="absolute top-0 left-0 w-full h-64 bg-slate-900 shadow-xl z-0"></div>
      
      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        {/* Logos Oficiales */}
        <div className="flex justify-between items-center w-full px-2 mb-6">
           <img src="/logo-escuela.png" alt="Escuela" className="h-14 drop-shadow-md bg-white/10 rounded-full p-1" />
           <img src="/logo-sep.png" alt="SEP" className="h-10 drop-shadow-md bg-white/80 rounded px-2" />
        </div>
        
        {/* Tarjeta Principal de Verificación */}
        <div className="w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
          
          <div className="bg-emerald-500 py-3 px-4 flex items-center justify-center gap-2 text-white">
            <ShieldCheck className="h-6 w-6" />
            <h2 className="text-lg font-bold tracking-wide">REGISTRO OFICIAL ACTIVO</h2>
          </div>

          <div className="p-6 flex flex-col items-center">
             
             {/* Foto de Perfil */}
             <div className="relative mb-4">
                <div className="h-32 w-32 rounded-full border-4 border-slate-100 shadow-lg overflow-hidden bg-slate-50">
                  {student.fotoUrl ? (
                    <img src={student.fotoUrl} alt="Alumno" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-slate-400">
                      <User className="h-16 w-16" />
                    </div>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 bg-emerald-500 rounded-full p-1.5 shadow-md border-2 border-white">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
             </div>
             
             {/* Información Escolar */}
             <h1 className="text-2xl font-black text-slate-800 text-center uppercase leading-tight mb-1">
               {student.nombres} <br/> {student.apellidoPaterno} {student.apellidoMaterno}
             </h1>
             
             <p className="text-slate-500 font-medium tracking-widest text-sm mb-1">
               MATRÍCULA: {student.matricula}
             </p>
             <div className="bg-slate-800 rounded px-2 py-0.5 mb-4">
                <p className="text-[10px] font-black text-white uppercase tracking-widest">
                  VIGENCIA: {getSchoolCycle()}
                </p>
             </div>
             
             <div className="grid grid-cols-2 gap-3 w-full mb-6">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col items-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Grado / Grupo</span>
                  <span className="font-black text-slate-700 text-lg">{student.grado?.substring(0,1)}° "{student.grupo || '-'}"</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col items-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Turno</span>
                  <span className="font-black text-slate-700 text-lg uppercase">{student.turno?.substring(0,4)}</span>
                </div>
             </div>
             
             {/* Datos de Emergencia */}
             <div className="w-full border-t border-slate-100 pt-5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                  <Info className="h-4 w-4" /> Datos Médicos y Contacto
                </h3>
                
                <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                   <div className="flex justify-between items-center mb-3 pb-3 border-b border-red-200/60">
                      <span className="text-xs font-bold text-red-800">TIPO DE SANGRE</span>
                      <span className="font-black text-red-600 text-sm">{student.tipoSangre || 'NO ESPECIFICADO'}</span>
                   </div>
                   <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-red-800 uppercase">Avisar en emergencia a:</span>
                      <span className="font-semibold text-slate-800 text-sm leading-tight">{student.nombreTutor || 'No Registrado'}</span>
                      <a href={`tel:${student.telefonoTutor}`} className="flex items-center gap-1.5 mt-1 text-slate-600 font-medium text-sm">
                        <Phone className="h-3.5 w-3.5 text-slate-400" /> 
                        {student.telefonoTutor || 'N/A'}
                      </a>
                   </div>
                </div>
             </div>
             
          </div>
          
          <div className="bg-slate-50 px-4 py-3 text-center border-t border-slate-100">
             <p className="text-[8px] font-medium text-slate-400 leading-relaxed text-justify">
               SISTEMA EDUCATIVO NACIONAL. Esta página confirma la validez de la credencial física escaneada y acredita al estudiante como alumno activo de la Institución en el ciclo escolar vigente. Documento con validez oficial.
             </p>
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-8 text-center text-slate-500 text-xs font-medium opacity-80">
          &copy; {new Date().getFullYear()} Escuela Secundaria Renacimiento<br/>C.C.T. 12DST0077B
        </div>
      </div>
    </div>
  );
}
