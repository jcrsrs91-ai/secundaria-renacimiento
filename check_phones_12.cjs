const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = { projectId: 'web-tec-68' };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
    const snapshot = await getDocs(collection(db, 'students'));
    const allStudents = snapshot.docs.map(doc => doc.data());
    
    // Matutino only
    const s1 = allStudents.filter(s => String(s.grado).includes('1') && s.turno === 'Matutino');
    
    let phones = new Set();
    s1.forEach(s => {
        let phone = s.telefono || s.celularTutor;
        if (!phone) return;
        let clean = String(phone).replace(/\D/g, '');
        if (clean.length >= 10) {
            if (clean.length === 10) clean = '52' + clean;
            phones.add(clean);
        }
    });
    
    console.log('Unique phones 1st Grade Matutino:', phones.size);
    process.exit(0);
}
run();