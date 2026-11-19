import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

export function useGlobalConfig() {
  const [config, setConfig] = useState({
    cicloEscolarActual: '2026-2027',
    leyendaOficial: '"2026, Año de Margarita Maza"',
    inscripcionesAbiertas: true,
    reinscripcionesAbiertas: false,
    coordinadorMatutino: 'PROFRA. LUCILA RODRÍGUEZ MARTÍNEZ',
    coordinadorVespertino: 'PROFR. JOSÉ BARRERA VÁZQUEZ',
    trimestresBloqueadosDocentes: { t1: false, t2: false, t3: false },
    trimestresPublicadosPadres: { t1: true, t2: true, t3: true }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const docRef = doc(db, 'config', 'global');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      setError(null);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.inscripcionesAbiertas === undefined) data.inscripcionesAbiertas = true;
        if (data.reinscripcionesAbiertas === undefined) data.reinscripcionesAbiertas = false;
        if (!data.trimestresBloqueadosDocentes) {
          data.trimestresBloqueadosDocentes = { t1: false, t2: false, t3: false };
        }
        if (!data.trimestresPublicadosPadres) {
          data.trimestresPublicadosPadres = { t1: true, t2: true, t3: true };
        }
        setConfig(prev => ({ ...prev, ...data }));
      } else if (auth.currentUser) {
        setDoc(docRef, {
          cicloEscolarActual: '2026-2027',
          leyendaOficial: '"2026, Año de Margarita Maza"',
          inscripcionesAbiertas: true,
          reinscripcionesAbiertas: false,
          coordinadorMatutino: 'PROFRA. LUCILA RODRÍGUEZ MARTÍNEZ',
          coordinadorVespertino: 'PROFR. JOSÉ BARRERA VÁZQUEZ',
          trimestresBloqueadosDocentes: { t1: false, t2: false, t3: false },
          trimestresPublicadosPadres: { t1: true, t2: true, t3: true }
        }).catch(() => {});
      }
      setLoading(false);
    }, (err) => {
      console.error("Error fetching global config:", err);
      setError(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateConfig = async (newConfig) => {
    try {
      const docRef = doc(db, 'config', 'global');
      await setDoc(docRef, newConfig, { merge: true });
      return true;
    } catch (err) {
      console.error("Error updating config:", err);
      return false;
    }
  };

  return { config, loading, error, updateConfig };
}
