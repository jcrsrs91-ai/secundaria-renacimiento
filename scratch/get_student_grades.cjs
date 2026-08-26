const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, limit, query } = require('firebase/firestore');
const app = initializeApp({ projectId: 'web-tec-68' });
const db = getFirestore(app);
getDocs(collection(db, 'students')).then(snap => {
  const withGrades = snap.docs.find(d => d.data().calificaciones);
  if (withGrades) {
    console.log(JSON.stringify(withGrades.data(), null, 2));
  } else {
    console.log('No student with grades');
  }
}).catch(console.error);
