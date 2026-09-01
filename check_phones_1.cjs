const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = { projectId: 'web-tec-68' };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
    const snapshot = await getDocs(collection(db, 'students'));
    const allStudents = snapshot.docs.map(doc => doc.data());
    
    // We only care about 1st grade
    const students = allStudents.filter(s => s.grado === '1' || s.grado === 1 || String(s.grado).includes('1'));
    
    let valid = 0, missing = 0, lessThan10 = 0;
    
    students.forEach(s => {
        let phone = s.telefono || s.celularTutor || s.madreTelefono || s.padreTelefono;
        if (!phone) { phone = s.emergenciaTel1 || s.emergenciaTel2; }
        if (!phone) { missing++; return; }
        const clean = String(phone).replace(/\D/g, '');
        if (clean.length < 10) {
            console.log('Short phone:', phone, 'Clean:', clean, 'Student:', s.nombres);
            lessThan10++;
        } else {
            valid++;
        }
    });
    console.log('Total 1st Grade:', students.length, 'Valid:', valid, 'Missing:', missing, 'Short:', lessThan10);
    process.exit(0);
}
run();