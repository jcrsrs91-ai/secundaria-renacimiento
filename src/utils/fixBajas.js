import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export const fixBajasAnteriores = async () => {
    console.log("Iniciando fix de Bajas...");
    const snap = await getDocs(collection(db, 'students'));
    let count = 0;
    for (let d of snap.docs) {
        const data = d.data();
        if (data.status === 'Baja' && !data.motivoBaja) {
            await updateDoc(doc(db, 'students', d.id), { motivoBaja: 'No Inscrito' });
            count++;
        }
    }
    console.log("Fix terminado. Actualizados: ", count);
};
