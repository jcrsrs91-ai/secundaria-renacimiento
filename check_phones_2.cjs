const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = { projectId: 'web-tec-68' };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
    const snapshot = await getDocs(collection(db, 'students'));
    const allStudents = snapshot.docs.map(doc => doc.data());
    
    let valid = 0, missing = 0, lessThan10 = 0;
    
    allStudents.forEach(s => {
        let phone = s.telefono || s.celularTutor || s.madreTelefono || s.padreTelefono;
        if (!phone) { missing++; return; }
        const clean = String(phone).replace(/\D/g, '');
        if (clean.length < 10) { lessThan10++; } else { valid++; }
    });
    console.log('Without emergency:', 'Valid:', valid, 'Missing:', missing, 'Short:', lessThan10);
    process.exit(0);
}
run();