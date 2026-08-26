const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, limit, query } = require('firebase/firestore');
const app = initializeApp({ projectId: 'web-tec-68' });
const db = getFirestore(app);
getDocs(query(collection(db, 'students'), limit(1)))
  .then(snap => console.log(JSON.stringify(snap.docs[0].data(), null, 2)))
  .catch(console.error);
