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
    console.log('Keys of first 3 missing students:');
    missing.slice(0, 3).forEach(s => console.log(Object.keys(s).join(', ')));
    
    console.log('\nChecking if any missing student has the string " 74\ in any value...');
 let foundHidden = 0;
 missing.forEach(s => {
 const values = Object.values(s).map(String).join(' ');
 if (values.includes('744') || values.includes('747')) {
 console.log('Found hidden number in student:', s.nombres, s.apellidoPaterno, '->', values);
 foundHidden++;
 }
 });
 console.log('Found hidden:', foundHidden);
 process.exit(0);
}
run();