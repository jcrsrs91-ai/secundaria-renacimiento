import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

export function useGlobalConfig() {
  const [config, setConfig] = useState({
    cicloEscolarActual: '2025-2026',
    leyendaOficial: '"2026, Año de Margarita Maza"'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'config', 'global');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setConfig(prev => ({ ...prev, ...docSnap.data() }));
      } else {
        setDoc(docRef, {
          cicloEscolarActual: '2025-2026',
          leyendaOficial: '"2026, Año de Margarita Maza"'
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
