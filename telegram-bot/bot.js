require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  onSnapshot,
  Timestamp
} = require('firebase/firestore');

// 1. Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBqHojgiANQWkGmQBQJsIwxRmaC2v6KUaQ",
  authDomain: "web-tec-68.firebaseapp.com",
  projectId: "web-tec-68",
  storageBucket: "web-tec-68.firebasestorage.app",
  messagingSenderId: "616654034170",
  appId: "1:616654034170:web:183c9053253a67316be543"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 2. Inicializar Bot de Telegram
const token = process.env.TELEGRAM_TOKEN || '8220205728:AAE_xYJJS-sYCdyqCapNnNWIZTjICu1-W-Q';
const bot = new TelegramBot(token, { polling: true });

console.log("🤖 Cerebro de Telegram Iniciado y conectado a Firebase...");

// --- FUNCION 1: Vinculación de Papás (/start MATRICULA) ---
bot.onText(/\/start (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const matricula = match[1].trim();

  try {
    const q = query(collection(db, 'students'), where('matricula', '==', matricula));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      bot.sendMessage(chatId, `❌ No encontré ningún alumno con la matrícula: ${matricula}. Verifica que esté bien escrita.`);
      return;
    }

    const studentDoc = snapshot.docs[0];
    const studentData = studentDoc.data();

    // Actualizar el documento del alumno con el chat_id
    await updateDoc(studentDoc.ref, {
      telegramChatId: chatId
    });

    bot.sendMessage(chatId, `✅ ¡Vinculación Exitosa!\n\nA partir de ahora recibirás alertas automáticas de Entrada y Salida para el alumno:\n👦 ${studentData.nombres} ${studentData.apellidoPaterno}\nGrado: ${studentData.grado} "${studentData.grupo || '-'}"`);
    console.log(`Padre vinculado a matrícula ${matricula}`);
  } catch (error) {
    console.error("Error vinculando padre:", error);
    bot.sendMessage(chatId, "Hubo un error al intentar vincularte. Intenta de nuevo más tarde.");
  }
});

bot.onText(/\/start$/, (msg) => {
  bot.sendMessage(msg.chat.id, "👋 ¡Hola! Para recibir alertas, envíame un mensaje con el formato:\n`/start MATRICULA_DEL_ALUMNO`\n\nPor ejemplo: `/start 12345678`", { parse_mode: 'Markdown' });
});

// --- FUNCION 2: Notificar Asistencias en Tiempo Real ---
// Solo escuchar registros nuevos (desde que inició el script)
const startTime = Timestamp.fromDate(new Date());

const asistenciasQuery = query(
  collection(db, 'asistencias'),
  where('timestamp', '>=', startTime)
);

onSnapshot(asistenciasQuery, (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === 'added') {
      const data = change.doc.data();
      
      // Si tiene configurado el Telegram, mandarle mensaje
      if (data.telegramChatId) {
        const horaFormateada = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
        const icono = data.tipo === 'ENTRADA' ? '🏫' : '👋';
        const msj = `${icono} *Aviso de ${data.tipo}*\n\nSu hijo(a) ${data.nombre} acaba de registrar su ${data.tipo.toLowerCase()} a la escuela a las ${horaFormateada}.`;
        
        bot.sendMessage(data.telegramChatId, msj, { parse_mode: 'Markdown' })
          .then(() => console.log(`Alerta enviada a ${data.matricula}`))
          .catch(e => console.error(`Error enviando a ${data.matricula}:`, e.message));
      }
    }
  });
});

// --- FUNCION 3: Auditoría Automática de Faltas (Cron Jobs) ---

const procesarFaltas = async (turno, horaLimite) => {
  console.log(`Ejecutando auditoría de faltas para turno ${turno}...`);
  try {
    // 1. Obtener todos los alumnos del turno
    const qAlumnos = query(collection(db, 'students'), where('turno', '==', turno));
    const alumnosSnapshot = await getDocs(qAlumnos);
    const alumnosList = alumnosSnapshot.docs.map(d => d.data());

    // 2. Obtener asistencias de HOY
    const inicioDia = new Date();
    inicioDia.setHours(0, 0, 0, 0);
    const finDia = new Date();
    finDia.setHours(23, 59, 59, 999);

    const qAsis = query(
      collection(db, 'asistencias'),
      where('timestamp', '>=', Timestamp.fromDate(inicioDia)),
      where('timestamp', '<=', Timestamp.fromDate(finDia))
    );
    const asisSnapshot = await getDocs(qAsis);
    const matriculasConAsistencia = new Set(asisSnapshot.docs.map(d => d.data().matricula));

    // 3. Comparar y notificar a los que tienen telegramChatId
    let faltasCount = 0;
    for (const alumno of alumnosList) {
      if (!matriculasConAsistencia.has(alumno.matricula) && alumno.telegramChatId) {
        faltasCount++;
        const msj = `⚠️ *AVISO DE INASISTENCIA*\n\nHan pasado las ${horaLimite} y no tenemos registro de ENTRADA de su hijo(a) ${alumno.nombres} ${alumno.apellidoPaterno}.\n\nSe le tomará como FALTA. Por favor, acuda a Asistencia Educativa para justificar este día.`;
        bot.sendMessage(alumno.telegramChatId, msj, { parse_mode: 'Markdown' })
          .catch(e => console.error(e));
      }
    }
    console.log(`Auditoría terminada. ${faltasCount} avisos de falta enviados.`);
  } catch (error) {
    console.error("Error en auditoría de faltas:", error);
  }
};

// Cron para Turno Matutino: 7:10 AM todos los días (Lunes a Viernes)
cron.schedule('10 7 * * 1-5', () => {
  procesarFaltas('MATUTINO', '7:10 AM');
}, { timezone: "America/Mexico_City" });

// Cron para Turno Vespertino: 2:10 PM (14:10) todos los días (Lunes a Viernes)
cron.schedule('10 14 * * 1-5', () => {
  procesarFaltas('VESPERTINO', '2:10 PM');
}, { timezone: "America/Mexico_City" });

console.log("⏰ Cron jobs de inasistencias programados.");
