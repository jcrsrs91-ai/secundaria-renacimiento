import { useState, useEffect, useRef } from 'react';
import { Newspaper, User, BellRing, FileText, CheckCircle2, Clock, LogOut, MessageSquare, Send, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy, limit, onSnapshot, doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

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
  const [activeTab, setActiveTab] = useState('muro');
  const { studentSession, logout } = useAuth();
  const [noticias, setNoticias] = useState([]);
  const [loadingAvisos, setLoadingAvisos] = useState(true);
  
  // Chat States
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Escuchar mensajes del chat
  useEffect(() => {
    if (!studentSession) return;
    
    const chatRef = doc(db, 'chats', studentSession.id);
    const msgsQuery = query(collection(chatRef, 'messages'), orderBy('createdAt', 'asc'));
    
    const unsubscribe = onSnapshot(msgsQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribe();
  }, [studentSession]);

  // Marcar como leídos cuando abre la pestaña
  useEffect(() => {
    if (activeTab === 'mensajes' && studentSession) {
      updateDoc(doc(db, 'chats', studentSession.id), { unreadTutor: false }).catch(() => {});
    }
  }, [activeTab, studentSession]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !studentSession) return;

    const textToSend = newMessage.trim();
    setNewMessage('');

    try {
      const chatRef = doc(db, 'chats', studentSession.id);
      
      // Update or create chat document
      await setDoc(chatRef, {
        studentName: `${studentSession.nombres} ${studentSession.apellidoPaterno} ${studentSession.apellidoMaterno}`,
        grado: studentSession.grado || '',
        grupo: studentSession.grupo || '',
        lastMessage: textToSend,
        updatedAt: serverTimestamp(),
        unreadAdmin: true,
        unreadTutor: false
      }, { merge: true });

      // Add message
      await setDoc(doc(collection(chatRef, 'messages')), {
        text: textToSend,
        sender: 'tutor',
        createdAt: serverTimestamp()
      });
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

  if (!studentSession) return <div className="p-8 text-center">Cargando...</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header del Alumno */}
      <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-64 h-64 rounded-full bg-primary-600 blur-3xl opacity-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center md:items-start gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-slate-800 rounded-full border-4 border-slate-700 flex items-center justify-center text-3xl font-bold uppercase overflow-hidden">
              {studentSession.fotoUrl ? (
                <img src={studentSession.fotoUrl} alt="Foto" className="w-full h-full object-cover" />
              ) : (
                studentSession.nombres ? studentSession.nombres.charAt(0) : 'A'
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{studentSession.nombres} {studentSession.apellidoPaterno} {studentSession.apellidoMaterno}</h2>
              <p className="text-slate-400 mt-1">Matrícula: {studentSession.matricula} | {studentSession.grado} Grupo "{studentSession.grupo || '-'}"</p>
              <div className="mt-3 flex gap-2">
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold border border-emerald-500/30 flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Alumno Activo
                </span>
                {studentSession.taller && (
                  <span className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-xs font-semibold border border-primary-500/30 flex items-center">
                    Taller: {studentSession.taller.split('(')[0].trim()}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-center md:text-right flex flex-col items-end">
            <button onClick={logout} className="mb-4 flex items-center text-rose-400 hover:text-rose-300 transition-colors text-sm font-semibold">
              <LogOut className="w-4 h-4 mr-1" /> Cerrar Sesión
            </button>
            <div className="px-3 py-1 bg-slate-800/50 rounded-full text-xs text-emerald-400 font-medium flex items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
              Sesión Activa
            </div>
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
          <button
            onClick={() => setActiveTab('mensajes')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${activeTab === 'mensajes' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <MessageSquare className="w-4 h-4 mr-2" /> Mensajes Directos
          </button>
        </nav>
      </div>

      {/* Muro de Noticias */}
      {activeTab === 'muro' && (
        <div className="space-y-6">
          {loadingAvisos ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : noticias.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-500">
              No hay avisos recientes por el momento.
            </div>
          ) : (
            noticias.map(n => (
              <div key={n.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-rose-50 text-rose-500 rounded-lg">
                      <BellRing className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{n.title}</h3>
                      <p className="text-xs text-slate-500">
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

      {/* Expediente Académico */}
      {activeTab === 'expediente' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Calificaciones */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden md:col-span-2">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center"><FileText className="w-4 h-4 mr-2" /> Boleta de Calificaciones</h3>
            </div>
            <table className="min-w-full divide-y divide-slate-200 overflow-x-auto block md:table">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Campo Formativo / Disciplina</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Trimestre 1</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Trimestre 2</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Promedio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {materiasPorGrado[studentSession.grado]?.map((materia) => {
                  const calif = studentSession.calificaciones || {};
                  const t1 = calif.t1?.[materia.id];
                  const t2 = calif.t2?.[materia.id];
                  const t3 = calif.t3?.[materia.id];
                  
                  let sum = 0;
                  let count = 0;
                  if (t1) { sum += Number(t1); count++; }
                  if (t2) { sum += Number(t2); count++; }
                  if (t3) { sum += Number(t3); count++; }
                  
                  const promedio = count > 0 ? (sum / count).toFixed(1) : '-';
                  
                  return (
                    <tr key={materia.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 text-sm text-slate-700 font-medium">{materia.name}</td>
                      <td className="px-6 py-3 text-sm text-center font-semibold text-slate-900">{t1 || '-'}</td>
                      <td className="px-6 py-3 text-sm text-center font-semibold text-slate-900">{t2 || '-'}</td>
                      <td className={`px-6 py-3 text-sm text-center font-bold ${promedio !== '-' && Number(promedio) < 6 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {promedio}
                      </td>
                    </tr>
                  );
                })}
                {(!materiasPorGrado[studentSession.grado] || materiasPorGrado[studentSession.grado].length === 0) && (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-slate-500 text-sm">
                      No hay materias registradas para este grado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
              <p className="text-xs text-slate-500 italic">Las boletas oficiales se llenarán automáticamente en cuanto los docentes finalicen la captura de calificaciones en el sistema central.</p>
            </div>
          </div>
          
          {/* Documentos Recibidos */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-800 border-b pb-2 mb-4">Expediente Digital</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">Acta de Nacimiento</span>
                <span className="text-sm font-bold text-emerald-600">Entregado</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">CURP</span>
                <span className="text-sm font-bold text-emerald-600">Entregado</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">Certificado de Primaria</span>
                <span className="text-sm font-bold text-emerald-600">Entregado</span>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              <button onClick={() => setActiveTab('mensajes')} className="w-full flex items-center justify-center py-2 bg-primary-50 text-primary-600 border border-primary-200 rounded-lg text-sm font-bold hover:bg-primary-100 transition">
                <MessageSquare className="w-4 h-4 mr-2" /> Chatear con Control Escolar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat / Mensajes Directos */}
      {activeTab === 'mensajes' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center mr-3">
                <User className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-50">Control Escolar</h3>
                <p className="text-xs text-emerald-400 font-medium">EST N°68</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
            <div className="text-center">
              <span className="text-xs bg-slate-200 text-slate-600 px-3 py-1 rounded-full font-medium">Inicio de la conversación</span>
            </div>
            {messages.length === 0 ? (
              <div className="text-center mt-10">
                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Escribe tu primer mensaje</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Control Escolar responderá tus dudas por este medio en horario hábil.</p>
              </div>
            ) : (
              messages.map(msg => {
                const isTutor = msg.sender === 'tutor';
                return (
                  <div key={msg.id} className={`flex flex-col ${isTutor ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${isTutor ? 'bg-primary-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'}`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 flex items-center">
                      {msg.createdAt && new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {isTutor && <Check className="w-3 h-3 ml-1 text-slate-400" />}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-white border-t border-slate-200">
            <form onSubmit={sendMessage} className="flex items-center gap-2">
              <input 
                type="text" 
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Escribe tu duda aquí..." 
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

    </div>
  );
}
