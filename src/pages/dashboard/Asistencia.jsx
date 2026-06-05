import { useState, useEffect } from 'react';
import { Scan, CheckCircle, XCircle, Clock, MessageCircle, AlertTriangle } from 'lucide-react';
import { db } from '../../firebase';
import { doc, getDoc, collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export default function EscanerAccesos() {
  const [scanResult, setScanResult] = useState({ status: 'idle', student: null, msg: '', type: '' });
  const [buffer, setBuffer] = useState('');
  
  // Capturar el input del escáner USB (teclado rápido)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignorar si el usuario está escribiendo en algún input real (por si acaso)
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'Enter') {
        if (buffer.trim() !== '') {
          processQR(buffer.trim());
          setBuffer('');
        }
      } else if (e.key.length === 1) {
        setBuffer(prev => prev + e.key);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [buffer]);

  const processQR = async (qrString) => {
    try {
      setScanResult({ status: 'loading', student: null, msg: 'Consultando base de datos...', type: '' });
      let data;
      try {
        data = JSON.parse(qrString);
      } catch(e) {
        throw new Error("Código no pertenece a esta escuela.");
      }
      
      if (!data.id || !data.c) throw new Error("Formato de credencial inválido.");
      if (data.c !== "25-26") throw new Error("¡Credencial de un ciclo caducado! Debe renovar.");

      const studentRef = doc(db, 'students', data.id);
      const studentSnap = await getDoc(studentRef);

      if (!studentSnap.exists()) throw new Error("Alumno no encontrado en la base de datos.");
      
      const student = { id: studentSnap.id, ...studentSnap.data() };
      if (student.status !== 'Activo') throw new Error("Alumno dado de baja o inactivo.");

      // Determinar si es Entrada o Salida
      const hoy = new Date();
      hoy.setHours(0,0,0,0);
      
      const asistenciasRef = collection(db, 'asistencias');
      const q = query(asistenciasRef, where('studentId', '==', student.id), where('timestamp', '>=', hoy), orderBy('timestamp', 'desc'), limit(1));
      const asisSnap = await getDocs(q);
      
      let tipoRegistro = 'Entrada';
      if (!asisSnap.empty) {
        const lastAsis = asisSnap.docs[0].data();
        if (lastAsis.type === 'Entrada') tipoRegistro = 'Salida';
        if (lastAsis.type === 'Salida') throw new Error("El alumno ya registró su salida oficial hoy.");
      }

      await addDoc(asistenciasRef, {
        studentId: student.id,
        timestamp: new Date(),
        type: tipoRegistro
      });

      setScanResult({ status: 'success', student, msg: 'Acceso Registrado Exitosamente', type: tipoRegistro });
      
      // Auto-limpiar despues de 6 segundos
      setTimeout(() => {
        setScanResult(prev => prev.status === 'success' ? { status: 'idle', student: null, msg: '', type: '' } : prev);
      }, 6000);

    } catch (err) {
      console.error(err);
      setScanResult({ status: 'error', student: null, msg: err.message, type: '' });
      setTimeout(() => setScanResult(prev => prev.status === 'error' ? { status: 'idle', student: null, msg: '', type: '' } : prev), 4000);
    }
  };

  const getWhatsAppLink = () => {
    if (!scanResult.student || !scanResult.student.telefono) return '#';
    const tel = scanResult.student.telefono.replace(/\D/g,'');
    const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const msg = `*Aviso Escolar - EST N°68:* El alumno ${scanResult.student.nombres} ${scanResult.student.apellidoPaterno} acaba de registrar su *${scanResult.type}* a la escuela a las ${time}.`;
    return `https://wa.me/52${tel}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] p-4">
       
       {scanResult.status === 'idle' && (
         <div className="text-center animate-pulse">
            <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
               <Scan className="w-16 h-16 text-slate-400" />
            </div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Escáner de Accesos Activo</h2>
            <p className="text-slate-500 mt-2 text-lg font-medium">Pase la credencial por el lector óptico USB.</p>
         </div>
       )}

       {scanResult.status === 'loading' && (
         <div className="text-center">
            <div className="w-32 h-32 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-slate-800">{scanResult.msg}</h2>
         </div>
       )}

       {scanResult.status === 'error' && (
         <div className="text-center bg-rose-50 p-12 rounded-3xl border-2 border-rose-200 shadow-xl w-full max-w-2xl transform transition-all scale-100 animate-in zoom-in-95">
            <XCircle className="w-24 h-24 text-rose-500 mx-auto mb-6 drop-shadow-md" />
            <h2 className="text-4xl font-black text-rose-700 tracking-tight uppercase">Acceso Denegado</h2>
            <p className="text-rose-600 mt-4 text-xl font-medium">{scanResult.msg}</p>
         </div>
       )}

       {scanResult.status === 'success' && scanResult.student && (
         <div className="bg-emerald-50 rounded-3xl border-2 border-emerald-400 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col md:flex-row transform transition-all scale-100 animate-in zoom-in-95">
            <div className="w-full md:w-1/3 bg-emerald-600 p-8 flex flex-col items-center justify-center text-white relative">
                <CheckCircle className="w-20 h-20 mb-4 drop-shadow-lg" />
                <h2 className="text-3xl font-black tracking-tight uppercase">{scanResult.type}</h2>
                <div className="flex items-center mt-2 opacity-90 font-medium">
                  <Clock className="w-5 h-5 mr-1" /> {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
            </div>
            <div className="w-full md:w-2/3 p-8 bg-white flex flex-col justify-center relative">
                {scanResult.student.fotoUrl && (
                  <img src={scanResult.student.fotoUrl} alt="Foto" className="absolute top-8 right-8 w-24 h-24 rounded-lg object-cover shadow-md border-2 border-slate-100" />
                )}
                <p className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-1">Acceso Autorizado</p>
                <h3 className="text-3xl font-black text-slate-800 uppercase leading-tight w-3/4 mb-1">
                  {scanResult.student.nombres} <br/>
                  {scanResult.student.apellidoPaterno} {scanResult.student.apellidoMaterno}
                </h3>
                <div className="mt-4 flex gap-4 text-slate-600 font-medium">
                   <span className="bg-slate-100 px-3 py-1 rounded-full text-sm">{scanResult.student.grado}</span>
                   <span className="bg-slate-100 px-3 py-1 rounded-full text-sm">Grupo "{scanResult.student.grupo}"</span>
                </div>
                
                {/* Whatsapp action */}
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <p className="text-xs text-slate-400 font-medium mb-3">SISTEMA DE NOTIFICACIONES</p>
                  <a href={getWhatsAppLink()} target="_blank" rel="noreferrer" className="inline-flex items-center px-5 py-2.5 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 shadow-md transition-colors">
                     <MessageCircle className="w-5 h-5 mr-2" /> Enviar Aviso a Tutor por WhatsApp Web
                  </a>
                </div>
            </div>
         </div>
       )}
       
       <div className="fixed bottom-4 left-0 right-0 text-center pointer-events-none">
          <p className="text-xs font-medium text-slate-400 bg-white/80 inline-block px-3 py-1 rounded-full shadow-sm">
             Escuchando puerto USB del Escáner. No es necesario hacer clic en nada.
          </p>
       </div>
    </div>
  );
}
