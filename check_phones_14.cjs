const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = { projectId: 'web-tec-68' };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
    const snapshot = await getDocs(collection(db, 'students'));
    const allStudents = snapshot.docs.map(doc => doc.data());
    const activos = allStudents.filter(s => s.status !== 'Baja' && s.status !== 'Egresado');
    
    console.log('Total activos:', activos.length);
    
    // Check 1er Grado
    const activos1 = activos.filter(s => String(s.grado).includes('1'));
    console.log('Total activos 1er Grado:', activos1.length);
    
    // Group them by what the user might be filtering
    const turnos = {};
    activos1.forEach(s => {
        turnos[s.turno] = (turnos[s.turno] || 0) + 1;
    });
    console.log('1er Grado by turno:', turnos);
    
    // How many valid phones in activos1?
    let valid = 0, missing = 0;
    activos1.forEach(student => {
      const rawPhone = student.telefono || student.celularTutor || student.madreTelefono || student.padreTelefono;
      if (!rawPhone) { missing++; return; }
      const cleanPhone = String(rawPhone).replace(/\D/g, '');
      if (cleanPhone.length < 10) { missing++; return; }
      valid++;
    });
    console.log(Activos 1er Grado -> Valid: , Missing/Short: );
    
    process.exit(0);
}
run();