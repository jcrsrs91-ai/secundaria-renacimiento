const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query } = require('firebase/firestore');

const app = initializeApp({ projectId: 'web-tec-68' });
const db = getFirestore(app);

const materiasPorGrado = {
  '1er Grado': [
    { id: 'espanol1', name: 'Espa\u00f1ol I' },
    { id: 'ingles1', name: 'Ingl\u00e9s I' },
    { id: 'artes1', name: 'Artes I' },
    { id: 'matematicas1', name: 'Matem\u00e1ticas I' },
    { id: 'biologia', name: 'Ciencias I (Biolog\u00eda)' },
    { id: 'geografia', name: 'Geograf\u00eda' },
    { id: 'historia1', name: 'Historia I' },
    { id: 'fce1', name: 'Formaci\u00f3n C\u00edvica y \u00c9tica I' },
    { id: 'tecnologia1', name: 'Tecnolog\u00eda I' },
    { id: 'educfisica1', name: 'Educaci\u00f3n F\u00edsica I' }
  ],
  '2do Grado': [
    { id: 'espanol2', name: 'Espa\u00f1ol II' },
    { id: 'ingles2', name: 'Ingl\u00e9s II' },
    { id: 'artes2', name: 'Artes II' },
    { id: 'matematicas2', name: 'Matem\u00e1ticas II' },
    { id: 'fisica', name: 'Ciencias II (F\u00edsica)' },
    { id: 'historia2', name: 'Historia II' },
    { id: 'fce2', name: 'Formaci\u00f3n C\u00edvica y \u00c9tica II' },
    { id: 'tecnologia2', name: 'Tecnolog\u00eda II' },
    { id: 'educfisica2', name: 'Educaci\u00f3n F\u00edsica II' }
  ],
  '3er Grado': [
    { id: 'espanol3', name: 'Espa\u00f1ol III' },
    { id: 'ingles3', name: 'Ingl\u00e9s III' },
    { id: 'artes3', name: 'Artes III' },
    { id: 'matematicas3', name: 'Matem\u00e1ticas III' },
    { id: 'quimica', name: 'Ciencias III (Qu\u00edmica)' },
    { id: 'historia3', name: 'Historia III' },
    { id: 'fce3', name: 'Formaci\u00f3n C\u00edvica y \u00c9tica III' },
    { id: 'tecnologia3', name: 'Tecnolog\u00eda III' },
    { id: 'educfisica3', name: 'Educaci\u00f3n F\u00edsica III' }
  ]
};

getDocs(collection(db, 'students')).then(snap => {
  const activos = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(s => s.status !== 'Pendiente');
  
  const list = [];
  activos.forEach(student => {
    const adeudos = [];
    const regularizadas = [];
    const gradosAChecar = ['1er Grado', '2do Grado', '3er Grado'];
    
    gradosAChecar.forEach(gradoKey => {
      const materias = materiasPorGrado[gradoKey] || [];
      materias.forEach(mat => {
        let hasGrade = false;
        let finalMat = 0;
        
        if (student.historial && student.historial[gradoKey] && student.historial[gradoKey][mat.id]) {
          const hist = student.historial[gradoKey][mat.id];
          const t1 = parseFloat(hist.t1);
          const t2 = parseFloat(hist.t2);
          const t3 = parseFloat(hist.t3);
          if (!isNaN(t1) || !isNaN(t2) || !isNaN(t3)) {
            let sum = 0, c = 0;
            if (!isNaN(t1)) { sum += t1; c++; }
            if (!isNaN(t2)) { sum += t2; c++; }
            if (!isNaN(t3)) { sum += t3; c++; }
            finalMat = Math.floor((sum / c + 0.00001) * 10) / 10;
            hasGrade = true;
          }
        }
        
        if (!hasGrade && student.calificaciones) {
          const t1 = parseFloat(student.calificaciones?.['t1']?.[mat.id]);
          const t2 = parseFloat(student.calificaciones?.['t2']?.[mat.id]);
          const t3 = parseFloat(student.calificaciones?.['t3']?.[mat.id]);
          if (!isNaN(t1) || !isNaN(t2) || !isNaN(t3)) {
            let sum = 0, c = 0;
            if (!isNaN(t1)) { sum += t1; c++; }
            if (!isNaN(t2)) { sum += t2; c++; }
            if (!isNaN(t3)) { sum += t3; c++; }
            finalMat = Math.floor((sum / c + 0.00001) * 10) / 10;
            hasGrade = true;
          }
        }

        if (hasGrade) {
          const isReprobada = finalMat < 6;
          const reg = student.regularizacion?.[mat.id];
          
          if (reg) {
            regularizadas.push({ ...mat, finalGrade: reg.calificacion, fecha: reg.fecha, isHistoric: true });
          } else if (isReprobada) {
            adeudos.push({ ...mat, finalGrade: finalMat });
          }
        }
      });
    });

    const adeudosAnteriores = student.adeudosAnteriores || [];
    adeudosAnteriores.forEach(histMat => {
       if (!adeudos.find(m => m.id === histMat.id) && !regularizadas.find(m => m.id === histMat.id)) {
         const reg = student.regularizacion?.[histMat.id];
         if (reg) {
            regularizadas.push({ ...histMat, finalGrade: reg.calificacion, fecha: reg.fecha, isHistoric: true });
         } else {
            adeudos.push({ ...histMat, isHistoric: true });
         }
       }
    });

    if (adeudos.length > 0 || regularizadas.length > 0) {
      list.push({ 
        nombres: student.nombres, 
        grado: student.grado, 
        adeudos: adeudos.map(a => a.name), 
        regularizadas: regularizadas.map(a => a.name) 
      });
    }
  });

  console.log('Alumnos con adeudos:', JSON.stringify(list, null, 2));

}).catch(console.error);
