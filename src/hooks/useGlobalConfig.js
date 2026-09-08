import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

export function useGlobalConfig() {
  const [config, setConfig] = useState({
    cicloEscolarActual: '2026-2027',
    leyendaOficial: '"2026, Año de Margarita Maza"',
    inscripcionesAbiertas: true
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'config', 'global');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.inscripcionesAbiertas === undefined) data.inscripcionesAbiertas = true;
        setConfig(prev => ({ ...prev, ...data }));
      } else {
        setDoc(docRef, {
          cicloEscolarActual: '2026-2027',
          leyendaOficial: '"2026, Año de Margarita Maza"',
          inscripcionesAbiertas: true
        });
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching global config:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateConfig = async (newConfig) => {
    try {
      const docRef = doc(db, 'config', 'global');
      await setDoc(docRef, newConfig, { merge: true });
      return true;
    } catch (error) {
      console.error("Error updating config:", error);
      return false;
    }
  };

  return { config, loading, updateConfig };
}
