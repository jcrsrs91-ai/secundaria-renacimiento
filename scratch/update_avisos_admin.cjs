const fs = require('fs');

const path = 'src/pages/dashboard/AvisosEscolares.jsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(
  "import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';",
  "import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';\nimport { ref, uploadBytes, getDownloadURL } from 'firebase/storage';"
);

c = c.replace(
  "import { db } from '../../firebase';",
  "import { db, storage } from '../../firebase';"
);

c = c.replace(
  "const [isActive, setIsActive] = useState(true);",
  "const [isActive, setIsActive] = useState(true);\n  const [imageFile, setImageFile] = useState(null);\n  const [uploading, setUploading] = useState(false);"
);

// openModal modification
c = c.replace(
  `  const openModal = (aviso = null) => {
    if (aviso) {
      setEditingAviso(aviso);
      setTitle(aviso.title);
      setContent(aviso.content);
      setType(aviso.type);
      setIsActive(aviso.isActive !== false);
    } else {`,
  `  const openModal = (aviso = null) => {
    setImageFile(null);
    setUploading(false);
    if (aviso) {
      setEditingAviso(aviso);
      setTitle(aviso.title);
      setContent(aviso.content);
      setType(aviso.type);
      setIsActive(aviso.isActive !== false);
    } else {`
);

// handleSubmit modification
const handleSubOld = `  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAviso) {
        const avisoRef = doc(db, 'avisos', editingAviso.id);
        await updateDoc(avisoRef, {
          title,
          content,
          type,
          isActive,
          updatedAt: serverTimestamp()
        });
        toast.success('Aviso actualizado correctamente');
      } else {
        await addDoc(collection(db, 'avisos'), {
          title,
          content,
          type,
          isActive,
          createdAt: serverTimestamp()
        });
        toast.success('Aviso publicado correctamente');
      }
      closeModal();
      fetchAvisos();
    } catch (error) {
      console.error("Error saving aviso:", error);
      toast.error('Error al guardar el aviso');
    }
  };`;

const handleSubNew = `  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      let imageUrl = editingAviso?.imageUrl || null;

      if (imageFile) {
        const fileRef = ref(storage, \`avisos_images/\${Date.now()}_\${imageFile.name}\`);
        await uploadBytes(fileRef, imageFile);
        imageUrl = await getDownloadURL(fileRef);
      }

      if (editingAviso) {
        const avisoRef = doc(db, 'avisos', editingAviso.id);
        const dataToUpdate = {
          title,
          content,
          type,
          isActive,
          updatedAt: serverTimestamp()
        };
        if (imageUrl) dataToUpdate.imageUrl = imageUrl;

        await updateDoc(avisoRef, dataToUpdate);
        toast.success('Aviso actualizado correctamente');
      } else {
        await addDoc(collection(db, 'avisos'), {
          title,
          content,
          type,
          isActive,
          imageUrl,
          createdAt: serverTimestamp()
        });
        toast.success('Aviso publicado correctamente');
      }
      closeModal();
      fetchAvisos();
    } catch (error) {
      console.error("Error saving aviso:", error);
      toast.error('Error al guardar el aviso');
    } finally {
      setUploading(false);
    }
  };`;

c = c.replace(handleSubOld, handleSubNew);

// Form update
const newFormSection = `</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Imagen / Flyer (Opcional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                {editingAviso?.imageUrl && !imageFile && (
                  <p className="text-xs text-sky-600 mt-1">Ya cuenta con una imagen guardada.</p>
                )}
                <label className="block text-sm font-medium text-slate-700 mt-4 mb-1">Estado</label>`;

c = c.replace(`</div>\n                <div>\n                  <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>`, newFormSection);

// Add loading text to submit button
c = c.replace(
  `{editingAviso ? 'Guardar Cambios' : 'Publicar Aviso'}`,
  `{uploading ? 'Guardando...' : editingAviso ? 'Guardar Cambios' : 'Publicar Aviso'}`
);
c = c.replace(`className="px-4 py-2 bg-primary-600`, `disabled={uploading} className="px-4 py-2 bg-primary-600 disabled:opacity-50`);

// Flyer tag in list
c = c.replace(
  `{aviso.isActive !== false ? 'Visible' : 'Oculto'}
                    </span>`,
  `{aviso.isActive !== false ? 'Visible' : 'Oculto'}
                    </span>
                    {aviso.imageUrl && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border bg-sky-50 text-sky-700 border-sky-200 flex items-center">
                        📸 Flyer
                      </span>
                    )}`
);

fs.writeFileSync(path, c);
