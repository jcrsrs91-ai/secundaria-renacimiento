const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = { projectId: 'web-tec-68' };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
    const snapshot = await getDocs(collection(db, 'students'));
    const allStudents = snapshot.docs.map(doc => doc.data());
    
    // Grado 1
    const s1 = allStudents.filter(s => String(s.grado).includes('1'));
    
    let groups = {};
    s1.forEach(s => {
        const key = s.turno + ' - ' + s.grupo;
        groups[key] = (groups[key] || 0) + 1;
    });
    
    console.log('1st Grade Distribution:', groups);
    process.exit(0);
}
run();