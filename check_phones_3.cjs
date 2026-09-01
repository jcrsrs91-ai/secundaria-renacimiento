const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = { projectId: 'web-tec-68' };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
    const snapshot = await getDocs(collection(db, 'students'));
    const allStudents = snapshot.docs.map(doc => doc.data());
    
    let missing = [];
    allStudents.forEach(s => {
        let phone = s.telefono || s.celularTutor || s.madreTelefono || s.padreTelefono;
        if (!phone) { missing.push(s); }
    });
    console.log('Missing count:', missing.length);
    console.log('Sample missing:', JSON.stringify(missing[0], null, 2));
    process.exit(0);
}
run();