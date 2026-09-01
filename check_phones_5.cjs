const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = { projectId: 'web-tec-68' };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
    const snapshot = await getDocs(collection(db, 'students'));
    const allStudents = snapshot.docs.map(doc => doc.data());
    
    // Grado 1 Matutino
    const s1 = allStudents.filter(s => String(s.grado).includes('1') && s.turno === 'Matutino');
    
    let allValidPhones = [];
    s1.forEach(s => {
        let phone = s.telefono || s.celularTutor || s.madreTelefono || s.padreTelefono;
        if (!phone) return;
        const clean = String(phone).replace(/\D/g, '');
        if (clean.length >= 10) {
            allValidPhones.push(clean);
        }
    });
    
    const uniquePhones = new Set(allValidPhones);
    console.log('Total 1st Grade Matutino students:', s1.length);
    console.log('Total 1st Grade Matutino students with valid phones:', allValidPhones.length);
    console.log('Unique valid phones in 1st grade Matutino:', uniquePhones.size);
    process.exit(0);
}
run();