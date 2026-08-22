const fs = require('fs');

const fileContent = `import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { Megaphone, Plus, Edit2, Trash2, X, Check, Info, AlertTriangle, Paperclip, Image as ImageIcon, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AvisosEscolares() {
  const [avisos, setAvisos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAviso, setEditingAviso] = useState(null);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('info'); // info, warning, success
  const [isActive, setIsActive] = useState(true);
  const [turno, setTurno] = useState('ambos');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchAvisos();
  }, []);

  const fetchAvisos = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'avisos'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const avisosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAvisos(avisosData);
    } catch (error) {
      console.error("Error fetching avisos:", error);
      toast.error('Error al cargar los avisos');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (aviso = null) => {
    if (aviso) {
      setEditingAviso(aviso);
      setTitle(aviso.title || '');
      setContent(aviso.content || '');
      setType(aviso.type || 'info');
      setIsActive(aviso.isActive !== false);
      setTurno(aviso.turno || 'ambos');
    } else {
      setEditingAviso(null);
      setTitle('');
      setContent('');
      setType('info');
      setIsActive(true);
      setTurno('ambos');
    }
    setFiles([]);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAviso(null);
    setFiles([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('El título y el contenido son obligatorios');
      return;
    }

    setUploading(true);
    try {
      let currentAttachments = editingAviso?.attachments || [];
      // Backward compatibility for old imageUrl
      if (editingAviso?.imageUrl && currentAttachments.length === 0) {
        currentAttachments = [{ url: editingAviso.imageUrl, type: 'image', name: 'flyer_adjunto.jpg' }];
      }

      const newUploadedFiles = [];
      
      if (files.length > 0) {
        for (const file of files) {
          const isImage = file.type.startsWith('image/');
          const fileType = isImage ? 'image' : 'pdf';
          const fileRef = ref(storage, \`avisos/\${Date.now()}_\${file.name}\`);
          const snapshot = await uploadBytes(fileRef, file);
          const url = await getDownloadURL(snapshot.ref);
          newUploadedFiles.push({ url, type: fileType, name: file.name });
        }
      }

      // We append new files to existing ones when updating, if we wanted to replace we would just use newUploadedFiles
      const finalAttachments = files.length > 0 ? [...currentAttachments, ...newUploadedFiles] : currentAttachments;

      if (editingAviso) {
        // Update
        const avisoRef = doc(db, 'avisos', editingAviso.id);
        const updateData = {
          title,
          content,
          type,
          turno,
          isActive,
          attachments: finalAttachments,
          updatedAt: serverTimestamp()
        };
        await updateDoc(avisoRef, updateData);
        toast.success('Aviso actualizado correctamente');
      } else {
        // Create
        const newData = {
          title,
          content,
          type,
          turno,
          isActive,
          attachments: finalAttachments,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        await addDoc(collection(db, 'avisos'), newData);
        toast.success('Aviso creado correctamente');
      }
      closeModal();
      fetchAvisos();
    } catch (error) {
      console.error("Error saving aviso:", error);
      toast.error('Error al guardar el aviso');
    } finally {
      setUploading(false);
      setFiles([]);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este aviso? Esta acción no se puede deshacer.')) {
      try {
        await deleteDoc(doc(db, 'avisos', id));
        toast.success('Aviso eliminado');
        fetchAvisos();
      } catch (error) {
        console.error("Error deleting aviso:", error);
        toast.error('Error al eliminar el aviso');
      }
    }
  };
  
  const removeAttachment = async (attachmentIndex) => {
    if (!editingAviso) return;
    if (!window.confirm('¿Eliminar este adjunto?')) return;
    
    let currentAttachments = editingAviso.attachments || [];
    if (editingAviso.imageUrl && currentAttachments.length === 0) {
       currentAttachments = [{ url: editingAviso.imageUrl, type: 'image', name: 'flyer_adjunto.jpg' }];
    }
    
    const newAttachments = currentAttachments.filter((_, idx) => idx !== attachmentIndex);
    try {
      const avisoRef = doc(db, 'avisos', editingAviso.id);
      await updateDoc(avisoRef, { attachments: newAttachments });
      setEditingAviso({ ...editingAviso, attachments: newAttachments });
      fetchAvisos(); // refresh list in background
      toast.success('Adjunto eliminado');
    } catch (e) {
      toast.error('Error al eliminar adjunto');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center">
            <Megaphone className="mr-2 text-primary-600" />
            Gestión de Avisos
          </h2>
          <p className="text-slate-500 mt-1">Administra los avisos que aparecen en la pantalla principal de la escuela.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nuevo Aviso
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Cargando avisos...</div>
        ) : avisos.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No hay avisos publicados. Haz clic en "Nuevo Aviso" para crear uno.
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {avisos.map(aviso => {
               const hasAttachments = (aviso.attachments && aviso.attachments.length > 0) || aviso.imageUrl;
               return (
              <div key={aviso.id} className="p-6 hover:bg-slate-50 transition-colors flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={\`px-2.5 py-0.5 rounded-full text-xs font-medium border \${
                      aviso.type === 'warning' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 
                      aviso.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      'bg-blue-50 text-blue-700 border-blue-200'
                    }\`}>
                      {aviso.type === 'warning' ? 'Importante' : aviso.type === 'success' ? 'Éxito' : 'Informativo'}
                    </span>
                    <span className={\`px-2.5 py-0.5 rounded-full text-xs font-medium border \${
                      aviso.isActive !== false ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                    }\`}>
                      {aviso.isActive !== false ? 'Visible' : 'Oculto'}
                    </span>
                    {aviso.createdAt && (
                      <span className="text-xs text-slate-400">
                        {new Date(aviso.createdAt.seconds * 1000).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">{aviso.title}</h3>
                  {hasAttachments && (
                    <div className="mt-2 mb-2 flex items-center gap-1 text-primary-600 bg-primary-50 px-2 py-1 rounded-md w-max text-xs font-semibold">
                      <Paperclip className="w-3 h-3" />
                      {aviso.attachments ? aviso.attachments.length : 1} adjunto(s)
                    </div>
                  )}
                  <p className="text-slate-600 mt-1 whitespace-pre-wrap">{aviso.content}</p>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => openModal(aviso)}
                    className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(aviso.id)}
                    className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )})}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto py-10">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-auto overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">
                {editingAviso ? 'Editar Aviso' : 'Crear Nuevo Aviso'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ej. Suspensión de labores, Entrega de boletas..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contenido del Aviso</label>
                <textarea
                  required
                  rows="4"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Detalla la información del aviso aquí..."
                ></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Aviso</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="info">Informativo (Azul)</option>
                    <option value="warning">Urgente/Importante (Naranja)</option>
                    <option value="success">Positivo/Éxito (Verde)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Turno</label>
                  <select
                    value={turno}
                    onChange={(e) => setTurno(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 mb-4"
                  >
                    <option value="ambos">Ambos Turnos</option>
                    <option value="matutino">Turno Matutino</option>
                    <option value="vespertino">Turno Vespertino</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                  <select
                    value={isActive ? "true" : "false"}
                    onChange={(e) => setIsActive(e.target.value === "true")}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="true">Visible al público</option>
                    <option value="false">Oculto (Borrador)</option>
                  </select>
                </div>
              </div>
              
              <div className="pt-2 border-t border-slate-100 mt-2">
                <label className="block text-sm font-medium text-slate-700 mb-2 mt-4">Adjuntar Archivos (Imágenes y PDFs)</label>
                
                {/* Visualizar adjuntos existentes */}
                {editingAviso && ((editingAviso.attachments && editingAviso.attachments.length > 0) || editingAviso.imageUrl) && (
                  <div className="mb-4 space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Archivos ya subidos:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {((editingAviso.attachments && editingAviso.attachments.length > 0) ? editingAviso.attachments : [{url: editingAviso.imageUrl, type: 'image', name: 'flyer_adjunto.jpg'}]).map((att, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg">
                           <div className="flex items-center truncate mr-2">
                              {att.type === 'image' ? <ImageIcon className="w-4 h-4 text-sky-500 mr-2 shrink-0"/> : <FileText className="w-4 h-4 text-rose-500 mr-2 shrink-0"/>}
                              <span className="text-xs text-slate-600 truncate">{att.name}</span>
                           </div>
                           <button type="button" onClick={() => removeAttachment(idx)} className="p-1 hover:bg-slate-200 rounded-full text-slate-500 hover:text-red-500">
                             <X className="w-3 h-3" />
                           </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={(e) => setFiles(Array.from(e.target.files))}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                {files.length > 0 && (
                  <p className="mt-2 text-xs font-medium text-sky-600">{files.length} archivo(s) nuevo(s) seleccionado(s).</p>
                )}
                <p className="mt-1 text-xs text-slate-400">Puedes seleccionar varias imágenes o PDFs a la vez.</p>
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading} className="px-4 py-2 bg-primary-600 disabled:opacity-50 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center"
                >
                  <Check className="h-4 w-4 mr-2" />
                  {uploading ? 'Guardando Archivos...' : editingAviso ? 'Guardar Cambios' : 'Publicar Aviso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
`;

fs.writeFileSync('src/pages/dashboard/AvisosEscolares.jsx', fileContent);
console.log("Successfully updated AvisosEscolares.jsx");
