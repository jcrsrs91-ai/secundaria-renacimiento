const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = { projectId: 'web-tec-68' };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
    const snapshot = await getDocs(collection(db, 'students'));
    const allStudents = snapshot.docs.map(doc => doc.data());
    
    let phones = {};
    allStudents.forEach(s => {
        let phone = s.telefono || s.celularTutor || s.madreTelefono || s.padreTelefono;
        if (!phone) return;
        const clean = String(phone).replace(/\D/g, '');
        if (clean.length >= 10) {
            phones[clean] = (phones[clean] || 0) + 1;
        }
    });
    
    const duplicates = Object.entries(phones).filter(([p, c]) => c > 1).sort((a, b) => b[1] - a[1]);
    console.log('Top duplicate phones:');
    duplicates.slice(0, 10).forEach(([p, c]) => console.log(p, ':', c));
    process.exit(0);
}
run();