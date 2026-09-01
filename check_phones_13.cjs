const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = { projectId: 'web-tec-68' };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
    const snapshot = await getDocs(collection(db, 'students'));
    const allStudents = snapshot.docs.map(doc => doc.data());
    
    [1, 2, 3].forEach(g => {
        const s = allStudents.filter(st => String(st.grado).includes(String(g)));
        let missing = 0, valid = 0, short = 0;
        s.forEach(st => {
            let phone = st.telefono || st.celularTutor || st.madreTelefono || st.padreTelefono;
            if (!phone) { missing++; return; }
            let clean = String(phone).replace(/\D/g, '');
            if (clean.length < 10) { short++; } else { valid++; }
        });
        console.log(Grado : Total=, Valid=, Missing=, Short=);
    });
    process.exit(0);
}
run();