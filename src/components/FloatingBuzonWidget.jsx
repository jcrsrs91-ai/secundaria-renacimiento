import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, X, Send, ExternalLink, Volume2, VolumeX, BellRing, Check, CheckCheck, Sparkles } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Sonido suave de notificación usando Web Audio API (sin requerir archivos externos)
const playNotificationSound = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.setValueAtTime(880, now + 0.12); // A5
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.45);
  } catch {
    // Ignorar si el navegador bloquea autoplay antes de interacción
  }
};

const QUICK_REPLIES_MINI = [
  '👋 Buen día, recibimos su mensaje. Enseguida lo revisamos.',
  '📄 Su constancia/documento ya está listo para pasar a recogerlo en Control Escolar.',
  '🕒 Puede acudir a ventanilla de Control Escolar en horario de 8:00 AM a 2:00 PM.',
  '✅ Enterado, muchas gracias por comunicarse con nosotros.'
];

export default function FloatingBuzonWidget({ onUnreadCountChange }) {
  const { currentUser, userName } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [chats, setChats] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [recentAlertChat, setRecentAlertChat] = useState(null);

  const prevUnreadMapRef = useRef({});
  const initialLoadDoneRef = useRef(false);
  const messagesEndRef = useRef(null);

  // Escuchar todos los chats en tiempo real
  useEffect(() => {
    if (!currentUser) return;

    const q = query(collection(db, 'chats'), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      // Ordenar: 1) No leídos primero (Prioridad Principal), 2) Más recientes después
      list.sort((a, b) => {
        if (Boolean(a.unreadAdmin) !== Boolean(b.unreadAdmin)) {
          return a.unreadAdmin ? -1 : 1;
        }
        const tA = a.updatedAt?.seconds || 0;
        const tB = b.updatedAt?.seconds || 0;
        return tB - tA;
      });

      const unreadCount = list.filter(c => c.unreadAdmin).length;
      if (typeof onUnreadCountChange === 'function') {
        onUnreadCountChange(unreadCount);
      }

      // Detectar si acaba de llegar un mensaje nuevo de un tutor en vivo
      if (initialLoadDoneRef.current) {
        list.forEach(chat => {
          const prevTime = prevUnreadMapRef.current[chat.id] || 0;
          const currTime = chat.updatedAt?.seconds || 0;
          if (chat.unreadAdmin && currTime > prevTime) {
            setRecentAlertChat(chat);
            if (soundEnabled) {
              playNotificationSound();
            }
            toast.custom((t) => (
              <div
                onClick={() => {
                  toast.dismiss(t.id);
                  setIsOpen(true);
                  setSelectedChat(chat);
                }}
                className={`${
                  t.visible ? 'animate-enter' : 'animate-leave'
                } max-w-sm w-full bg-slate-900 text-white shadow-2xl rounded-2xl pointer-events-auto flex ring-2 ring-sky-400 cursor-pointer overflow-hidden`}
              >
                <div className="flex-1 w-0 p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                      <div className="h-10 w-10 rounded-full bg-sky-500/20 border border-sky-400 flex items-center justify-center text-sky-300">
                        <BellRing className="h-5 w-5 animate-bounce" />
                      </div>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-xs font-extrabold uppercase tracking-wider text-sky-400">
                        Nuevo Mensaje de Tutor
                      </p>
                      <p className="text-sm font-bold text-white truncate mt-0.5">
                        {chat.studentName || 'Alumno'} {chat.grado ? `(${chat.grado.split(' ')[0]} "${chat.grupo || ''}")` : ''}
                      </p>
                      <p className="mt-1 text-xs text-slate-300 line-clamp-2">
                        "{chat.lastMessage}"
                      </p>
                      <p className="mt-1.5 text-[10px] font-bold text-emerald-400">
                        Haz clic aquí para responder al instante &rarr;
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ), { duration: 7000, position: 'top-right' });
          }
        });
      }

      // Actualizar mapa de tiempos
      const nextMap = {};
      list.forEach(c => {
        nextMap[c.id] = c.updatedAt?.seconds || 0;
      });
      prevUnreadMapRef.current = nextMap;
      initialLoadDoneRef.current = true;

      setChats(list);

      setSelectedChat(prev => {
        if (!prev) return null;
        return list.find(c => c.id === prev.id) || prev;
      });
    });

    return () => unsubscribe();
  }, [currentUser, soundEnabled]);

  // Cargar mensajes cuando hay un chat seleccionado en la mini-ventana
  useEffect(() => {
    if (!isOpen || !selectedChat?.id) return;

    const msgsRef = collection(db, 'chats', selectedChat.id, 'messages');
    const unsub = onSnapshot(msgsRef, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      msgs.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      setMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    });

    // Marcar como leído automáticamente al abrirlo
    if (selectedChat.unreadAdmin) {
      updateDoc(doc(db, 'chats', selectedChat.id), { unreadAdmin: false }).catch(() => {});
    }

    return () => unsub();
  }, [isOpen, selectedChat?.id]);

  const unreadChats = useMemo(() => chats.filter(c => c.unreadAdmin), [chats]);

  const handleSendMiniReply = async (e, customText = null) => {
    if (e) e.preventDefault();
    const textToSend = (customText !== null ? customText : replyText).trim();
    if (!textToSend || !selectedChat) return;

    if (customText === null) setReplyText('');

    try {
      const msgRef = doc(collection(db, 'chats', selectedChat.id, 'messages'));
      await setDoc(msgRef, {
        text: textToSend,
        sender: 'admin',
        senderName: userName || currentUser?.email || 'Control Escolar',
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'chats', selectedChat.id), {
        lastMessage: textToSend,
        lastSender: 'admin',
        updatedAt: serverTimestamp(),
        unreadTutor: true,
        unreadAdmin: false
      });
    } catch (err) {
      console.error('Error al enviar respuesta rápida:', err);
      toast.error('No se pudo enviar el mensaje.');
    }
  };

  // No mostrar la burbuja si ya estamos dentro de la página completa de /panel/buzon
  if (location.pathname === '/panel/buzon') return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 no-print flex flex-col items-end">
      {/* Tarjeta flotante de aviso inmediato cuando hay mensajes sin leer y la ventana está cerrada */}
      {!isOpen && unreadChats.length > 0 && (
        <div
          onClick={() => {
            setIsOpen(true);
            setSelectedChat(unreadChats[0]);
            setRecentAlertChat(null);
          }}
          className="mb-3 bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xl border-2 border-sky-400 max-w-xs cursor-pointer hover:scale-[1.02] transition-all animate-bounce"
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-red-500 text-white rounded-full flex items-center gap-1">
              <BellRing className="w-3 h-3" />
              {unreadChats.length === 1 ? '1 Mensaje Nuevo de Tutor' : `${unreadChats.length} Mensajes Sin Leer`}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setRecentAlertChat(null);
              }}
              className="text-slate-400 hover:text-white text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs font-extrabold text-sky-300 truncate">
            {(recentAlertChat || unreadChats[0]).studentName || 'Alumno'}{' '}
            {(recentAlertChat || unreadChats[0]).grado
              ? `• ${(recentAlertChat || unreadChats[0]).grado.split(' ')[0]} "${(recentAlertChat || unreadChats[0]).grupo || ''}"`
              : ''}
          </p>
          <p className="text-xs text-slate-200 truncate mt-0.5">
            "{(recentAlertChat || unreadChats[0]).lastMessage}"
          </p>
          <p className="text-[10px] text-emerald-400 font-bold mt-1">
            Clic para responder aquí mismo &rarr;
          </p>
        </div>
      )}

      {/* Ventana de Mini-Buzón Rápido Desplegable */}
      {isOpen && (
        <div className="mb-3 w-[360px] sm:w-[410px] h-[510px] bg-white rounded-2xl shadow-2xl border border-slate-300 flex flex-col overflow-hidden">
          {/* Header de la ventana flotante */}
          <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {selectedChat ? (
                <button
                  type="button"
                  onClick={() => setSelectedChat(null)}
                  className="text-xs font-bold text-sky-400 hover:text-sky-300 mr-1"
                >
                  &larr; Volver
                </button>
              ) : (
                <MessageSquare className="w-5 h-5 text-sky-400" />
              )}
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold leading-tight truncate max-w-[190px]">
                  {selectedChat ? (selectedChat.studentName || 'Alumno') : 'Buzón Rápido de Tutores'}
                </h4>
                <p className="text-[10px] text-slate-400">
                  {selectedChat
                    ? `${selectedChat.grado || ''} ${selectedChat.grupo ? `"${selectedChat.grupo}"` : ''} • Mat: ${selectedChat.matricula || selectedChat.id}`
                    : unreadChats.length > 0
                      ? `${unreadChats.length} pendiente(s) por responder`
                      : 'En línea en tiempo real'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                title={soundEnabled ? 'Sonido de alerta activado' : 'Sonido silenciado'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/panel/buzon');
                }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400"
                title="Abrir Buzón en Pantalla Completa"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Cuerpo: Lista de Conversaciones o Chat Activo */}
          {!selectedChat ? (
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {chats.length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-xs">
                  No hay mensajes de tutores registrados.
                </div>
              ) : (
                chats.map(chat => (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    className={`p-3.5 cursor-pointer transition flex items-start justify-between gap-2 ${
                      chat.unreadAdmin
                        ? 'bg-sky-50/90 hover:bg-sky-100/80 border-l-4 border-sky-500'
                        : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {chat.unreadAdmin && (
                          <span className="px-1.5 py-0.5 text-[9px] font-black uppercase bg-red-600 text-white rounded">
                            NUEVO
                          </span>
                        )}
                        <p className={`text-xs truncate ${chat.unreadAdmin ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>
                          {chat.studentName || 'Alumno'}
                        </p>
                      </div>
                      <p className="text-[10px] font-semibold text-primary-700 mt-0.5">
                        {chat.grado ? `${chat.grado.split(' ')[0]} "${chat.grupo || ''}"` : ''}{' '}
                        {chat.matricula ? `• ${chat.matricula}` : ''}
                      </p>
                      <p className={`text-xs truncate mt-1 ${chat.unreadAdmin ? 'font-bold text-slate-900' : 'text-slate-500'}`}>
                        {chat.lastSender === 'admin' ? 'Tú: ' : ''}{chat.lastMessage}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 block">
                        {chat.updatedAt?.seconds
                          ? new Date(chat.updatedAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : ''}
                      </span>
                      {chat.unreadAdmin && (
                        <span className="inline-block mt-2 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <>
              {/* Mensajes del Chat Seleccionado */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 bg-slate-50">
                {messages.map(m => {
                  const isAdmin = m.sender === 'admin';
                  return (
                    <div key={m.id} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`max-w-[82%] px-3 py-2 rounded-2xl text-xs ${
                          isAdmin
                            ? 'bg-primary-600 text-white rounded-br-none'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{m.text}</p>
                      </div>
                      <span className="text-[9px] text-slate-400 mt-0.5 flex items-center gap-1">
                        {m.createdAt?.seconds
                          ? new Date(m.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : ''}
                        {isAdmin && (
                          selectedChat.unreadTutor === false
                            ? <CheckCheck className="w-3 h-3 text-sky-500" title="Visto por el tutor" />
                            : <Check className="w-3 h-3 text-slate-400" title="Enviado" />
                        )}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Botones de Respuesta Rápida de 1 Clic */}
              <div className="px-3 py-1.5 bg-slate-100 border-t border-slate-200 flex gap-1.5 overflow-x-auto no-scrollbar">
                {QUICK_REPLIES_MINI.map((qr, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSendMiniReply(null, qr)}
                    className="shrink-0 px-2 py-1 bg-white hover:bg-primary-50 text-slate-700 hover:text-primary-700 border border-slate-300 rounded-full text-[10px] font-semibold transition"
                    title="Enviar esta respuesta rápida con 1 clic"
                  >
                    <Sparkles className="w-2.5 h-2.5 inline mr-1 text-amber-500" />
                    {qr.length > 34 ? qr.slice(0, 34) + '...' : qr}
                  </button>
                ))}
              </div>

              {/* Input para responder */}
              <form onSubmit={(e) => handleSendMiniReply(e)} className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Escribe respuesta rápida al tutor..."
                  className="flex-1 px-3 py-2 bg-slate-100 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* Botón Principal de Burbuja Flotante */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex items-center gap-2.5 px-4 py-3.5 rounded-full shadow-2xl font-extrabold text-sm transition-all ${
          unreadChats.length > 0
            ? 'bg-red-600 hover:bg-red-500 text-white ring-4 ring-red-300 animate-pulse'
            : 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-700'
        }`}
      >
        <MessageSquare className="w-5 h-5" />
        <span className="hidden sm:inline">
          {unreadChats.length > 0 ? `Buzón Tutores (${unreadChats.length})` : 'Buzón Tutores'}
        </span>
        {unreadChats.length > 0 && (
          <span className="px-2 py-0.5 text-xs font-black bg-white text-red-700 rounded-full shadow">
            {unreadChats.length}
          </span>
        )}
      </button>
    </div>
  );
}
