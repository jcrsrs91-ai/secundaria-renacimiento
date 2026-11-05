import { useState, useEffect, useRef, useMemo } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, setDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { MessageSquare, Send, User, Search, Check, CheckCheck, CheckCircle2, Sparkles, UserPlus, X, BellRing, Sun, Moon, Megaphone, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { inferirTurnoChat, HORARIOS_TURNO } from '../../components/FloatingBuzonWidget';
import toast from 'react-hot-toast';

const getQuickRepliesForStudentShift = (turno) => {
  const isVesp = turno === 'Vespertino';
  return [
    `👋 Hola, buen día. Recibimos su mensaje en Control Escolar (${isVesp ? 'Turno Vespertino' : 'Turno Matutino'}), enseguida lo revisamos.`,
    isVesp
      ? '🌙 Nuestro horario de atención en ventanilla (Turno Vespertino) es de lunes a viernes de 2:00 PM a 7:30 PM.'
      : '☀️ Nuestro horario de atención en ventanilla (Turno Matutino) es de lunes a viernes de 7:30 AM a 1:30 PM.',
    `📄 Su constancia de estudios ya está lista. Puede pasar a recogerla a Control Escolar en horario ${isVesp ? 'vespertino (2:00 PM a 7:30 PM)' : 'matutino (7:30 AM a 1:30 PM)'}.`,
    '🕒 Horarios de atención EST N°68: Turno Matutino (7:30 AM a 1:30 PM) y Turno Vespertino (2:00 PM a 7:30 PM).',
    '✅ Su justificante ha sido registrado y notificado a los docentes correspondientes.',
    '📊 Las calificaciones del trimestre ya se encuentran actualizadas en su Boleta Digital.',
    '📋 Por favor acuda a Control Escolar con copia de INE del tutor para concluir el trámite.'
  ];
};

const CASE_STATUS_OPTIONS = [
  { value: 'pendiente', label: 'Por Atender', badgeClass: 'bg-rose-100 text-rose-700 border-rose-200' },
  { value: 'en_tramite', label: 'En Trámite', badgeClass: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'resuelto', label: 'Resuelto', badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
];

export default function BuzonTutores() {
  const { currentUser, userName } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'unread' | 'en_tramite'
  const [shiftFilter, setShiftFilter] = useState('Todos'); // 'Todos' | 'Matutino' | 'Vespertino'
  const [showQuickReplies, setShowQuickReplies] = useState(true);

  // Modal para iniciar nuevo chat con cualquier alumno/tutor
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [studentsList, setStudentsList] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [modalShiftFilter, setModalShiftFilter] = useState('Todos');

  // Modal para enviar aviso masivo por Grupo o Turno al Buzón de Padres
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastShift, setBroadcastShift] = useState('Matutino');
  const [broadcastGrado, setBroadcastGrado] = useState('Todos');
  const [broadcastGrupo, setBroadcastGrupo] = useState('Todos');
  const [broadcastText, setBroadcastText] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  const messagesEndRef = useRef(null);

  // Cargar lista de chats en tiempo real
  useEffect(() => {
    const q = query(collection(db, 'chats'), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatsData = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          turnoResuelto: inferirTurnoChat(data)
        };
      });
      setChats(chatsData);
      setLoading(false);

      setActiveChat(prevActive => {
        if (!prevActive) return null;
        const updatedActive = chatsData.find(c => c.id === prevActive.id);
        if (
          updatedActive &&
          (updatedActive.unreadAdmin !== prevActive.unreadAdmin ||
            updatedActive.unreadTutor !== prevActive.unreadTutor ||
            updatedActive.caseStatus !== prevActive.caseStatus ||
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

  // Contadores por turno y no leídos
  const unreadCount = useMemo(() => chats.filter(c => c.unreadAdmin === true).length, [chats]);
  const unreadMatutino = useMemo(() => chats.filter(c => c.unreadAdmin && c.turnoResuelto === 'Matutino').length, [chats]);
  const unreadVespertino = useMemo(() => chats.filter(c => c.unreadAdmin && c.turnoResuelto === 'Vespertino').length, [chats]);

  // Ordenar: SIEMPRE primero los NO LEÍDOS (unreadAdmin === true) como principales, luego por fecha más reciente
  const sortedAndFilteredChats = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return [...chats]
      .filter(chat => {
        if (shiftFilter !== 'Todos' && chat.turnoResuelto !== shiftFilter) return false;
        if (filterMode === 'unread' && !chat.unreadAdmin) return false;
        if (filterMode === 'en_tramite' && chat.caseStatus !== 'en_tramite') return false;
        if (!term) return true;
        const name = (chat.studentName || '').toLowerCase();
        const mat = (chat.matricula || chat.id || '').toLowerCase();
        const grp = `${chat.grado || ''} ${chat.grupo || ''} ${chat.turnoResuelto || ''}`.toLowerCase();
        const msg = (chat.lastMessage || '').toLowerCase();
        return name.includes(term) || mat.includes(term) || grp.includes(term) || msg.includes(term);
      })
      .sort((a, b) => {
        if (a.unreadAdmin && !b.unreadAdmin) return -1;
        if (!a.unreadAdmin && b.unreadAdmin) return 1;
        return (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0);
      });
  }, [chats, searchTerm, filterMode, shiftFilter]);

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

    const turnoChat = activeChat.turnoResuelto || inferirTurnoChat(activeChat);

    try {
      const msgRef = doc(collection(db, 'chats', activeChat.id, 'messages'));
      await setDoc(msgRef, {
        text: textToSend,
        sender: 'admin',
        senderName: userName || currentUser?.name || `Control Escolar (${turnoChat})`,
        createdAt: serverTimestamp()
      });

      await setDoc(doc(db, 'chats', activeChat.id), {
        studentName: activeChat.studentName || 'Alumno',
        matricula: activeChat.matricula || activeChat.id,
        grado: activeChat.grado || '',
        grupo: activeChat.grupo || '',
        turno: turnoChat,
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

  const handleChangeCaseStatus = async (newStatus) => {
    if (!activeChat?.id) return;
    try {
      await setDoc(doc(db, 'chats', activeChat.id), {
        caseStatus: newStatus
      }, { merge: true });
      setActiveChat(prev => prev ? { ...prev, caseStatus: newStatus } : prev);
      toast.success(`Estado actualizado a: ${CASE_STATUS_OPTIONS.find(o => o.value === newStatus)?.label}`);
    } catch (err) {
      console.error('Error cambiando estado del caso:', err);
    }
  };

  // Cargar alumnos para nuevo chat o aviso por grupo/turno
  const ensureStudentsLoaded = async () => {
    if (studentsList.length > 0) return studentsList;
    setLoadingStudents(true);
    try {
      const snap = await getDocs(collection(db, 'students'));
      const list = snap.docs
        .map(d => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            turnoResuelto: inferirTurnoChat(data)
          };
        })
        .filter(s => (s.status || 'Activo') !== 'Baja');
      setStudentsList(list);
      return list;
    } catch (err) {
      console.error('Error cargando alumnos:', err);
      return [];
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleOpenNewChatModal = async () => {
    setShowNewChatModal(true);
    await ensureStudentsLoaded();
  };

  const handleOpenBroadcastModal = async () => {
    setShowBroadcastModal(true);
    await ensureStudentsLoaded();
  };

  const filteredStudentsForNewChat = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    return studentsList
      .filter(s => {
        if (modalShiftFilter !== 'Todos' && s.turnoResuelto !== modalShiftFilter) return false;
        if (!q) return true;
        const fullName = `${s.nombres || ''} ${s.apellidoPaterno || ''} ${s.apellidoMaterno || ''}`.toLowerCase();
        const mat = (s.matricula || '').toLowerCase();
        const grp = `${s.grado || ''} ${s.grupo || ''}`.toLowerCase();
        return fullName.includes(q) || mat.includes(q) || grp.includes(q);
      })
      .slice(0, 30);
  }, [studentsList, studentSearch, modalShiftFilter]);

  const startChatWithStudent = (student) => {
    const existing = chats.find(c => c.id === student.id);
    if (existing) {
      setActiveChat(existing);
    } else {
      const fullName = `${student.nombres || ''} ${student.apellidoPaterno || ''} ${student.apellidoMaterno || ''}`.trim();
      const turnoRes = inferirTurnoChat(student);
      setActiveChat({
        id: student.id,
        studentName: fullName,
        matricula: student.matricula || student.id,
        grado: student.grado || '',
        grupo: student.grupo || '',
        turno: turnoRes,
        turnoResuelto: turnoRes,
        lastMessage: '',
        unreadAdmin: false,
        unreadTutor: false
      });
    }
    setShowNewChatModal(false);
    setStudentSearch('');
  };

  // Destinatarios del comunicado masivo por Turno / Grado / Grupo
  const broadcastTargets = useMemo(() => {
    return studentsList.filter(s => {
      if (broadcastShift !== 'Ambos' && s.turnoResuelto !== broadcastShift) return false;
      if (broadcastGrado !== 'Todos' && s.grado !== broadcastGrado) return false;
      if (broadcastGrupo !== 'Todos' && s.grupo !== broadcastGrupo) return false;
      return true;
    });
  }, [studentsList, broadcastShift, broadcastGrado, broadcastGrupo]);

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastText.trim() || broadcastTargets.length === 0) return;

    setSendingBroadcast(true);
    const text = broadcastText.trim();
    try {
      await Promise.all(
        broadcastTargets.map(async (st) => {
          const fullName = `${st.nombres || ''} ${st.apellidoPaterno || ''} ${st.apellidoMaterno || ''}`.trim();
          const turnoSt = st.turnoResuelto || inferirTurnoChat(st);
          const chatRef = doc(db, 'chats', st.id);

          await setDoc(chatRef, {
            studentName: fullName,
            matricula: st.matricula || st.id,
            grado: st.grado || '',
            grupo: st.grupo || '',
            turno: turnoSt,
            lastMessage: text,
            lastSender: 'admin',
            updatedAt: serverTimestamp(),
            unreadTutor: true,
            unreadAdmin: false
          }, { merge: true });

          await setDoc(doc(collection(chatRef, 'messages')), {
            text,
            sender: 'admin',
            senderName: `Control Escolar (${turnoSt})`,
            createdAt: serverTimestamp()
          });
        })
      );

      toast.success(`Mensaje enviado a ${broadcastTargets.length} tutor(es) correctamente.`);
      setBroadcastText('');
      setShowBroadcastModal(false);
    } catch (err) {
      console.error('Error enviando aviso a grupo:', err);
      toast.error('Hubo un problema al enviar los mensajes.');
    } finally {
      setSendingBroadcast(false);
    }
  };

  const activeShiftReplies = useMemo(
    () => getQuickRepliesForStudentShift(activeChat?.turnoResuelto || 'Matutino'),
    [activeChat?.turnoResuelto]
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row" style={{ height: 'calc(100vh - 9.5rem)' }}>
      {/* Sidebar: Lista de Chats con prioridad a No Leídos y Filtro por Turno */}
      <div className="w-full md:w-[36%] border-r border-slate-200 flex flex-col bg-slate-50">
        <div className="p-3.5 border-b border-slate-200 bg-white space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-extrabold text-slate-800 flex items-center">
              <MessageSquare className="w-5 h-5 mr-1.5 text-primary-600" />
              Buzón de Tutores
              {unreadCount > 0 && (
                <span className="ml-2 px-2 py-0.5 text-[11px] font-extrabold bg-rose-600 text-white rounded-full animate-pulse">
                  {unreadCount} {unreadCount === 1 ? 'nuevo' : 'nuevos'}
                </span>
              )}
            </h2>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleOpenBroadcastModal}
                title="Enviar mensaje a todos los tutores de un grupo o turno"
                className="inline-flex items-center px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold rounded-lg shadow-2xs transition-colors"
              >
                <Megaphone className="w-3.5 h-3.5 mr-1 text-amber-400" /> Aviso Grupal
              </button>
              <button
                onClick={handleOpenNewChatModal}
                title="Iniciar mensaje con el tutor de cualquier alumno"
                className="inline-flex items-center px-2.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-[11px] font-bold rounded-lg shadow-2xs transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5 mr-1" /> Nuevo Chat
              </button>
            </div>
          </div>

          {/* Selector de Turno: Ambos | Matutino (7:30-1:30) | Vespertino (2:00-7:30) */}
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setShiftFilter('Todos')}
              className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition ${
                shiftFilter === 'Todos' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ambos Turnos
            </button>
            <button
              type="button"
              onClick={() => setShiftFilter('Matutino')}
              className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 ${
                shiftFilter === 'Matutino'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'text-slate-700 hover:bg-amber-50'
              }`}
              title="Horario Matutino: 7:30 AM a 1:30 PM (Grupos A-F)"
            >
              <Sun className="w-3.5 h-3.5 shrink-0" />
              <span>Matutino</span>
              {unreadMatutino > 0 && (
                <span className="px-1.5 py-0.2 text-[9px] font-black bg-rose-600 text-white rounded-full">
                  {unreadMatutino}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShiftFilter('Vespertino')}
              className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 ${
                shiftFilter === 'Vespertino'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-700 hover:bg-indigo-50'
              }`}
              title="Horario Vespertino: 2:00 PM a 7:30 PM (Grupos G-L)"
            >
              <Moon className="w-3.5 h-3.5 shrink-0" />
              <span>Vespertino</span>
              {unreadVespertino > 0 && (
                <span className="px-1.5 py-0.2 text-[9px] font-black bg-rose-600 text-white rounded-full">
                  {unreadVespertino}
                </span>
              )}
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
              className="w-full pl-9 pr-8 py-2 bg-slate-100 border-none rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-primary-500"
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

          {/* Filtros rápidos: Todos vs Por Atender vs En Trámite */}
          <div className="flex gap-1.5">
            <button
              onClick={() => setFilterMode('all')}
              className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                filterMode === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos ({chats.length})
            </button>
            <button
              onClick={() => setFilterMode('unread')}
              className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${
                filterMode === 'unread'
                  ? 'bg-rose-600 text-white'
                  : unreadCount > 0
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <BellRing className="w-3 h-3" />
              Nuevos ({unreadCount})
            </button>
            <button
              onClick={() => setFilterMode('en_tramite')}
              className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                filterMode === 'en_tramite'
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              En Trámite
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
                ? '¡Excelente! No tienes mensajes pendientes por atender en este turno.'
                : 'No se encontraron conversaciones.'}
            </div>
          ) : (
            sortedAndFilteredChats.map(chat => {
              const isSelected = activeChat?.id === chat.id;
              const isVesp = chat.turnoResuelto === 'Vespertino';
              const statusObj = CASE_STATUS_OPTIONS.find(o => o.value === chat.caseStatus);
              return (
                <div
                  key={chat.id}
                  onClick={() => setActiveChat(chat)}
                  className={`p-3.5 border-b cursor-pointer transition-all relative ${
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
                      <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-rose-600 text-white rounded-full shrink-0 shadow-xs animate-pulse">
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

                  <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                    <p className="text-[11px] text-primary-600 font-semibold font-mono">
                      Mat: {chat.matricula || chat.id}
                    </p>
                    <div className="flex items-center gap-1">
                      {(chat.grado || chat.grupo) && (
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-200/70 px-1.5 py-0.5 rounded uppercase">
                          {chat.grado?.split(' ')[0]} {chat.grupo ? `"${chat.grupo}"` : ''}
                        </span>
                      )}
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isVesp
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isVesp ? '🌙 Vesp' : '☀️ Mat'}
                      </span>
                      {statusObj && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${statusObj.badgeClass}`}>
                          {statusObj.label}
                        </span>
                      )}
                    </div>
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
      <div className="w-full md:w-[64%] flex flex-col bg-slate-50/50">
        {activeChat ? (
          <>
            {/* Header del Chat Activo con Turno y Horario Oficial */}
            <div className="p-4 border-b border-slate-200 bg-white flex flex-wrap justify-between items-center gap-3 shadow-2xs z-10">
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 font-bold ${
                  activeChat.turnoResuelto === 'Vespertino'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {activeChat.studentName ? activeChat.studentName.charAt(0) : <User className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-800">{activeChat.studentName || 'Alumno'}</h3>
                    <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      activeChat.turnoResuelto === 'Vespertino'
                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                        : 'bg-amber-100 text-amber-900 border border-amber-200'
                    }`}>
                      {activeChat.turnoResuelto === 'Vespertino' ? (
                        <><Moon className="w-3 h-3" /> Turno Vespertino (2:00 PM - 7:30 PM)</>
                      ) : (
                        <><Sun className="w-3 h-3" /> Turno Matutino (7:30 AM - 1:30 PM)</>
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Matrícula: <span className="font-mono font-semibold text-slate-700">{activeChat.matricula || activeChat.id}</span>
                    {activeChat.grado ? ` | ${activeChat.grado}` : ''}
                    {activeChat.grupo ? ` Grupo "${activeChat.grupo}"` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Selector de Estado del Trámite / Caso */}
                <select
                  value={activeChat.caseStatus || 'pendiente'}
                  onChange={e => handleChangeCaseStatus(e.target.value)}
                  className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none"
                  title="Estado de atención de esta conversación"
                >
                  {CASE_STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      Estado: {opt.label}
                    </option>
                  ))}
                </select>

                {activeChat.lastSender === 'admin' && (
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex items-center ${
                    activeChat.unreadTutor
                      ? 'bg-slate-100 text-slate-600'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {activeChat.unreadTutor ? (
                      <>
                        <Check className="w-3.5 h-3.5 mr-1 text-slate-400" /> Enviado
                      </>
                    ) : (
                      <>
                        <CheckCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Visto por el tutor
                      </>
                    )}
                  </span>
                )}
              </div>
            </div>

            {/* Historial de Mensajes */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-slate-400 text-sm mt-10">
                  <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="font-semibold text-slate-600">Inicia la conversación con el padre o tutor</p>
                  <p className="text-xs mt-1">
                    Alumno perteneciente al <strong>{activeChat.turnoResuelto}</strong> ({HORARIOS_TURNO[activeChat.turnoResuelto]?.Ventanilla}).
                  </p>
                </div>
              ) : (
                messages.map(msg => {
                  const isAdmin = msg.sender === 'admin' || msg.sender === 'system';
                  const isSystem = msg.sender === 'system';
                  return (
                    <div key={msg.id} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`max-w-[78%] px-4 py-2.5 rounded-2xl ${
                          isSystem
                            ? 'bg-amber-50 border border-amber-200 text-amber-900 rounded-br-none shadow-2xs'
                            : isAdmin
                            ? 'bg-primary-600 text-white rounded-br-none shadow-sm'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                        }`}
                      >
                        {!isAdmin && (
                          <p className="text-[10px] font-bold text-primary-600 mb-0.5">
                            Padre / Tutor de {activeChat.studentName?.split(' ')[0]} ({activeChat.turnoResuelto})
                          </p>
                        )}
                        {isSystem && (
                          <p className="text-[10px] font-extrabold text-amber-700 mb-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Respuesta Automática de Recepción ({activeChat.turnoResuelto})
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

            {/* Plantillas de Respuesta Rápida en 1 Clic adaptadas al Turno */}
            <div className="bg-slate-100/80 border-t border-slate-200 px-4 py-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-600 flex items-center">
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500" />
                  Respuestas Rápidas para {activeChat.turnoResuelto} ({HORARIOS_TURNO[activeChat.turnoResuelto]?.Ventanilla}):
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
                  {activeShiftReplies.map((reply, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNewMessage(reply)}
                      className="text-[11px] bg-white hover:bg-primary-50 hover:border-primary-300 text-slate-700 border border-slate-200 rounded-full px-3 py-1 whitespace-nowrap transition-colors shadow-2xs"
                    >
                      {reply.length > 58 ? `${reply.slice(0, 58)}...` : reply}
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
                  placeholder={`Escribe un mensaje al tutor (${activeChat.turnoResuelto})...`}
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
              Los mensajes nuevos se colocan hasta arriba con la etiqueta <span className="font-bold text-rose-600">NUEVO</span> y están identificados por turno:
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full text-left">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-amber-600" /> Turno Matutino (Grupos A – F)
                </p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Atención en ventanilla: <strong>7:30 AM a 1:30 PM</strong>
                </p>
              </div>
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200">
                <p className="text-xs font-extrabold text-indigo-900 flex items-center gap-1.5">
                  <Moon className="w-4 h-4 text-indigo-600" /> Turno Vespertino (Grupos G – L)
                </p>
                <p className="text-[11px] text-indigo-800 mt-0.5">
                  Atención en ventanilla: <strong>2:00 PM a 7:30 PM</strong>
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button
                onClick={handleOpenNewChatModal}
                className="inline-flex items-center px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors"
              >
                <UserPlus className="w-4 h-4 mr-2" /> Iniciar Mensaje a un Tutor
              </button>
              <button
                onClick={handleOpenBroadcastModal}
                className="inline-flex items-center px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors"
              >
                <Megaphone className="w-4 h-4 mr-2 text-amber-400" /> Enviar Aviso por Grupo / Turno
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal para buscar cualquier alumno e iniciar chat con su tutor */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[82vh]">
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

            <div className="p-4 border-b border-slate-200 bg-slate-50 space-y-2.5">
              <div className="flex gap-1.5">
                {['Todos', 'Matutino', 'Vespertino'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setModalShiftFilter(t)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                      modalShiftFilter === t
                        ? 'bg-slate-800 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {t === 'Matutino' ? '☀️ Matutino (A-F)' : t === 'Vespertino' ? '🌙 Vespertino (G-L)' : 'Ambos Turnos'}
                  </button>
                ))}
              </div>
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
                  const isVesp = student.turnoResuelto === 'Vespertino';
                  return (
                    <button
                      key={student.id}
                      onClick={() => startChatWithStudent(student)}
                      className="w-full text-left px-4 py-3 hover:bg-primary-50 transition-colors flex items-center justify-between gap-2"
                    >
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{fullName}</p>
                        <p className="text-xs text-slate-500 font-mono">
                          Matrícula: {student.matricula || student.id} • {student.grado} "{student.grupo}" •{' '}
                          <span className={isVesp ? 'text-indigo-600 font-bold' : 'text-amber-700 font-bold'}>
                            {isVesp ? '🌙 Vespertino' : '☀️ Matutino'}
                          </span>
                        </p>
                      </div>
                      <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-lg border border-primary-200 shrink-0">
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

      {/* Modal para enviar Aviso Masivo por Grupo o Turno directo al Chat de los Tutores */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSendBroadcast}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col"
          >
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">Enviar Aviso por Grupo o Turno</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBroadcastModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Turno</label>
                  <select
                    value={broadcastShift}
                    onChange={e => {
                      setBroadcastShift(e.target.value);
                      setBroadcastGrupo('Todos');
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white"
                  >
                    <option value="Matutino">☀️ Matutino (A-F)</option>
                    <option value="Vespertino">🌙 Vespertino (G-L)</option>
                    <option value="Ambos">Ambos Turnos</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Grado</label>
                  <select
                    value={broadcastGrado}
                    onChange={e => setBroadcastGrado(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white"
                  >
                    <option value="Todos">Todos los Grados</option>
                    <option value="1er Grado">1er Grado</option>
                    <option value="2do Grado">2do Grado</option>
                    <option value="3er Grado">3er Grado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Grupo</label>
                  <select
                    value={broadcastGrupo}
                    onChange={e => setBroadcastGrupo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white"
                  >
                    <option value="Todos">Todos</option>
                    {(broadcastShift === 'Matutino'
                      ? ['A', 'B', 'C', 'D', 'E', 'F']
                      : broadcastShift === 'Vespertino'
                      ? ['G', 'H', 'I', 'J', 'K', 'L']
                      : ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
                    ).map(g => (
                      <option key={g} value={g}>Grupo "{g}"</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
                <span>Tutores destinatarios seleccionados:</span>
                <span className="font-extrabold text-primary-700">{broadcastTargets.length} alumno(s)</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mensaje para los Tutores</label>
                <textarea
                  rows={4}
                  required
                  value={broadcastText}
                  onChange={e => setBroadcastText(e.target.value)}
                  placeholder={
                    broadcastShift === 'Vespertino'
                      ? 'Ej. Estimados padres de familia del Turno Vespertino: Se les recuerda que pueden pasar a Control Escolar en horario de 2:00 PM a 7:30 PM...'
                      : 'Ej. Estimados padres de familia del Turno Matutino: Se les recuerda que pueden pasar a Control Escolar en horario de 7:30 AM a 1:30 PM...'
                  }
                  className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowBroadcastModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={sendingBroadcast || !broadcastText.trim() || broadcastTargets.length === 0}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50"
              >
                {sendingBroadcast ? 'Enviando...' : `Enviar a ${broadcastTargets.length} Tutor(es)`}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
