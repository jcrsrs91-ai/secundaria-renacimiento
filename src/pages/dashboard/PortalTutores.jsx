import { useState, useEffect, useRef, useMemo } from 'react';
import { Newspaper, User, BellRing, FileText, CheckCircle2, Clock, LogOut, MessageSquare, Send, Check, CheckCheck, Printer, Award, Sparkles, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGlobalConfig } from '../../hooks/useGlobalConfig';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy, limit, onSnapshot, doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { truncateTo1Dec, roundToIntGrade, getCalificacionFinal, getPromedioTrimestrePASEG, getPromedioGeneralPASEG, autoAcentuar } from '../../utils/format';
import BoletaPrint from '../../components/BoletaPrint';
import { inferirTurnoChat, HORARIOS_TURNO } from '../../components/FloatingBuzonWidget';

// Verifica si la hora actual está dentro del horario laboral del turno correspondiente (Lunes a Viernes)
const estaEnHorarioDeTurno = (turno) => {
  const now = new Date();
  const day = now.getDay(); // 0 = Domingo, 6 = Sábado
  if (day === 0 || day === 6) return false;
  const decimalHour = now.getHours() + now.getMinutes() / 60;
  if (turno === 'Vespertino') {
    // Turno Vespertino: 1:30 PM (13.5) a 7:30 PM (19.5)
    return decimalHour >= 13.5 && decimalHour <= 19.5;
  }
  // Turno Matutino: 7:00 AM (7.0) a 1:30 PM (13.5)
  return decimalHour >= 7.0 && decimalHour <= 13.5;
};

const materiasPorGrado = {
  '1er Grado': [
    { id: 'espanol1', name: 'Español I' }, { id: 'ingles1', name: 'Inglés I' }, { id: 'artes1', name: 'Artes I' },
    { id: 'matematicas1', name: 'Matemáticas I' }, { id: 'biologia', name: 'Ciencias I (Biología)' },
    { id: 'geografia', name: 'Geografía' }, { id: 'historia1', name: 'Historia I' }, { id: 'fce1', name: 'Formación Cívica y Ética I' },
    { id: 'tecnologia1', name: 'Tecnología I' }, { id: 'educfisica1', name: 'Educación Física I' }
  ],
  '2do Grado': [
    { id: 'espanol2', name: 'Español II' }, { id: 'ingles2', name: 'Inglés II' }, { id: 'artes2', name: 'Artes II' },
    { id: 'matematicas2', name: 'Matemáticas II' }, { id: 'fisica', name: 'Ciencias II (Física)' },
    { id: 'historia2', name: 'Historia II' }, { id: 'fce2', name: 'Formación Cívica y Ética II' },
    { id: 'tecnologia2', name: 'Tecnología II' }, { id: 'educfisica2', name: 'Educación Física II' }
  ],
  '3er Grado': [
    { id: 'espanol3', name: 'Español III' }, { id: 'ingles3', name: 'Inglés III' }, { id: 'artes3', name: 'Artes III' },
    { id: 'matematicas3', name: 'Matemáticas III' }, { id: 'quimica', name: 'Ciencias III (Química)' },
    { id: 'historia3', name: 'Historia III' }, { id: 'fce3', name: 'Formación Cívica y Ética III' },
    { id: 'tecnologia3', name: 'Tecnología III' }, { id: 'educfisica3', name: 'Educación Física III' }
  ]
};

export default function PortalTutores() {
  const [activeTab, setActiveTab] = useState('expediente');
  const { studentSession, loginAsStudent, logout } = useAuth();
  const { config } = useGlobalConfig();
  const [liveStudent, setLiveStudent] = useState(studentSession);
  const [noticias, setNoticias] = useState([]);
  const [loadingAvisos, setLoadingAvisos] = useState(true);

  const turnoAlumno = useMemo(() => inferirTurnoChat(liveStudent), [liveStudent]);
  const [activeShiftTab, setActiveShiftTab] = useState('matutino');

  useEffect(() => {
    if (turnoAlumno) {
      setActiveShiftTab(turnoAlumno.toLowerCase());
    }
  }, [turnoAlumno]);
  
  // Chat States
  const [messages, setMessages] = useState([]);
  const [chatDoc, setChatDoc] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Sincronización en tiempo real del expediente y calificaciones del alumno
  useEffect(() => {
    if (!studentSession?.id) return;
    setLiveStudent(studentSession);

    const studentRef = doc(db, 'students', studentSession.id);
    const unsubStudent = onSnapshot(studentRef, (snap) => {
      if (snap.exists()) {
        const updated = { id: snap.id, ...snap.data() };
        setLiveStudent(updated);
        if (typeof loginAsStudent === 'function') {
          loginAsStudent(updated);
        }
      }
    });

    return () => unsubStudent();
  }, [studentSession?.id]);

  // Escuchar documento principal del chat (para saber si hay mensajes no leídos o vistos) y la subcolección de mensajes
  useEffect(() => {
    if (!studentSession) return;
    
    const chatRef = doc(db, 'chats', studentSession.id);
    const unsubChatDoc = onSnapshot(chatRef, (snap) => {
      if (snap.exists()) {
        setChatDoc({ id: snap.id, ...snap.data() });
      }
    });

    const msgsRef = collection(chatRef, 'messages');
    const unsubscribe = onSnapshot(msgsRef, (snapshot) => {
      let msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      msgs.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeA - timeB;
      });

      setMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => {
      unsubChatDoc();
      unsubscribe();
    };
  }, [studentSession]);

  // Marcar como leídos cuando abre la pestaña o recibe un mensaje con la pestaña abierta
  useEffect(() => {
    if (activeTab === 'mensajes' && studentSession && chatDoc?.unreadTutor) {
      updateDoc(doc(db, 'chats', studentSession.id), { unreadTutor: false }).catch(() => {});
    }
  }, [activeTab, studentSession, chatDoc?.unreadTutor]);

  const sendMessage = async (e, customText = null) => {
    if (e) e.preventDefault();
    const textToSend = (customText !== null ? customText : newMessage).trim();
    if (!textToSend || !liveStudent) return;

    if (customText === null) setNewMessage('');

    const turnoActual = inferirTurnoChat(liveStudent);
    const enHorario = estaEnHorarioDeTurno(turnoActual);

    try {
      const chatRef = doc(db, 'chats', liveStudent.id);
      
      await setDoc(chatRef, {
        studentName: `${liveStudent.nombres || ''} ${liveStudent.apellidoPaterno || ''} ${liveStudent.apellidoMaterno || ''}`.trim(),
        matricula: liveStudent.matricula || liveStudent.id,
        grado: liveStudent.grado || '',
        grupo: liveStudent.grupo || '',
        turno: turnoActual,
        caseStatus: 'pendiente',
        lastMessage: textToSend,
        lastSender: 'tutor',
        updatedAt: serverTimestamp(),
        unreadAdmin: true,
        unreadTutor: false
      }, { merge: true });

      await setDoc(doc(collection(chatRef, 'messages')), {
        text: textToSend,
        sender: 'tutor',
        createdAt: serverTimestamp()
      });

      // Si el tutor escribe fuera del horario de su turno (Matutino o Vespertino), enviar acuse automático de tranquilidad
      const recentSystemMsg = messages.some(m => {
        if (m.sender !== 'system') return false;
        const diffSec = Math.floor(Date.now() / 1000) - (m.createdAt?.seconds || 0);
        return diffSec < 14400; // no repetir en 4 horas
      });

      if (!enHorario && !recentSystemMsg) {
        const autoReplyText =
          turnoActual === 'Vespertino'
            ? '🌙 Hemos recibido tu mensaje en Control Escolar (Turno Vespertino). En este momento nos encontramos fuera de horario de ventanilla, pero tu mensaje ya quedó registrado como PRIORITARIO para ser atendido en nuestro horario del Turno Vespertino: Lunes a Viernes de 2:00 PM a 7:30 PM.'
            : '☀️ Hemos recibido tu mensaje en Control Escolar (Turno Matutino). En este momento nos encontramos fuera de horario de ventanilla, pero tu mensaje ya quedó registrado como PRIORITARIO para ser atendido en nuestro horario del Turno Matutino: Lunes a Viernes de 7:30 AM a 1:30 PM.';

        setTimeout(async () => {
          try {
            await setDoc(doc(collection(chatRef, 'messages')), {
              text: autoReplyText,
              sender: 'system',
              senderName: `Recepción Automática (${turnoActual})`,
              createdAt: serverTimestamp()
            });
          } catch {
            // ignore
          }
        }, 900);
      }
    } catch (error) {
      console.error("Error enviando mensaje:", error);
    }
  };

  useEffect(() => {
    const fetchAvisos = async () => {
      try {
        const q = query(
          collection(db, 'avisos'),
          where('isActive', '==', true),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        const snapshot = await getDocs(q);
        const avisosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNoticias(avisosData);
      } catch (error) {
        console.error("Error fetching avisos:", error);
      } finally {
        setLoadingAvisos(false);
      }
    };
    fetchAvisos();
  }, []);

  const pubT1 = config?.trimestresPublicadosPadres?.t1 !== false;
  const pubT2 = config?.trimestresPublicadosPadres?.t2 !== false;
  const pubT3 = config?.trimestresPublicadosPadres?.t3 !== false;

  // Filtrar solo los trimestres que Control Escolar haya marcado como publicados para padres
  const studentForParents = useMemo(() => {
    if (!liveStudent) return null;
    const rawCalif = liveStudent.calificaciones || {};
    return {
      ...liveStudent,
      calificaciones: {
        t1: pubT1 ? (rawCalif.t1 || {}) : {},
        t2: pubT2 ? (rawCalif.t2 || {}) : {},
        t3: pubT3 ? (rawCalif.t3 || {}) : {}
      }
    };
  }, [liveStudent, pubT1, pubT2, pubT3]);

  if (!liveStudent || !studentForParents) return <div className="p-8 text-center">Cargando...</div>;

  const materiasAlumno = materiasPorGrado[liveStudent.grado] || [];
  const promT1 = pubT1 ? truncateTo1Dec(getPromedioTrimestrePASEG(studentForParents, materiasAlumno, 't1')) : '-';
  const promT2 = pubT2 ? truncateTo1Dec(getPromedioTrimestrePASEG(studentForParents, materiasAlumno, 't2')) : '-';
  const promT3 = pubT3 ? truncateTo1Dec(getPromedioTrimestrePASEG(studentForParents, materiasAlumno, 't3')) : '-';
  const promGral = truncateTo1Dec(getPromedioGeneralPASEG(studentForParents, materiasAlumno));

  const docsMap = liveStudent.documentos || {};
  const docsList = [
    { key: 'actaNacimiento', label: 'Acta de Nacimiento' },
    { key: 'curpDoc', label: 'CURP Actualizada' },
    { key: 'certificadoPrimaria', label: 'Certificado de Primaria' },
    { key: 'comprobanteDomicilio', label: 'Comprobante de Domicilio' },
    { key: 'ineTutor', label: 'INE del Padre o Tutor' }
  ];

  return (
    <>
      <div className="space-y-6 max-w-5xl mx-auto no-print">
        {/* Header del Alumno */}
        <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-64 h-64 rounded-full bg-primary-600 blur-3xl opacity-20"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center md:items-start gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6">
              <div className="w-20 h-20 bg-slate-800 rounded-full border-4 border-slate-700 flex items-center justify-center text-3xl font-bold uppercase overflow-hidden shrink-0">
                {liveStudent.fotoUrl ? (
                  <img src={liveStudent.fotoUrl} alt="Foto" className="w-full h-full object-cover" />
                ) : (
                  liveStudent.nombres ? liveStudent.nombres.charAt(0) : 'A'
                )}
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold uppercase">
                  {autoAcentuar(`${liveStudent.nombres || ''} ${liveStudent.apellidoPaterno || ''} ${liveStudent.apellidoMaterno || ''}`.trim())}
                </h2>
                <p className="text-slate-300 mt-1 text-sm sm:text-base">
                  Matrícula: <span className="font-mono font-semibold text-white">{liveStudent.matricula}</span> | {liveStudent.grado} Grupo "{liveStudent.grupo || '-'}" ({liveStudent.turno || 'Matutino'})
                </p>
                <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-2">
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold border border-emerald-500/30 flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Alumno {liveStudent.status || 'Activo'}
                  </span>
                  {liveStudent.taller && (
                    <span className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-xs font-semibold border border-primary-500/30 flex items-center">
                      Taller: {liveStudent.taller.split('(')[0].trim()}
                    </span>
                  )}
                  {promGral !== '-' && (
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-bold border border-amber-500/30 flex items-center">
                      <Award className="w-3.5 h-3.5 mr-1" /> Promedio General PASEG: {promGral}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-center md:text-right flex flex-row md:flex-col items-center md:items-end gap-3">
              <button onClick={logout} className="flex items-center text-sky-400 hover:text-sky-300 transition-colors text-sm font-semibold px-3 py-1.5 rounded-lg bg-slate-800/70">
                <LogOut className="w-4 h-4 mr-1.5" /> Cerrar Sesión
              </button>
              <div className="px-3 py-1 bg-slate-800/50 rounded-full text-xs text-emerald-400 font-medium flex items-center">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
                En línea (Tiempo Real)
              </div>
            </div>
          </div>
        </div>

        {/* Alerta Principal si Control Escolar envió un mensaje nuevo */}
        {chatDoc?.unreadTutor && activeTab !== 'mensajes' && (
          <div
            onClick={() => setActiveTab('mensajes')}
            className="bg-rose-600 hover:bg-rose-700 text-white rounded-2xl p-4 shadow-lg cursor-pointer transition-all flex items-center justify-between gap-4 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-extrabold text-sm sm:text-base">
                  ¡Tienes un nuevo mensaje de Control Escolar!
                </p>
                <p className="text-xs text-rose-100 line-clamp-1">
                  "{chatDoc.lastMessage}"
                </p>
              </div>
            </div>
            <span className="px-3 py-1.5 bg-white text-rose-700 font-extrabold text-xs rounded-xl shrink-0 shadow-xs">
              Ver y Responder →
            </span>
          </div>
        )}

        {/* Tabs adaptadas a móvil */}
        <div className="border-b border-slate-200 overflow-x-auto">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max px-1">
            <button
              onClick={() => setActiveTab('expediente')}
              className={`py-3.5 px-2 border-b-2 font-bold text-sm transition-colors flex items-center ${activeTab === 'expediente' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <FileText className="w-4 h-4 mr-2" /> Boleta de Calificaciones
            </button>
            <button
              onClick={() => setActiveTab('muro')}
              className={`py-3.5 px-2 border-b-2 font-bold text-sm transition-colors flex items-center ${activeTab === 'muro' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <Newspaper className="w-4 h-4 mr-2" /> Muro de Avisos
            </button>
            <button
              onClick={() => setActiveTab('mensajes')}
              className={`py-3.5 px-2 border-b-2 font-bold text-sm transition-colors flex items-center ${activeTab === 'mensajes' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <MessageSquare className="w-4 h-4 mr-2" /> Mensajes con Control Escolar
              {chatDoc?.unreadTutor && (
                <span className="ml-2 px-2 py-0.5 text-[10px] font-extrabold bg-rose-600 text-white rounded-full animate-bounce">
                  NUEVO
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Expediente Académico y Boleta */}
        {activeTab === 'expediente' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Boleta de Calificaciones */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden lg:col-span-3">
              <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="font-bold text-slate-800 flex items-center text-base sm:text-lg">
                    <FileText className="w-5 h-5 mr-2 text-primary-600" /> Boleta de Evaluación Oficial (Criterio PASEG)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Promedios calculados con truncado oficial a una décima sin redondear, idéntico a PASEG.
                  </p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-colors"
                >
                  <Printer className="w-4 h-4 mr-2" /> Imprimir / Guardar Boleta PDF
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-800 text-white">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Campo Formativo / Disciplina</th>
                      <th className="px-3 sm:px-5 py-3 text-center text-xs font-bold uppercase tracking-wider">
                        Trimestre 1 {!pubT1 && <span className="block text-[9px] font-normal text-amber-300">(En captura)</span>}
                      </th>
                      <th className="px-3 sm:px-5 py-3 text-center text-xs font-bold uppercase tracking-wider">
                        Trimestre 2 {!pubT2 && <span className="block text-[9px] font-normal text-amber-300">(En captura)</span>}
                      </th>
                      <th className="px-3 sm:px-5 py-3 text-center text-xs font-bold uppercase tracking-wider">
                        Trimestre 3 {!pubT3 && <span className="block text-[9px] font-normal text-amber-300">(En captura)</span>}
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-center text-xs font-black uppercase tracking-wider bg-slate-900">Promedio Final</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {materiasAlumno.map((materia) => {
                      const calif = studentForParents.calificaciones || {};
                      const t1 = calif.t1?.[materia.id];
                      const t2 = calif.t2?.[materia.id];
                      const t3 = calif.t3?.[materia.id];
                      
                      const finalObj = getCalificacionFinal(studentForParents, materia.id);
                      const promedioStr = finalObj ? roundToIntGrade(finalObj.valor) : '-';
                      const isReprobada = finalObj ? finalObj.isReprobada : false;
                      
                      return (
                        <tr key={materia.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 sm:px-6 py-3 text-xs sm:text-sm text-slate-800 font-semibold">{materia.name}</td>
                          <td className={`px-3 sm:px-5 py-3 text-xs sm:text-sm text-center font-bold ${!pubT1 ? 'text-slate-400 italic text-[11px]' : t1 && Math.round(Number(t1)) < 6 ? 'text-red-600' : 'text-slate-900'}`}>
                            {!pubT1 ? 'En captura' : (t1 !== undefined && t1 !== '' ? roundToIntGrade(t1) : '-')}
                          </td>
                          <td className={`px-3 sm:px-5 py-3 text-xs sm:text-sm text-center font-bold ${!pubT2 ? 'text-slate-400 italic text-[11px]' : t2 && Math.round(Number(t2)) < 6 ? 'text-red-600' : 'text-slate-900'}`}>
                            {!pubT2 ? 'En captura' : (t2 !== undefined && t2 !== '' ? roundToIntGrade(t2) : '-')}
                          </td>
                          <td className={`px-3 sm:px-5 py-3 text-xs sm:text-sm text-center font-bold ${!pubT3 ? 'text-slate-400 italic text-[11px]' : t3 && Math.round(Number(t3)) < 6 ? 'text-red-600' : 'text-slate-900'}`}>
                            {!pubT3 ? 'En captura' : (t3 !== undefined && t3 !== '' ? roundToIntGrade(t3) : '-')}
                          </td>
                          <td className={`px-3 sm:px-6 py-3 text-xs sm:text-sm text-center font-black bg-slate-50/80 ${promedioStr === '-' ? 'text-slate-400' : isReprobada ? 'text-red-600' : 'text-emerald-700'}`}>
                            {promedioStr}{finalObj?.isRegularizacion ? '*' : ''}
                          </td>
                        </tr>
                      );
                    })}
                    {materiasAlumno.length > 0 && (
                      <tr className="bg-slate-100 border-t-2 border-slate-300 font-black">
                        <td className="px-4 sm:px-6 py-3.5 text-xs sm:text-sm text-slate-900 uppercase text-right">
                          Promedio General (PASEG)
                        </td>
                        <td className="px-3 sm:px-5 py-3.5 text-xs sm:text-sm text-center text-slate-800">{promT1}</td>
                        <td className="px-3 sm:px-5 py-3.5 text-xs sm:text-sm text-center text-slate-800">{promT2}</td>
                        <td className="px-3 sm:px-5 py-3.5 text-xs sm:text-sm text-center text-slate-800">{promT3}</td>
                        <td className="px-3 sm:px-6 py-3.5 text-sm sm:text-base text-center bg-primary-50 text-primary-900 border-l border-slate-200">
                          {promGral}
                        </td>
                      </tr>
                    )}
                    {materiasAlumno.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-6 py-6 text-center text-slate-500 text-sm">
                          No hay materias registradas para este grado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-2 text-center sm:text-left">
                <p className="text-xs text-slate-500 italic">
                  Las calificaciones se actualizan en tiempo real conforme los docentes y Control Escolar liberan cada periodo trimestral.
                </p>
                <span className="text-[11px] font-semibold text-slate-600 bg-white px-2.5 py-1 rounded border border-slate-200">
                  Método PASEG: Promedio truncado a 1 décima
                </span>
              </div>
            </div>
            
            {/* Documentos Recibidos */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 lg:col-span-2">
              <h3 className="font-bold text-slate-800 border-b pb-2 mb-4">Expediente de Documentos en Control Escolar</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                {docsList.map(item => {
                  const entregado = docsMap[item.key] !== false;
                  return (
                    <div key={item.key} className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-sm text-slate-600">{item.label}</span>
                      {entregado ? (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">Entregado</span>
                      ) : (
                        <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center">
                          <Clock className="w-3 h-3 mr-1" /> Pendiente
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Contacto rápido con Horarios de Ambos Turnos */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-800 border-b pb-2 mb-3">Atención a Padres y Tutores</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  ¿Tienes alguna duda sobre una calificación, inasistencia o trámite de constancia? Comunícate directamente con Control Escolar de tu turno.
                </p>
                <div className="space-y-2 text-[11px]">
                  <div className={`p-2 rounded-lg border flex items-center justify-between ${turnoAlumno === 'Matutino' ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                    <span className="flex items-center gap-1"><Sun className="w-3.5 h-3.5 text-amber-500" /> Turno Matutino:</span>
                    <span>7:30 AM a 1:30 PM</span>
                  </div>
                  <div className={`p-2 rounded-lg border flex items-center justify-between ${turnoAlumno === 'Vespertino' ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                    <span className="flex items-center gap-1"><Moon className="w-3.5 h-3.5 text-indigo-500" /> Turno Vespertino:</span>
                    <span>2:00 PM a 7:30 PM</span>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <button onClick={() => setActiveTab('mensajes')} className="w-full flex items-center justify-center py-2.5 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition shadow-sm">
                  <MessageSquare className="w-4 h-4 mr-2" /> Enviar Mensaje ({turnoAlumno})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Muro de Noticias */}
        {activeTab === 'muro' && (
          <div className="space-y-6">
            {/* Selector de avisos por Turno */}
            <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-600">Mostrando avisos de:</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveShiftTab('matutino')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                    activeShiftTab === 'matutino' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" /> Matutino
                </button>
                <button
                  type="button"
                  onClick={() => setActiveShiftTab('vespertino')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                    activeShiftTab === 'vespertino' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" /> Vespertino
                </button>
              </div>
            </div>
            {loadingAvisos ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : noticias.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-500">
                No hay avisos recientes por el momento.
              </div>
            ) : (
              noticias.filter(a => !a.turno || a.turno === 'ambos' || a.turno === activeShiftTab).map(n => (
                <div key={n.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-sky-50 text-sky-500 rounded-lg">
                        <BellRing className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 mb-1">{n.title}</h3>
                        {n.imageUrl && (
                          <div className="mb-3 rounded-lg overflow-hidden border border-slate-200">
                            <img src={n.imageUrl} alt="Flyer del Aviso" className="w-full h-auto object-cover max-h-40" />
                          </div>
                        )}
                        <p className="text-xs text-slate-500 mt-1">
                          {n.createdAt && new Date(n.createdAt.seconds * 1000).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                  {n.content.trim().startsWith('<') ? (
                    <div className="text-slate-600 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: n.content }} />
                  ) : (
                    <p className="text-slate-600 whitespace-pre-wrap">{n.content}</p>
                  )}
                </div>
              ))
            )}
            
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="font-bold text-blue-800 mb-2">Directorio de Dependencias de Apoyo</h3>
              <p className="text-sm text-blue-600 mb-4">¿Necesitas ayuda médica, familiar o legal? Consulta las instituciones disponibles para ti.</p>
              <a href="https://www.gob.mx/sep/acciones-y-programas/directorio-de-dependencias-de-apoyo" target="_blank" rel="noreferrer" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">Ver Directorio</a>
            </div>
          </div>
        )}

        {/* Chat / Mensajes Directos */}
        {activeTab === 'mensajes' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[620px]">
            <div className="p-4 bg-slate-900 text-white flex flex-wrap justify-between items-center gap-2">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center mr-3">
                  <User className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-50 flex items-center gap-2">
                    Control Escolar • Turno {turnoAlumno}
                  </h3>
                  <p className="text-xs text-emerald-400 font-medium">
                    {turnoAlumno === 'Vespertino'
                      ? '🌙 Horario de Ventanilla Vespertino: Lunes a Viernes de 2:00 PM a 7:30 PM'
                      : '☀️ Horario de Ventanilla Matutino: Lunes a Viernes de 7:30 AM a 1:30 PM'}
                  </p>
                </div>
              </div>
              {chatDoc?.lastSender === 'tutor' && (
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex items-center ${
                  chatDoc?.unreadAdmin
                    ? 'bg-slate-800 text-slate-300'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {chatDoc?.unreadAdmin ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1" /> Enviado a Control Escolar
                    </>
                  ) : (
                    <>
                      <CheckCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Visto por Control Escolar
                    </>
                  )}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
              <div className="text-center">
                <span className="text-xs bg-slate-200 text-slate-600 px-3 py-1 rounded-full font-medium">Inicio de la conversación</span>
              </div>
              {messages.length === 0 ? (
                <div className="text-center mt-10">
                  <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">Escribe tu primer mensaje</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Control Escolar recibe una alerta inmediata y responderá tus dudas por este medio.</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isTutor = msg.sender === 'tutor';
                  return (
                    <div key={msg.id} className={`flex flex-col ${isTutor ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${isTutor ? 'bg-primary-600 text-white rounded-br-none shadow-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'}`}>
                        {!isTutor && (
                          <p className="text-[10px] font-bold text-primary-600 mb-0.5">
                            {msg.senderName || 'Control Escolar EST N°68'}
                          </p>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        {msg.createdAt?.seconds && new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isTutor && (
                          chatDoc?.unreadAdmin ? (
                            <Check className="w-3 h-3 text-slate-400" title="Enviado" />
                          ) : (
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-500" title="Visto por Control Escolar" />
                          )
                        )}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Botones de consulta rápida para padres */}
            <div className="bg-slate-100/80 border-t border-slate-200 px-4 py-2">
              <p className="text-[11px] font-bold text-slate-600 mb-1.5 flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500" /> Consultas rápidas (toca una para escribirla):
              </p>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {[
                  'Hola, buen día. Quisiera solicitar una constancia de estudios.',
                  'Buen día, tengo una duda sobre una calificación de la boleta.',
                  'Hola, quisiera informar y justificar una inasistencia de mi hijo(a).',
                  '¿En qué horario puedo acudir a ventanilla de Control Escolar?'
                ].map((qText, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setNewMessage(qText)}
                    className="text-[11px] bg-white hover:bg-primary-50 text-slate-700 border border-slate-200 rounded-full px-3 py-1 whitespace-nowrap transition-colors"
                  >
                    {qText}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 bg-white border-t border-slate-200">
              <form onSubmit={sendMessage} className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Escribe tu duda o mensaje aquí..." 
                  className="flex-1 px-4 py-3 bg-slate-100 border-transparent focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 rounded-xl text-sm transition-all"
                />
                <button 
                  type="submit" 
                  disabled={!newMessage.trim()}
                  className="p-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Burbuja Flotante en Portal de Padres para abrir el Chat desde cualquier pestaña */}
        {activeTab !== 'mensajes' && (
          <button
            onClick={() => setActiveTab('mensajes')}
            className={`fixed bottom-5 right-5 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full shadow-2xl transition-all hover:scale-105 ${
              chatDoc?.unreadTutor
                ? 'bg-rose-600 hover:bg-rose-700 text-white ring-4 ring-rose-500/30 animate-bounce'
                : 'bg-primary-600 hover:bg-primary-700 text-white'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-xs font-extrabold">
              {chatDoc?.unreadTutor ? '¡Mensaje Nuevo de Control Escolar!' : 'Chat con Control Escolar'}
            </span>
          </button>
        )}
      </div>

      {/* Componente de Impresión de Boleta Oficial */}
      <BoletaPrint students={[studentForParents]} materiasPorGrado={materiasPorGrado} />
    </>
  );
}
