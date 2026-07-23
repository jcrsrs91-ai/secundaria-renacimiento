import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { ScanFace, LogIn, LogOut, Clock, BarChart3, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';
import ReportesAsistencia from '../../components/ReportesAsistencia';

export default function Asistencia() {
  const [activeTab, setActiveTab] = useState('ESCANER'); // 'ESCANER' o 'REPORTES'
  const [modo, setModo] = useState('ENTRADA'); // 'ENTRADA' o 'SALIDA'
  const [inputValue, setInputValue] = useState('');
  const [ultimosRegistros, setUltimosRegistros] = useState([]);
  const [procesando, setProcesando] = useState(false);
  const inputRef = useRef(null);

  // Mantener el foco en el input oculto para el escáner
  useEffect(() => {
    const focusInterval = setInterval(() => {
      if (activeTab === 'ESCANER' && inputRef.current && document.activeElement !== inputRef.current) {
        inputRef.current.focus();
      }
    }, 1000);
    return () => clearInterval(focusInterval);
  }, [activeTab]);

  // Seleccionar modo por defecto según la hora
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 12) setModo('SALIDA');
  }, []);

  const reproducirSonido = (tipo) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      if (tipo === 'exito') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); // Beep agudo
        oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.3);
      } else {
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(300, audioCtx.currentTime); // Bop grave (error)
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.4);
      }
    } catch (e) {
      console.log("Audio no soportado");
    }
  };

  const procesarEscaneo = async (codigoLeido) => {
    if (procesando || !codigoLeido) return;
    setProcesando(true);
    
    // Extraer la matrícula del URL escaneado.
    // Ejemplo de escaneo: https://web-tec-68.web.app/verificar/12345678
    let matriculaEscaneada = codigoLeido.trim();
    if (matriculaEscaneada.includes('/verificar/')) {
      matriculaEscaneada = matriculaEscaneada.split('/verificar/')[1];
    }

    if (!matriculaEscaneada) {
      toast.error("Código no válido");
      reproducirSonido('error');
      setInputValue('');
      setProcesando(false);
      return;
    }

    try {
      // 1. Buscar al alumno en Firebase
      const q = query(collection(db, 'students'), where('matricula', '==', matriculaEscaneada));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        toast.error(`Matrícula no encontrada: ${matriculaEscaneada}`);
        reproducirSonido('error');
        setInputValue('');
        setProcesando(false);
        return;
      }

      const alumnoData = snapshot.docs[0].data();
      const nombreCompleto = `${alumnoData.nombres} ${alumnoData.apellidoPaterno} ${alumnoData.apellidoMaterno}`;

      // 2. Registrar la asistencia
      const asistenciaData = {
        matricula: matriculaEscaneada,
        nombre: nombreCompleto,
        grado: alumnoData.grado,
        grupo: alumnoData.grupo,
        turno: alumnoData.turno,
        tipo: modo,
        timestamp: serverTimestamp(),
        // Guardamos el chat_id si existe, para facilidad del bot local después
        telegramChatId: alumnoData.telegramChatId || null 
      };

      await addDoc(collection(db, 'asistencias'), asistenciaData);

      // 3. Éxito visual y sonoro
      reproducirSonido('exito');
      
      // Añadir a la lista de registros recientes (en memoria)
      setUltimosRegistros(prev => [
        { id: Date.now(), ...asistenciaData, hora: new Date().toLocaleTimeString() },
        ...prev
      ].slice(0, 10)); // Mostrar solo los últimos 10

    } catch (error) {
      console.error("Error al registrar:", error);
      toast.error("Error de conexión al registrar asistencia");
      reproducirSonido('error');
    }

    // Limpiar para el siguiente escaneo
    setInputValue('');
    setProcesando(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      procesarEscaneo(inputValue);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto min-h-[85vh] flex flex-col items-center">
      
      <div className="w-full flex justify-center mb-8 print:hidden">
        <div className="bg-slate-200 p-1.5 rounded-2xl flex gap-2 w-full max-w-sm">
          <button 
            onClick={() => setActiveTab('ESCANER')}
            className={`flex-1 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${activeTab === 'ESCANER' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <QrCode className="w-5 h-5" /> Escáner
          </button>
          <button 
            onClick={() => setActiveTab('REPORTES')}
            className={`flex-1 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${activeTab === 'REPORTES' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <BarChart3 className="w-5 h-5" /> Reportes
          </button>
        </div>
      </div>

      {activeTab === 'ESCANER' ? (
        <div className="w-full flex flex-col items-center">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-slate-800 flex items-center justify-center gap-3">
              <ScanFace className="h-10 w-10 text-emerald-600" />
              Terminal de Control de Acceso
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Escanea el Código QR de la credencial del alumno para registrar su {modo.toLowerCase()}.</p>
          </div>

      {/* Selectores de Modo */}
      <div className="flex bg-slate-200 p-1.5 rounded-2xl mb-8 shadow-inner w-full max-w-md">
        <button 
          onClick={() => setModo('ENTRADA')}
          className={`flex-1 py-3 px-6 rounded-xl flex items-center justify-center gap-2 font-bold text-lg transition-all ${modo === 'ENTRADA' ? 'bg-white text-emerald-600 shadow-md transform scale-[1.02]' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <LogIn className="h-6 w-6" /> ENTRADA
        </button>
        <button 
          onClick={() => setModo('SALIDA')}
          className={`flex-1 py-3 px-6 rounded-xl flex items-center justify-center gap-2 font-bold text-lg transition-all ${modo === 'SALIDA' ? 'bg-white text-rose-600 shadow-md transform scale-[1.02]' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <LogOut className="h-6 w-6" /> SALIDA
        </button>
      </div>

      {/* Input Oculto / Foco del Escáner */}
      <div className="relative w-full max-w-md mb-12">
        <div className={`absolute inset-0 bg-${modo === 'ENTRADA' ? 'emerald' : 'rose'}-500 blur-2xl opacity-20 rounded-full animate-pulse`}></div>
        <input 
          ref={inputRef}
          type="text" 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          placeholder="Esperando escáner..."
          className={`relative w-full text-center bg-white border-4 ${modo === 'ENTRADA' ? 'border-emerald-400 focus:border-emerald-500 text-emerald-700' : 'border-rose-400 focus:border-rose-500 text-rose-700'} rounded-3xl py-6 text-2xl font-bold shadow-xl outline-none placeholder:text-slate-300 transition-all`}
          disabled={procesando}
        />
        {procesando && (
          <div className="absolute right-6 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-slate-800"></div>
          </div>
        )}
      </div>

      {/* Historial Reciente */}
      <div className="w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex-1">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Clock className="h-5 w-5 text-slate-400" />
          <h2 className="text-lg font-bold text-slate-700">Registros Recientes</h2>
        </div>
        
        {ultimosRegistros.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-medium flex flex-col items-center gap-3">
            <ScanFace className="h-12 w-12 opacity-20" />
            No hay registros en esta sesión. Comienza a escanear credenciales.
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {ultimosRegistros.map((registro, idx) => (
              <div key={registro.id} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center shadow-sm ${registro.tipo === 'ENTRADA' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    {registro.tipo === 'ENTRADA' ? <LogIn className="h-6 w-6" /> : <LogOut className="h-6 w-6" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{registro.nombre}</h3>
                    <div className="flex gap-3 text-sm text-slate-500 font-medium">
                      <span>MAT: {registro.matricula}</span>
                      <span>•</span>
                      <span>{registro.grado?.substring(0,1)}° "{registro.grupo}"</span>
                      <span>•</span>
                      <span className="uppercase">{registro.turno?.substring(0,4)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {registro.telegramChatId ? (
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold flex items-center gap-1 border border-blue-100">
                      Telegram ✔
                    </span>
                  ) : null}
                  <div className="text-right">
                    <p className={`font-black text-xl ${registro.tipo === 'ENTRADA' ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {registro.hora}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
      ) : (
        <div className="w-full">
          <ReportesAsistencia />
        </div>
      )}
    </div>
  );
}
