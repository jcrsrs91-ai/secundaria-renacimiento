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
        let missing = 0, valid = 0;
        s.forEach(st => {
            let phone = st.telefono || st.celularTutor || st.madreTelefono || st.padreTelefono;
            if (!phone) { missing++; } else { valid++; }
        });
        console.log(Grado : Total=, Valid=, Missing=);
    });
    process.exit(0);
}
run();