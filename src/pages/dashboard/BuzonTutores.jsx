import { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { MessageSquare, Send, User, Search, Clock, Check, CheckCircle2 } from 'lucide-react';

export default function BuzonTutores() {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Cargar lista de chats
  useEffect(() => {
    const q = query(collection(db, 'chats'), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChats(chatsData);
      setLoading(false);
      
      // Actualizar chat activo si cambia, sin crear loop
      setActiveChat(prevActive => {
        if (!prevActive) return null;
        const updatedActive = chatsData.find(c => c.id === prevActive.id);
        // Sólo actualizar si realmente cambiaron los datos relevantes para no gatillar renders innecesarios
        if (updatedActive && (updatedActive.unreadAdmin !== prevActive.unreadAdmin || updatedActive.lastMessage !== prevActive.lastMessage || updatedActive.updatedAt?.seconds !== prevActive.updatedAt?.seconds)) {
          return updatedActive;
        }
        return prevActive;
      });
    });

    return () => unsubscribe();
  }, []);

  // Cargar mensajes del chat activo (solo reacciona a cambios de ID)
  useEffect(() => {
    if (!activeChat?.id) return;

    const msgsRef = collection(db, 'chats', activeChat.id, 'messages');
    const unsubscribe = onSnapshot(msgsRef, (snapshot) => {
      let msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort in JS to avoid index or null serverTimestamp issues
      msgs.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeA - timeB;
      });

      setMessages(msgs);
      scrollToBottom();
    }, (error) => {
      console.error("Error fetching messages: ", error);
    });

    return () => unsubscribe();
  }, [activeChat?.id]);

  // Marcar como leído por admin si llega un mensaje nuevo mientras está abierto
  useEffect(() => {
    if (activeChat?.unreadAdmin) {
      updateDoc(doc(db, 'chats', activeChat.id), { unreadAdmin: false }).catch(console.error);
    }
  }, [activeChat]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    const textToSend = newMessage.trim();
    setNewMessage('');

    try {
      // 1. Guardar mensaje en subcolección
      const msgRef = doc(collection(db, 'chats', activeChat.id, 'messages'));
      await setDoc(msgRef, {
        text: textToSend,
        sender: 'admin',
        createdAt: serverTimestamp()
      });

      // 2. Actualizar el chat principal
      await updateDoc(doc(db, 'chats', activeChat.id), {
        lastMessage: textToSend,
        updatedAt: serverTimestamp(),
        unreadTutor: true,
        unreadAdmin: false
      });
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex" style={{ height: 'calc(100vh - 12rem)' }}>
      {/* Sidebar: Lista de Chats */}
      <div className="w-1/3 border-r border-slate-200 flex flex-col bg-slate-50">
        <div className="p-4 border-b border-slate-200 bg-white">
          <h2 className="text-lg font-bold text-slate-800 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2 text-primary-600" /> Buzón de Tutores
          </h2>
          <div className="mt-3 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por matrícula o nombre..." 
              className="w-full pl-9 pr-3 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Cargando buzón...</div>
          ) : chats.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No hay mensajes aún.</div>
          ) : (
            chats.map(chat => (
              <div 
                key={chat.id} 
                onClick={() => setActiveChat(chat)}
                className={`p-4 border-b border-slate-100 cursor-pointer transition-colors relative ${activeChat?.id === chat.id ? 'bg-primary-50 border-primary-100' : 'hover:bg-slate-100 bg-white'}`}
              >
                {chat.unreadAdmin && (
                  <div className="absolute top-4 right-4 w-3 h-3 bg-rose-500 rounded-full shadow-sm"></div>
                )}
                <div className="flex justify-between items-start mb-1">
                  <h3 className={`font-semibold text-sm truncate pr-2 ${chat.unreadAdmin ? 'text-slate-900' : 'text-slate-700'}`}>
                    {chat.studentName || 'Alumno'}
                  </h3>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {chat.updatedAt ? new Date(chat.updatedAt.seconds * 1000).toLocaleDateString() : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] text-primary-600 font-medium">Matrícula: {chat.id}</p>
                  {(chat.grado || chat.grupo) && (
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase">
                      {chat.grado?.split(' ')[0]} {chat.grupo ? `"${chat.grupo}"` : ''}
                    </span>
                  )}
                </div>
                <p className={`text-xs truncate ${chat.unreadAdmin ? 'font-semibold text-slate-800' : 'text-slate-500'}`}>
                  {chat.lastMessage}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content: Chat Área */}
      <div className="w-2/3 flex flex-col bg-slate-50/50">
        {activeChat ? (
          <>
            <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center shadow-sm z-10">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                  <User className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{activeChat.studentName || 'Alumno no identificado'}</h3>
                  <p className="text-xs text-slate-500">
                    Matrícula: {activeChat.id} 
                    {activeChat.grado ? ` | ${activeChat.grado}` : ''}
                    {activeChat.grupo ? ` "${activeChat.grupo}"` : ''}
                  </p>
                </div>
              </div>
              <div className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded font-medium flex items-center">
                <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-500" /> Chat Abierto
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-slate-400 text-sm mt-10">No hay mensajes en este chat.</div>
              ) : (
                messages.map(msg => {
                  const isAdmin = msg.sender === 'admin';
                  return (
                    <div key={msg.id} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${isAdmin ? 'bg-primary-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'}`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 flex items-center">
                        {msg.createdAt?.seconds && new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isAdmin && <Check className="w-3 h-3 ml-1" />}
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
                  placeholder="Escribe un mensaje al tutor..." 
                  className="flex-1 px-4 py-2.5 bg-slate-100 border-transparent focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 rounded-xl text-sm transition-all"
                />
                <button 
                  type="submit" 
                  disabled={!newMessage.trim()}
                  className="p-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
            <p className="font-medium">Selecciona una conversación del buzón</p>
            <p className="text-sm mt-1">Podrás responder a los padres de familia aquí.</p>
          </div>
        )}
      </div>
    </div>
  );
}
