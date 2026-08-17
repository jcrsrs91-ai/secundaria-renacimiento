const fs = require('fs');
const path = 'src/pages/dashboard/AvisosEscolares.jsx';
let c = fs.readFileSync(path, 'utf8');

const targetFuncStart = `  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('El título y el contenido son obligatorios');
      return;
    }

    try {
      if (editingAviso) {`;

const targetFuncFull = `  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('El título y el contenido son obligatorios');
      return;
    }

    try {
      if (editingAviso) {
        // Update
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
        // Create
        await addDoc(collection(db, 'avisos'), {
          title,
          content,
          type,
          isActive,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        toast.success('Aviso creado correctamente');
      }
      closeModal();
      fetchAvisos();
    } catch (error) {
      console.error("Error saving aviso:", error);
      toast.error('Error al guardar el aviso');
    }
  };`;

const newFunc = `  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('El título y el contenido son obligatorios');
      return;
    }

    setUploading(true);
    try {
      let uploadedImageUrl = editingAviso?.imageUrl || null;

      if (imageFile) {
        const imageRef = ref(storage, \`avisos/\${Date.now()}_\${imageFile.name}\`);
        const snapshot = await uploadBytes(imageRef, imageFile);
        uploadedImageUrl = await getDownloadURL(snapshot.ref);
      }

      if (editingAviso) {
        // Update
        const avisoRef = doc(db, 'avisos', editingAviso.id);
        const updateData = {
          title,
          content,
          type,
          turno,
          isActive,
          updatedAt: serverTimestamp()
        };
        if (uploadedImageUrl) {
          updateData.imageUrl = uploadedImageUrl;
        }
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
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        if (uploadedImageUrl) {
          newData.imageUrl = uploadedImageUrl;
        }
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
      setImageFile(null);
    }
  };`;

c = c.replace(targetFuncFull, newFunc);
fs.writeFileSync(path, c);
