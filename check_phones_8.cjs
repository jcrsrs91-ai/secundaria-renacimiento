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
    
    let validPrimary = 0;
    let validEmergency = 0;
    
    s1.forEach(s => {
        let phone = s.telefono || s.celularTutor || s.madreTelefono || s.padreTelefono;
        let hasPrimary = false;
        if (phone && String(phone).replace(/\D/g, '').length >= 10) {
            validPrimary++;
            hasPrimary = true;
        }
        
        if (!hasPrimary) {
            let emerg = s.emergenciaTel1 || s.emergenciaTel2;
            if (emerg && String(emerg).replace(/\D/g, '').length >= 10) {
                validEmergency++;
            }
        }
    });
    
    console.log('Total 1st Grade Matutino students:', s1.length);
    console.log('Valid primary:', validPrimary);
    console.log('Valid emergency (fallback):', validEmergency);
    process.exit(0);
}
run();