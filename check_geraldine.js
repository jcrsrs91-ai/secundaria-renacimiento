import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBqHojgiANQWkGmQBQJsIwxRmaC2v6KUaQ",
  authDomain: "web-tec-68.firebaseapp.com",
  projectId: "web-tec-68",
  storageBucket: "web-tec-68.firebasestorage.app",
  messagingSenderId: "616654034170",
  appId: "1:616654034170:web:183c9053253a67316be543",
  measurementId: "G-FJP8HNZG3C"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const qAll = query(collection(db, "students"), where("status", "==", "Activo"));
  const snap = await getDocs(qAll);
  
  const student = snap.docs.map(d => ({id: d.id, ...d.data()})).find(s => s.nombres.includes("GERALDINE") || s.nombres.includes("Geraldine"));
  
  if (student) {
    console.log("Student found:", student.nombres, student.apellidoPaterno, student.apellidoMaterno);
    console.log("Grades t1:", student.calificaciones?.t1);
    
    // Simulate getAverage
    const materiasPorGrado = {
      '2do Grado': [
        { id: 'espanol2', name: 'Español II' }, { id: 'ingles2', name: 'Inglés II' }, { id: 'artes2', name: 'Artes II' },
        { id: 'matematicas2', name: 'Matemáticas II' }, { id: 'fisica', name: 'Ciencias II (Física)' },
        { id: 'historia2', name: 'Historia II' }, { id: 'fce2', name: 'Formación Cívica y Ética II' },
        { id: 'tecnologia2', name: 'Tecnología II' }, { id: 'educfisica2', name: 'Educación Física II' }
      ]
    };
    
    const materias = materiasPorGrado['2do Grado'];
    let sum = 0, count = 0, hasFailed = false;
    materias.forEach(mat => {
      const val = parseFloat(student.calificaciones?.['t1']?.[mat.id]);
      if (!isNaN(val)) {
        sum += val;
        count++;
        if (val < 6) hasFailed = true;
      }
    });
    
    console.log(`Sum: ${sum}, Count: ${count}, materias.length: ${materias.length}, hasFailed: ${hasFailed}`);
    if (count < materias.length || hasFailed) {
      console.log("Excluded: count < materias.length || hasFailed");
    } else {
      console.log("Exact average:", sum / count);
    }
  } else {
    console.log("Student not found");
  }
}

check().catch(console.error);
