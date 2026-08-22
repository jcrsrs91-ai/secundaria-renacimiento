const fs = require('fs');

// -------------------------------------------------------------
// CLEAN UP Inventario.jsx (Remove Finanzas)
// -------------------------------------------------------------
let inv = fs.readFileSync('src/pages/dashboard/Inventario.jsx', 'utf8');

// Change component name
inv = inv.replace('export default function Contraloria() {', 'export default function Inventario() {');

// We only need the tabs: inventario and resguardos
inv = inv.replace(/const \[activeTab, setActiveTab\] = useState\('pagos'\);/, `const [activeTab, setActiveTab] = useState('inventario');`);

// Remove CajaLockScreen wrapping and Pagos/Gastos/Corte logic inside the return
inv = inv.replace(/\{\(!cajaTurno && \(activeTab === 'pagos' \|\| activeTab === 'gastos' \|\| activeTab === 'corte'\)\) \? \([\s\S]*?\) : \(\s*<>/, '');
// At the bottom, remove the closing `</>\n        )}`
// We'll just replace everything from `{activeTab === 'pagos'` down to `{activeTab === 'corte'`
// Actually, it's safer to just replace the JSX.
// Let's use string manipulation for the JSX body of Inventario.jsx

let newInv = `import React, { useState, useEffect } from 'react';
import { PackageOpen, FileText, Plus, Edit2, Trash2, ScanLine, Search, History, Monitor, Laptop, Projector, BookOpen, Tv, Speaker, Keyboard, Mouse, Server, Smartphone, Tablet, Archive, PenTool, Box, Armchair, Cpu, CheckCircle2, Download, X } from 'lucide-react';
import { collection, addDoc, onSnapshot, query, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import ScannerInventarioModal from '../../components/ScannerInventarioModal';
import CartaResguardoPrint from '../../components/CartaResguardoPrint';

export default function Inventario() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('inventario');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inventario, setInventario] = useState([]);
  const [resguardos, setResguardos] = useState([]);
  
  const [showArticuloModal, setShowArticuloModal] = useState(false);
  const [showResguardoModal, setShowResguardoModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  
  const [inventarioSearch, setInventarioSearch] = useState('');
  const [resguardoSearch, setResguardoSearch] = useState('');
  
  const [articuloFormData, setArticuloFormData] = useState({ 
    nombre: '', descripcion: '', categoria: 'Electrónicos', cantidad: 1, 
    estadoFisico: 'Bueno', ubicacion: '', numeroSerie: '', notas: '',
    qrCode: '' // Generado auto o escaneado
  });
  
  const [resguardoFormData, setResguardoFormData] = useState({
    nombreEmpleado: '', cargo: '', departamento: '', articulos: [], 
    fechaAsignacion: new Date().toISOString().split('T')[0], notas: ''
  });
  
  const [printData, setPrintData] = useState(null);

  useEffect(() => {
    const unsubInv = onSnapshot(query(collection(db, 'inventario')), snap => {
      setInventario(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubRes = onSnapshot(query(collection(db, 'resguardos')), snap => {
      setResguardos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsubInv(); unsubRes(); };
  }, []);

  const handleSaveArticulo = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'inventario'), {
        ...articuloFormData,
        qrCode: articuloFormData.qrCode || \`INV-\${Date.now()}\`,
        createdAt: serverTimestamp(),
        registradoPor: currentUser?.email || 'admin'
      });
      toast.success('Artículo registrado');
      setShowArticuloModal(false);
      setArticuloFormData({ nombre: '', descripcion: '', categoria: 'Electrónicos', cantidad: 1, estadoFisico: 'Bueno', ubicacion: '', numeroSerie: '', notas: '', qrCode: '' });
    } catch(err) {
      toast.error('Error al guardar artículo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveResguardo = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, 'resguardos'), {
        ...resguardoFormData,
        createdAt: serverTimestamp(),
        estado: 'Activo',
        registradoPor: currentUser?.email || 'admin'
      });
      toast.success('Resguardo creado');
      setShowResguardoModal(false);
      setPrintData({ id: docRef.id, ...resguardoFormData, estado: 'Activo' });
    } catch(err) {
      toast.error('Error al crear resguardo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDevolucion = async (id) => {
    if(!window.confirm('¿Confirmas la devolución de todos los artículos de este resguardo?')) return;
    try {
      await updateDoc(doc(db, 'resguardos', id), {
        estado: 'Devuelto',
        fechaDevolucion: new Date().toISOString()
      });
      toast.success('Devolución registrada');
    } catch (error) {
      toast.error('Error al registrar devolución');
    }
  };
  
  const iconMap = { 'Computadoras': Laptop, 'Proyectores': Projector, 'Redes': Server, 'Mobiliario': Armchair, 'Electrónicos': Cpu, 'Otro': Box };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Inventario y Resguardos</h2>
          <p className="text-slate-500 text-sm">Control del mobiliario y equipo escolar.</p>
        </div>
      </div>

      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('inventario')}
            className={\`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center \${activeTab === 'inventario' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}\`}
          >
            <PackageOpen className="w-4 h-4 mr-2" /> Inventario Escolar
          </button>
          <button
            onClick={() => setActiveTab('resguardos')}
            className={\`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center \${activeTab === 'resguardos' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}\`}
          >
            <FileText className="w-4 h-4 mr-2" /> Historial de Resguardos
          </button>
        </nav>
      </div>

      {activeTab === 'inventario' && (
        <div className="space-y-6">
          <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex gap-2">
                <button onClick={() => setShowScannerModal(true)} className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors">
                  <ScanLine className="w-4 h-4 mr-2" /> Escáner QR
                </button>
                <button onClick={() => setShowArticuloModal(true)} className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
                  <Plus className="w-4 h-4 mr-2" /> Nuevo Artículo
                </button>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input type="text" placeholder="Buscar artículo..." value={inventarioSearch} onChange={e => setInventarioSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-semibold">
                    <th className="p-4">Artículo</th>
                    <th className="p-4">Categoría</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 text-center">Cantidad</th>
                    <th className="p-4">Ubicación</th>
                    <th className="p-4">No. Serie</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inventario.filter(i => i.nombre.toLowerCase().includes(inventarioSearch.toLowerCase())).map(item => {
                    const Icon = iconMap[item.categoria] || Box;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
                              <Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{item.nombre}</p>
                              <p className="text-xs text-slate-500 max-w-[200px] truncate">{item.descripcion}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm font-medium text-slate-600">{item.categoria}</td>
                        <td className="p-4 text-sm">
                          <span className={\`px-2.5 py-1 rounded-full text-xs font-bold \${
                            item.estadoFisico === 'Bueno' ? 'bg-emerald-100 text-emerald-700' : 
                            item.estadoFisico === 'Regular' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                          }\`}>
                            {item.estadoFisico}
                          </span>
                        </td>
                        <td className="p-4 text-sm font-bold text-slate-700 text-center">{item.cantidad}</td>
                        <td className="p-4 text-sm text-slate-600">{item.ubicacion}</td>
                        <td className="p-4 text-xs font-mono text-slate-500">{item.numeroSerie || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'resguardos' && (
        <div className="space-y-6">
          <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <button onClick={() => setShowResguardoModal(true)} className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
                <Plus className="w-4 h-4 mr-2" /> Nuevo Resguardo
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-semibold">
                    <th className="p-4">Estado</th>
                    <th className="p-4">Empleado</th>
                    <th className="p-4">Departamento</th>
                    <th className="p-4">Artículos</th>
                    <th className="p-4">Fecha Asignación</th>
                    <th className="p-4">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {resguardos.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 text-sm">
                        <span className={\`px-2.5 py-1 rounded-full text-xs font-bold \${
                          r.estado === 'Activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                        }\`}>
                          {r.estado}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-800 text-sm">{r.nombreEmpleado}</p>
                        <p className="text-xs text-slate-500">{r.cargo}</p>
                      </td>
                      <td className="p-4 text-sm font-medium text-slate-600">{r.departamento}</td>
                      <td className="p-4 text-sm text-slate-600">
                        {r.articulos?.map((art, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                            {art.cantidad}x {art.nombre}
                          </div>
                        ))}
                      </td>
                      <td className="p-4 text-sm text-slate-600">{new Date(r.fechaAsignacion).toLocaleDateString()}</td>
                      <td className="p-4 text-sm flex items-center gap-2">
                        <button onClick={() => setPrintData(r)} className="p-1.5 text-primary-600 hover:bg-primary-50 rounded" title="Imprimir Carta"><Download className="w-4 h-4" /></button>
                        {r.estado === 'Activo' && (
                          <button onClick={() => handleDevolucion(r.id)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded" title="Marcar Devuelto"><CheckCircle2 className="w-4 h-4" /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showArticuloModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative">
            <button onClick={() => setShowArticuloModal(false)} className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"><X className="w-5 h-5" /></button>
            <h2 className="text-xl font-bold text-slate-800 mb-6">Nuevo Artículo</h2>
            <form onSubmit={handleSaveArticulo} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nombre</label>
                  <input type="text" required value={articuloFormData.nombre} onChange={e => setArticuloFormData({...articuloFormData, nombre: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Descripción</label>
                  <input type="text" value={articuloFormData.descripcion} onChange={e => setArticuloFormData({...articuloFormData, descripcion: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Categoría</label>
                  <select value={articuloFormData.categoria} onChange={e => setArticuloFormData({...articuloFormData, categoria: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                    <option value="Computadoras">Computadoras</option>
                    <option value="Proyectores">Proyectores</option>
                    <option value="Mobiliario">Mobiliario</option>
                    <option value="Electrónicos">Electrónicos</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Cantidad</label>
                  <input type="number" min="1" required value={articuloFormData.cantidad} onChange={e => setArticuloFormData({...articuloFormData, cantidad: parseInt(e.target.value)})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Estado Físico</label>
                  <select value={articuloFormData.estadoFisico} onChange={e => setArticuloFormData({...articuloFormData, estadoFisico: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                    <option value="Bueno">Bueno</option>
                    <option value="Regular">Regular</option>
                    <option value="Malo">Malo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Ubicación</label>
                  <input type="text" value={articuloFormData.ubicacion} onChange={e => setArticuloFormData({...articuloFormData, ubicacion: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Número de Serie</label>
                  <input type="text" value={articuloFormData.numeroSerie} onChange={e => setArticuloFormData({...articuloFormData, numeroSerie: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowArticuloModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50">Guardar Artículo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showResguardoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative">
            <button onClick={() => setShowResguardoModal(false)} className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"><X className="w-5 h-5" /></button>
            <h2 className="text-xl font-bold text-slate-800 mb-6">Nuevo Resguardo</h2>
            <form onSubmit={handleSaveResguardo} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nombre del Empleado</label>
                  <input type="text" required value={resguardoFormData.nombreEmpleado} onChange={e => setResguardoFormData({...resguardoFormData, nombreEmpleado: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Cargo</label>
                  <input type="text" required value={resguardoFormData.cargo} onChange={e => setResguardoFormData({...resguardoFormData, cargo: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Departamento</label>
                  <input type="text" required value={resguardoFormData.departamento} onChange={e => setResguardoFormData({...resguardoFormData, departamento: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Artículos (Selecciona del inventario)</label>
                  <select onChange={e => {
                    const item = inventario.find(i => i.id === e.target.value);
                    if(item) {
                      setResguardoFormData({...resguardoFormData, articulos: [...resguardoFormData.articulos, { id: item.id, nombre: item.nombre, cantidad: 1, numeroSerie: item.numeroSerie }]});
                    }
                  }} className="w-full px-3 py-2 border border-slate-300 rounded-lg mb-2">
                    <option value="">Añadir artículo...</option>
                    {inventario.map(i => (
                      <option key={i.id} value={i.id}>{i.nombre} - {i.numeroSerie}</option>
                    ))}
                  </select>
                  <div className="space-y-2">
                    {resguardoFormData.articulos.map((art, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg text-sm border border-slate-200">
                        <span>{art.nombre} ({art.numeroSerie || 'Sin S/N'})</span>
                        <button type="button" onClick={() => {
                          const newArts = resguardoFormData.articulos.filter((_, i) => i !== idx);
                          setResguardoFormData({...resguardoFormData, articulos: newArts});
                        }} className="text-rose-500"><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowResguardoModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Cancelar</button>
                <button type="submit" disabled={isSubmitting || resguardoFormData.articulos.length === 0} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50">Crear Resguardo</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {showScannerModal && (
         <ScannerInventarioModal 
           onClose={() => setShowScannerModal(false)} 
           onScan={(data) => {
             // Future enhancement
             toast.success('Código escaneado: ' + data);
             setShowScannerModal(false);
           }} 
         />
      )}

      {printData && (
        <CartaResguardoPrint 
          data={printData} 
          onClose={() => setPrintData(null)} 
        />
      )}
    </div>
  );
}
`;

fs.writeFileSync('src/pages/dashboard/Inventario.jsx', newInv);
console.log("Inventario.jsx created successfully!");
