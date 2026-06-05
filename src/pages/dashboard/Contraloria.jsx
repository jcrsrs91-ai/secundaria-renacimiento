import { useState, useEffect } from 'react';
import { DollarSign, PackageOpen, Plus, FileText, CheckCircle2, Printer, X, Edit2, Trash2 } from 'lucide-react';
import { db } from '../../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import ActaRecepcionPrint from '../../components/ActaRecepcionPrint';
import CartaResguardoPrint from '../../components/CartaResguardoPrint';

export default function Contraloria() {
  const [activeTab, setActiveTab] = useState('pagos');

  const pagosRecientes = [
    { folio: 'P-001', alumno: 'Álvarez Gómez Ana', concepto: 'Reposición de Credencial', monto: '$50.00', fecha: '04/06/2026', estado: 'Pagado' },
    { folio: 'P-002', alumno: 'Ruiz Díaz Luis', concepto: 'Constancia de Estudios', monto: '$30.00', fecha: '04/06/2026', estado: 'Pagado' },
  ];

  const [inventario, setInventario] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'inventario'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
      setInventario(items);
    });
    return () => unsubscribe();
  }, []);

  const [printMode, setPrintMode] = useState(null); // 'recepcion' | 'resguardo'
  const [printData, setPrintData] = useState(null);
  
  const [modalOpen, setModalOpen] = useState(null); // 'recepcion' | 'resguardo' | 'editItem'
  const [editingItem, setEditingItem] = useState(null);
  
  const [formData, setFormData] = useState({ articulos: [{ cantidad: '', descripcion: '', marca: '', serie: '', estado: '', inventario: '' }] });

  useEffect(() => {
    const handleAfterPrint = () => setPrintMode(null);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  const openModal = (type) => {
    setModalOpen(type);
    setFormData({ 
      fecha: new Date().toISOString().split('T')[0],
      hora: '', origen: '', proveedor: '', nombreProveedor: '', nombreContralor: 'Profr. Juan Carlos Taboada B.',
      folio: '', nombreResguardante: '', areaResguardante: '', observaciones: '',
      articulos: [{ cantidad: '', descripcion: '', marca: '', serie: '', estado: '', inventario: '' }]
    });
  };

  const handleAddRow = () => {
    setFormData({ ...formData, articulos: [...formData.articulos, { cantidad: '', descripcion: '', marca: '', serie: '', estado: '', inventario: '' }] });
  };

  const handlePrintSubmit = async (e) => {
    e.preventDefault();
    
    // Guardar en base de datos si es recepción
    if (modalOpen === 'recepcion') {
      try {
        const validItems = formData.articulos.filter(art => art.cantidad || art.descripcion || art.marca);
        
        if (validItems.length > 0) {
          // 1. Guardar el documento general (Acta)
          await addDoc(collection(db, 'actas_recepcion'), {
            fecha: formData.fecha,
            hora: formData.hora,
            origen: formData.origen,
            proveedor: formData.proveedor,
            nombreProveedor: formData.nombreProveedor,
            nombreContralor: formData.nombreContralor,
            observaciones: formData.observaciones,
            articulosTotales: validItems.length,
            fechaRegistro: new Date().toISOString()
          });

          // 2. Guardar cada artículo en el inventario
          for (let i = 0; i < validItems.length; i++) {
            const art = validItems[i];
            const tempCode = `INV-NUEVO-${Date.now().toString().slice(-4)}${i}`;
            await addDoc(collection(db, 'inventario'), {
              codigo: tempCode,
              articulo: `${art.descripcion || ''} ${art.marca || ''}`.trim(),
              ubicacion: 'Bodega Contraloría',
              cantidad: Number(art.cantidad) || 1,
              estado: art.estado || 'Nuevo',
              serie: art.serie || '',
              fechaIngreso: new Date().toISOString()
            });
          }
        }
      } catch (error) {
        console.error("Error guardando en Firebase:", error);
        alert("Hubo un error al guardar en la base de datos.");
      }
    }

    setPrintData(formData);
    setPrintMode(modalOpen);
    setModalOpen(null);
    setTimeout(() => window.print(), 500);
  };

  const handleEditClick = (item) => {
    setEditingItem({ ...item });
    setModalOpen('editItem');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      const itemRef = doc(db, 'inventario', editingItem.id);
      await updateDoc(itemRef, {
        codigo: editingItem.codigo,
        articulo: editingItem.articulo,
        ubicacion: editingItem.ubicacion,
        cantidad: Number(editingItem.cantidad),
        estado: editingItem.estado,
      });
      setModalOpen(null);
      setEditingItem(null);
    } catch (error) {
      console.error("Error al actualizar:", error);
      alert("Hubo un error al actualizar el artículo.");
    }
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este artículo del inventario de forma permanente?")) {
      try {
        await deleteDoc(doc(db, 'inventario', id));
      } catch (error) {
        console.error("Error al eliminar:", error);
        alert("Hubo un error al eliminar el artículo.");
      }
    }
  };

  return (
    <>
    <div className={printMode ? "hidden" : "space-y-6"}>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Contraloría</h2>
          <p className="text-slate-500 text-sm">Control de ingresos (trámites) e inventario del mobiliario escolar.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pagos')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${activeTab === 'pagos' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <DollarSign className="w-4 h-4 mr-2" /> Registro de Pagos
          </button>
          <button
            onClick={() => setActiveTab('inventario')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${activeTab === 'inventario' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <PackageOpen className="w-4 h-4 mr-2" /> Inventario de Mobiliario
          </button>
        </nav>
      </div>

      {activeTab === 'pagos' && (
        <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="font-semibold text-slate-700">Ingresos Recientes</h3>
            <button className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-1" /> Registrar Pago
            </button>
          </div>
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Folio</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Alumno</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Concepto</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Monto</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Estatus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {pagosRecientes.map(p => (
                <tr key={p.folio}>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{p.folio}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{p.alumno}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{p.concepto}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-800">{p.monto}</td>
                  <td className="px-6 py-4 text-sm text-emerald-600 flex items-center">
                    <CheckCircle2 className="w-4 h-4 mr-1" /> {p.estado}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'inventario' && (
        <div className="space-y-6">
          {/* Tarjetas de Formatos Oficiales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 flex items-center justify-between shadow-sm">
              <div>
                <h4 className="font-bold text-blue-900 text-lg">Acta de Recepción</h4>
                <p className="text-blue-700 text-sm mt-1">Para el alta de bienes nuevos o donaciones.</p>
              </div>
              <button onClick={() => openModal('recepcion')} className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg shadow-md transition flex items-center">
                <Printer className="w-5 h-5 mr-2" /> Generar
              </button>
            </div>
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5 flex items-center justify-between shadow-sm">
              <div>
                <h4 className="font-bold text-amber-900 text-lg">Carta de Resguardo</h4>
                <p className="text-amber-700 text-sm mt-1">Para asignar bienes a maestros o áreas.</p>
              </div>
              <button onClick={() => openModal('resguardo')} className="bg-amber-600 hover:bg-amber-700 text-white p-3 rounded-lg shadow-md transition flex items-center">
                <Printer className="w-5 h-5 mr-2" /> Generar
              </button>
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-semibold text-slate-700">Catálogo de Bienes Activos</h3>
              <button className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
                <Plus className="w-4 h-4 mr-1" /> Añadir Artículo
              </button>
            </div>
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Código</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Artículo</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Ubicación</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Cantidad</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {inventario.map(i => (
                <tr key={i.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{i.codigo}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{i.articulo}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{i.ubicacion}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-bold">{i.cantidad}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${i.estado === 'Bueno' || i.estado === 'Nuevo' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {i.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right flex justify-end gap-2">
                    <button onClick={() => handleEditClick(i)} className="text-blue-600 hover:text-blue-900 p-1 bg-blue-50 rounded" title="Editar">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteClick(i.id)} className="text-red-600 hover:text-red-900 p-1 bg-red-50 rounded" title="Eliminar">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>

    {/* MODAL PARA GENERAR FORMATOS O EDITAR BIENES */}
    {modalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
        <div className={`bg-white rounded-xl shadow-2xl w-full my-8 ${modalOpen === 'editItem' ? 'max-w-lg' : 'max-w-4xl'}`}>
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
            <h3 className="font-bold text-xl text-slate-800">
              {modalOpen === 'recepcion' ? 'Generar Acta de Recepción' : 
               modalOpen === 'resguardo' ? 'Generar Carta de Resguardo' : 'Editar Bien del Inventario'}
            </h3>
            <button onClick={() => { setModalOpen(null); setEditingItem(null); }} className="text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="p-6">
            {modalOpen === 'editItem' && editingItem ? (
              <form onSubmit={handleSaveEdit}>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Código de Inventario</label>
                    <input type="text" value={editingItem.codigo} onChange={e => setEditingItem({...editingItem, codigo: e.target.value})} className="w-full p-2 border rounded font-mono text-sm bg-slate-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Artículo (Descripción y Marca)</label>
                    <input type="text" value={editingItem.articulo} onChange={e => setEditingItem({...editingItem, articulo: e.target.value})} className="w-full p-2 border rounded" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad</label>
                      <input type="number" value={editingItem.cantidad} onChange={e => setEditingItem({...editingItem, cantidad: e.target.value})} className="w-full p-2 border rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Estado Físico</label>
                      <input type="text" value={editingItem.estado} onChange={e => setEditingItem({...editingItem, estado: e.target.value})} className="w-full p-2 border rounded" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ubicación Actual</label>
                    <input type="text" value={editingItem.ubicacion} onChange={e => setEditingItem({...editingItem, ubicacion: e.target.value})} className="w-full p-2 border rounded" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button type="button" onClick={() => { setModalOpen(null); setEditingItem(null); }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancelar</button>
                  <button type="submit" className="px-6 py-2 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 shadow-sm">Guardar Cambios</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handlePrintSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
                  <input type="date" value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} className="w-full p-2 border rounded" />
                </div>
                
                {modalOpen === 'recepcion' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Hora de Recepción</label>
                      <input type="time" value={formData.hora} onChange={e => setFormData({...formData, hora: e.target.value})} className="w-full p-2 border rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Documento de Origen</label>
                      <input type="text" placeholder="Factura, Oficio, Donación..." value={formData.origen} onChange={e => setFormData({...formData, origen: e.target.value})} className="w-full p-2 border rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Proveedor o Entidad</label>
                      <input type="text" placeholder="Ej. SEP Guerrero" value={formData.proveedor} onChange={e => setFormData({...formData, proveedor: e.target.value})} className="w-full p-2 border rounded" />
                    </div>
                  </>
                )}

                {modalOpen === 'resguardo' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Folio (Opcional)</label>
                      <input type="text" placeholder="001" value={formData.folio} onChange={e => setFormData({...formData, folio: e.target.value})} className="w-full p-2 border rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Resguardante</label>
                      <input type="text" placeholder="Profr. Juan Pérez" value={formData.nombreResguardante} onChange={e => setFormData({...formData, nombreResguardante: e.target.value})} className="w-full p-2 border rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Área o Cargo</label>
                      <input type="text" placeholder="Ej. Aula 3 / Maestro de Historia" value={formData.areaResguardante} onChange={e => setFormData({...formData, areaResguardante: e.target.value})} className="w-full p-2 border rounded" />
                    </div>
                  </>
                )}
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center border-b pb-2 mb-4">
                  <h4 className="font-bold text-slate-800">Artículos</h4>
                  <button type="button" onClick={handleAddRow} className="text-sm font-medium text-primary-600 hover:text-primary-800">+ Agregar Fila</button>
                </div>
                
                {formData.articulos.map((art, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    {modalOpen === 'resguardo' && (
                      <input type="text" placeholder="No. Inventario" value={art.inventario} onChange={e => {
                        const newArts = [...formData.articulos]; newArts[idx].inventario = e.target.value; setFormData({...formData, articulos: newArts});
                      }} className="w-24 p-2 border rounded text-sm" />
                    )}
                    <input type="number" placeholder="Cant." value={art.cantidad} onChange={e => {
                      const newArts = [...formData.articulos]; newArts[idx].cantidad = e.target.value; setFormData({...formData, articulos: newArts});
                    }} className="w-16 p-2 border rounded text-sm" />
                    <input type="text" placeholder="Descripción" value={art.descripcion} onChange={e => {
                      const newArts = [...formData.articulos]; newArts[idx].descripcion = e.target.value; setFormData({...formData, articulos: newArts});
                    }} className="flex-1 p-2 border rounded text-sm" />
                    <input type="text" placeholder="Marca/Modelo" value={art.marca} onChange={e => {
                      const newArts = [...formData.articulos]; newArts[idx].marca = e.target.value; setFormData({...formData, articulos: newArts});
                    }} className="w-1/4 p-2 border rounded text-sm" />
                    <input type="text" placeholder="Estado (Bueno, Malo...)" value={art.estado} onChange={e => {
                      const newArts = [...formData.articulos]; newArts[idx].estado = e.target.value; setFormData({...formData, articulos: newArts});
                    }} className="w-24 p-2 border rounded text-sm" />
                  </div>
                ))}
                <p className="text-xs text-slate-500 mt-2 italic">Nota: Si dejas todos los artículos en blanco, se imprimirá una tabla vacía para llenarla a mano.</p>
              </div>

              {modalOpen === 'recepcion' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones</label>
                  <textarea rows="2" value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} className="w-full p-2 border rounded" placeholder="Daños visibles, faltantes..."></textarea>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setModalOpen(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-900 shadow-sm flex items-center">
                  <Printer className="w-4 h-4 mr-2" /> Imprimir Formato Oficial
                </button>
              </div>
            </form>
            )}
          </div>
        </div>
      </div>
    )}

    {printMode === 'recepcion' && printData && <ActaRecepcionPrint data={printData} />}
    {printMode === 'resguardo' && printData && <CartaResguardoPrint data={printData} />}
    </>
  );
}
