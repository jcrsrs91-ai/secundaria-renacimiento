import { useState, useEffect } from 'react';
import { Lock, Unlock, DollarSign, Wallet, CheckCircle2, AlertTriangle, Briefcase, Plus, Clock } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function CajaLockScreen({ onCajaAbierta, userEmail }) {
  const [fondoGlobal, setFondoGlobal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState('Matutino');
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    const fetchFondoGlobal = async () => {
      try {
        const fondoRef = doc(db, 'config', 'fondo_general');
        const fondoSnap = await getDoc(fondoRef);
        if (fondoSnap.exists()) {
          setFondoGlobal(fondoSnap.data().monto || 0);
        } else {
          await setDoc(fondoRef, { monto: 0, lastUpdated: serverTimestamp() });
          setFondoGlobal(0);
        }
      } catch (err) {
        console.error("Error fetching fondo general:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFondoGlobal();
  }, []);

  const handleAbrirCaja = async () => {
    setOpening(true);
    try {
      // Registrar apertura en coleccion 'cajas'
      const docRef = await addDoc(collection(db, 'cajas'), {
        turno: turnoSeleccionado,
        abiertoPor: userEmail || 'Admin',
        fechaApertura: serverTimestamp(),
        fondoInicial: fondoGlobal,
        estado: 'abierta'
      });
      toast.success(`Caja abierta para el turno ${turnoSeleccionado}`);
      onCajaAbierta(docRef.id, turnoSeleccionado, fondoGlobal);
    } catch (err) {
      toast.error('Error al abrir la caja: ' + err.message);
    } finally {
      setOpening(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Cargando estado de caja...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Lock className="w-32 h-32 text-white" />
          </div>
          <div className="relative z-10 flex justify-center mb-4">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center shadow-inner border border-slate-700">
              <Lock className="w-8 h-8 text-slate-300" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-white relative z-10">Caja Cerrada</h2>
          <p className="text-slate-400 mt-2 text-sm relative z-10">Debes abrir el turno para poder registrar cobros o gastos operacionales.</p>
        </div>

        <div className="p-8">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Fondo General Disponible</div>
                <div className="text-sm text-emerald-800 opacity-80 leading-tight">Dinero físico en cajón heredado del último cierre</div>
              </div>
            </div>
            <div className="text-xl font-black text-emerald-700 font-mono tracking-tight">
              ${fondoGlobal.toFixed(2)}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Seleccionar Turno Operativo</label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setTurnoSeleccionado('Matutino')}
                  className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-all ${turnoSeleccionado === 'Matutino' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                  <Clock className="w-5 h-5" />
                  <span className="font-bold text-sm">Turno Matutino</span>
                </button>
                <button 
                  onClick={() => setTurnoSeleccionado('Vespertino')}
                  className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-all ${turnoSeleccionado === 'Vespertino' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                  <Clock className="w-5 h-5" />
                  <span className="font-bold text-sm">Turno Vespertino</span>
                </button>
              </div>
            </div>

            <button 
              onClick={handleAbrirCaja}
              disabled={opening}
              className="w-full py-3.5 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-primary-600/30 transition-all active:scale-[0.98] disabled:opacity-70"
            >
              {opening ? (
                <>Abriendo Turno...</>
              ) : (
                <><Unlock className="w-5 h-5" /> Abrir Caja y Comenzar Turno</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
