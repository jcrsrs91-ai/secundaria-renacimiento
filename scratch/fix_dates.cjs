const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc } = require('firebase/firestore');
const app = initializeApp({ projectId: 'web-tec-68' });
const db = getFirestore(app);

async function fix() {
  const snap = await getDocs(collection(db, 'students'));
  let count = 0;
  for (const d of snap.docs) {
    const data = d.data();
    if (data.fechaNacimiento && data.fechaNacimiento.includes('/')) {
      const parts = data.fechaNacimiento.split('/');
      if (parts.length === 3) {
        let dd = parts[0].padStart(2, '0');
        let mm = parts[1].padStart(2, '0');
        let yy = parts[2];
        if (yy.length === 2) yy = parseInt(yy) > 50 ? '19'+yy : '20'+yy;
        const newDate = `${yy}-${mm}-${dd}`;
        
        await updateDoc(doc(db, 'students', d.id), { fechaNacimiento: newDate });
        count++;
      }
    }
  }
  console.log('Fixed', count, 'dates in DB!');
  process.exit(0);
}
fix();
