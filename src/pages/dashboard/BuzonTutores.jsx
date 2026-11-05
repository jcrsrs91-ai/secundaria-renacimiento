import { useState, useEffect, useRef, useMemo } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, setDoc, getDocs, where, serverTimestamp } from 'firebase/firestore';
import { MessageSquare, Send, User, Search, Check, CheckCheck, CheckCircle2, Sparkles, UserPlus, X, BellRing, Filter } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const QUICK_REPLIES = [
  '👋 Hola, buen día. Recibimos su mensaje en Control Escolar, enseguida lo revisamos.',
  '📄 Su constancia de estudios ya está lista. Puede pasar a recogerla a Control Escolar.',
  '🕗 Nuestro horario de atención en ventanilla es de lunes a viernes de 8:00 AM a 2:00 PM.',
  '✅ Su justificante ha sido registrado y notificado a los docentes del grupo.',
  '📊 Las calificaciones del trimestre ya se encuentran actualizadas en su Boleta Digital.',
  '📋 Por favor acuda a Control Escolar con copia de INE del tutor para concluir el trámite.'
];

export default function BuzonTutores() {
  const { currentUser } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'unread'
  const [showQuickReplies, setShowQuickReplies] = useState(true);

  // Modal para iniciar nuevo chat con cualquier alumno/tutor
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [studentsList, setStudentsList] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  const messagesEndRef = useRef(null);

  // Cargar lista de chats en tiempo real
  useEffect(() => {
    const q = query(collection(db, 'chats'), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setChats(chatsData);
      setLoading(false);

      // Si no hay chat activo y hay uno sin leer, o actualizar el chat activo
      setActiveChat(prevActive => {
        if (!prevActive) return null;
        const updatedActive = chatsData.find(c => c.id === prevActive.id);
        if (
          updatedActive &&
          (updatedActive.unreadAdmin !== prevActive.unreadAdmin ||
            updatedActive.unreadTutor !== prevActive.unreadTutor ||
            updatedActive.lastMessage !== prevActive.lastMessage ||
            updatedActive.updatedAt?.seconds !== prevActive.updatedAt?.seconds)
        ) {
          return updatedActive;
        }
        return prevActive;
      });
    });

    return () => unsubscribe();
  }, []);

  // Ordenar: SIEMPRE primero los NO LEÍDOS (unreadAdmin === true) como principales, luego por fecha más reciente
  const sortedAndFilteredChats = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return [...chats]
      .filter(chat => {
        if (filterMode === 'unread' && !chat.unreadAdmin) return false;
        if (!term) return true;
        const name = (chat.studentName || '').toLowerCase();
        const mat = (chat.matricula || chat.id || '').toLowerCase();
        const grp = `${chat.grado || ''} ${chat.grupo || ''}`.toLowerCase();
        const msg = (chat.lastMessage || '').toLowerCase();
        return name.includes(term) || mat.includes(term) || grp.includes(term) || msg.includes(term);
      })
      .sort((a, b) => {
        if (a.unreadAdmin && !b.unreadAdmin) return -1;
        if (!a.unreadAdmin && b.unreadAdmin) return 1;
        return (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0);
      });
  }, [chats, searchTerm, filterMode]);

  const unreadCount = useMemo(() => chats.filter(c => c.unreadAdmin === true).length, [chats]);

  // Cargar mensajes del chat activo
  useEffect(() => {
    if (!activeChat?.id) return;

    const msgsRef = collection(db, 'chats', activeChat.id, 'messages');
    const unsubscribe = onSnapshot(msgsRef, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      msgs.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      setMessages(msgs);
      scrollToBottom();
    }, (error) => {
      console.error('Error fetching messages: ', error);
    });

    return () => unsubscribe();
  }, [activeChat?.id]);

  // Marcar como leído por admin cuando se selecciona o llega mensaje con chat abierto
  useEffect(() => {
    if (activeChat?.id && activeChat?.unreadAdmin) {
      updateDoc(doc(db, 'chats', activeChat.id), { unreadAdmin: false }).catch(console.error);
    }
  }, [activeChat?.id, activeChat?.unreadAdmin]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const sendMessage = async (e, customText = null) => {
    if (e) e.preventDefault();
    const textToSend = (customText !== null ? customText : newMessage).trim();
    if (!textToSend || !activeChat) return;

    if (customText === null) setNewMessage('');

    try {
      const msgRef = doc(collection(db, 'chats', activeChat.id, 'messages'));
      await setDoc(msgRef, {
        text: textToSend,
        sender: 'admin',
        senderName: currentUser?.name || 'Control Escolar',
        createdAt: serverTimestamp()
      });

      await setDoc(doc(db, 'chats', activeChat.id), {
        studentName: activeChat.studentName || 'Alumno',
        matricula: activeChat.matricula || activeChat.id,
        grado: activeChat.grado || '',
        grupo: activeChat.grupo || '',
        lastMessage: textToSend,
        lastSender: 'admin',
        updatedAt: serverTimestamp(),
        unreadTutor: true,
        unreadAdmin: false
      }, { merge: true });
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
    }
  };

  // Abrir modal para buscar cualquier alumno e iniciar conversación con su tutor
  const handleOpenNewChatModal = async () => {
    setShowNewChatModal(true);
    if (studentsList.length === 0) {
      setLoadingStudents(true);
      try {
        const snap = await getDocs(collection(db, 'students'));
        const list = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(s => (s.status || 'Activo') !== 'Baja');
        setStudentsList(list);
      } catch (err) {
        console.error('Error cargando alumnos:', err);
      } finally {
        setLoadingStudents(false);
      }
    }
  };

  const filteredStudentsForNewChat = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return studentsList.slice(0, 20);
    return studentsList
      .filter(s => {
        const fullName = `${s.nombres || ''} ${s.apellidoPaterno || ''} ${s.apellidoMaterno || ''}`.toLowerCase();
        const mat = (s.matricula || '').toLowerCase();
        const grp = `${s.grado || ''} ${s.grupo || ''}`.toLowerCase();
        return fullName.includes(q) || mat.includes(q) || grp.includes(q);
      })
      .slice(0, 25);
  }, [studentsList, studentSearch]);

  const startChatWithStudent = (student) => {
    const existing = chats.find(c => c.id === student.id);
    if (existing) {
      setActiveChat(existing);
    } else {
      const fullName = `${student.nombres || ''} ${student.apellidoPaterno || ''} ${student.apellidoMaterno || ''}`.trim();
      setActiveChat({
        id: student.id,
        studentName: fullName,
        matricula: student.matricula || student.id,
        grado: student.grado || '',
        grupo: student.grupo || '',
        lastMessage: '',
        unreadAdmin: false,
        unreadTutor: false
      });
    }
    setShowNewChatModal(false);
    setStudentSearch('');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row" style={{ height: 'calc(100vh - 10rem)' }}>
      {/* Sidebar: Lista de Chats con prioridad a No Leídos */}
      <div className="w-full md:w-1/3 border-r border-slate-200 flex flex-col bg-slate-50">
        <div className="p-4 border-b border-slate-200 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-primary-600" />
              Buzón de Tutores
              {unreadCount > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs font-extrabold bg-rose-600 text-white rounded-full animate-pulse">
                  {unreadCount} {unreadCount === 1 ? 'nuevo' : 'nuevos'}
                </span>
              )}
            </h2>
            <button
              onClick={handleOpenNewChatModal}
              title="Iniciar mensaje con el tutor de cualquier alumno"
              className="inline-flex items-center px-2.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5 mr-1" /> Nuevo Chat
            </button>
          </div>

          {/* Buscador */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar alumno, matrícula o grupo..."
              className="w-full pl-9 pr-8 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filtros rápidos: Todos vs No leídos */}
          <div className="flex gap-1.5">
            <button
              onClick={() => setFilterMode('all')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                filterMode === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos ({chats.length})
            </button>
            <button
              onClick={() => setFilterMode('unread')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${
                filterMode === 'unread'
                  ? 'bg-rose-600 text-white'
                  : unreadCount > 0
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <BellRing className="w-3.5 h-3.5" />
              Por Atender ({unreadCount})
            </button>
          </div>
        </div>

        {/* Lista de conversaciones (No leídos arriba como principales) */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Cargando buzón...</div>
          ) : sortedAndFilteredChats.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              {filterMode === 'unread'
                ? '¡Excelente! No tienes mensajes pendientes por atender.'
                : 'No se encontraron conversaciones.'}
            </div>
          ) : (
            sortedAndFilteredChats.map(chat => {
              const isSelected = activeChat?.id === chat.id;
              return (
                <div
                  key={chat.id}
                  onClick={() => setActiveChat(chat)}
                  className={`p-4 border-b cursor-pointer transition-all relative ${
                    isSelected
                      ? 'bg-primary-50 border-l-4 border-l-primary-600 border-b-primary-100'
                      : chat.unreadAdmin
                      ? 'bg-rose-50/80 hover:bg-rose-100/70 border-l-4 border-l-rose-500 border-b-rose-100'
                      : 'hover:bg-slate-100 bg-white border-b-slate-100'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <h3 className={`text-sm truncate ${chat.unreadAdmin ? 'font-extrabold text-slate-900' : 'font-semibold text-slate-700'}`}>
                      {chat.studentName || 'Alumno'}
                    </h3>
                    {chat.unreadAdmin ? (
                      <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-rose-600 text-white rounded-full shrink-0 shadow-sm animate-pulse">
                        NUEVO
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                        {chat.updatedAt
                          ? new Date(chat.updatedAt.seconds * 1000).toLocaleDateString('es-MX', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : ''}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[11px] text-primary-600 font-semibold font-mono">
                      Matrícula: {chat.matricula || chat.id}
                    </p>
                    {(chat.grado || chat.grupo) && (
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-200/70 px-1.5 py-0.5 rounded uppercase">
                        {chat.grado?.split(' ')[0]} {chat.grupo ? `"${chat.grupo}"` : ''}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs truncate ${chat.unreadAdmin ? 'font-bold text-rose-950' : 'text-slate-500'}`}>
                      {chat.lastSender === 'admin' && <span className="text-slate-400 font-normal">Tú: </span>}
                      {chat.lastMessage || 'Conversación iniciada'}
                    </p>
                    {chat.lastSender === 'admin' && (
                      <span title={chat.unreadTutor ? 'Enviado (Aún no leído por el tutor)' : 'Visto por el tutor'}>
                        {chat.unreadTutor ? (
                          <Check className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        ) : (
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Content: Área de Conversación */}
      <div className="w-full md:w-2/3 flex flex-col bg-slate-50/50">
        {activeChat ? (
          <>
            {/* Header del Chat Activo */}
            <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center shadow-sm z-10">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3 font-bold text-primary-700">
                  {activeChat.studentName ? activeChat.studentName.charAt(0) : <User className="w-5 h-5 text-primary-600" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{activeChat.studentName || 'Alumno'}</h3>
                  <p className="text-xs text-slate-500">
                    Matrícula: <span className="font-mono font-semibold text-slate-700">{activeChat.matricula || activeChat.id}</span>
                    {activeChat.grado ? ` | ${activeChat.grado}` : ''}
                    {activeChat.grupo ? ` "${activeChat.grupo}"` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeChat.lastSender === 'admin' && (
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex items-center ${
                    activeChat.unreadTutor
                      ? 'bg-slate-100 text-slate-600'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {activeChat.unreadTutor ? (
                      <>
                        <Check className="w-3.5 h-3.5 mr-1 text-slate-400" /> Enviado al tutor
                      </>
                    ) : (
                      <>
                        <CheckCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Visto por el tutor
                      </>
                    )}
                  </span>
                )}
                <div className="text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full font-medium hidden sm:flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-500" /> En Tiempo Real
                </div>
              </div>
            </div>

            {/* Historial de Mensajes */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-slate-400 text-sm mt-10">
                  <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="font-semibold text-slate-600">Inicia la conversación con el padre o tutor</p>
                  <p className="text-xs mt-1">El tutor verá tu mensaje de inmediato al entrar a su Portal de Padres.</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isAdmin = msg.sender === 'admin';
                  return (
                    <div key={msg.id} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`max-w-[78%] px-4 py-2.5 rounded-2xl ${
                          isAdmin
                            ? 'bg-primary-600 text-white rounded-br-none shadow-sm'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                        }`}
                      >
                        {!isAdmin && (
                          <p className="text-[10px] font-bold text-primary-600 mb-0.5">
                            Padre / Tutor de {activeChat.studentName?.split(' ')[0]}
                          </p>
                        )}
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        {isAdmin && msg.senderName && <span>{msg.senderName} •</span>}
                        {msg.createdAt?.seconds &&
                          new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        {isAdmin && (
                          activeChat.unreadTutor ? (
                            <Check className="w-3 h-3 text-slate-400" title="Enviado" />
                          ) : (
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-500" title="Visto por el tutor" />
                          )
                        )}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Plantillas de Respuesta Rápida en 1 Clic */}
            <div className="bg-slate-100/80 border-t border-slate-200 px-4 py-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-600 flex items-center">
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500" /> Respuestas Rápidas (Clic para usar):
                </span>
                <button
                  type="button"
                  onClick={() => setShowQuickReplies(!showQuickReplies)}
                  className="text-[11px] text-primary-600 hover:underline font-semibold"
                >
                  {showQuickReplies ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              {showQuickReplies && (
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {QUICK_REPLIES.map((reply, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNewMessage(reply)}
                      className="text-[11px] bg-white hover:bg-primary-50 hover:border-primary-300 text-slate-700 border border-slate-200 rounded-full px-3 py-1 whitespace-nowrap transition-colors shadow-2xs"
                    >
                      {reply.length > 52 ? `${reply.slice(0, 52)}...` : reply}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input para enviar mensaje */}
            <div className="p-4 bg-white border-t border-slate-200">
              <form onSubmit={sendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Escribe un mensaje al padre o tutor..."
                  className="flex-1 px-4 py-2.5 bg-slate-100 border-transparent focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 rounded-xl text-sm transition-all"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-bold text-sm gap-1.5 shadow-sm"
                >
                  <Send className="w-4 h-4" /> Enviar
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <MessageSquare className="w-16 h-16 mb-4 opacity-20 text-primary-600" />
            <p className="font-bold text-slate-700 text-base">Selecciona una conversación del buzón</p>
            <p className="text-sm mt-1 max-w-md">
              Los mensajes nuevos de los tutores se colocan automáticamente hasta arriba con la etiqueta <span className="font-bold text-rose-600">NUEVO</span> para que puedas atenderlos de inmediato.
            </p>
            <button
              onClick={handleOpenNewChatModal}
              className="mt-5 inline-flex items-center px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors"
            >
              <UserPlus className="w-4 h-4 mr-2" /> Iniciar Mensaje a un Tutor
            </button>
          </div>
        )}
      </div>

      {/* Modal para buscar cualquier alumno e iniciar chat con su tutor */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-base">Enviar Mensaje a Padre o Tutor</h3>
              </div>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  placeholder="Escribe el nombre del alumno, matrícula o grupo (ej. 3 F)..."
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {loadingStudents ? (
                <div className="p-8 text-center text-slate-500 text-sm">Cargando padrón de alumnos...</div>
              ) : filteredStudentsForNewChat.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">No se encontraron alumnos con ese criterio.</div>
              ) : (
                filteredStudentsForNewChat.map(student => {
                  const fullName = `${student.nombres || ''} ${student.apellidoPaterno || ''} ${student.apellidoMaterno || ''}`.trim();
                  return (
                    <button
                      key={student.id}
                      onClick={() => startChatWithStudent(student)}
                      className="w-full text-left px-4 py-3 hover:bg-primary-50 transition-colors flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{fullName}</p>
                        <p className="text-xs text-slate-500 font-mono">
                          Matrícula: {student.matricula || student.id} • {student.grado} "{student.grupo}"
                        </p>
                      </div>
                      <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-lg border border-primary-200">
                        Abrir Chat
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
