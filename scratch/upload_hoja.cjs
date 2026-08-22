const fs = require('fs');

let c = fs.readFileSync('src/components/HojaDeVida.jsx', 'utf8');

// Add file upload handler
if (!c.includes('handleFileUpload')) {
    const handler = `
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;
      setFotoPreview(base64String);
      try {
        const docRef = doc(db, "students", student.id);
        await updateDoc(docRef, { fotoUrl: base64String });
        console.log("Foto subida exitosamente");
      } catch (error) {
        console.error("Error al subir foto: ", error);
      }
    };
    reader.readAsDataURL(file);
  };
`;
    c = c.replace('const startCamera = async () => {', handler + '\n  const startCamera = async () => {');
}

// Add the upload button UI
if (!c.includes('handleFileUpload')) {
    // Wait I just added it. Let's make sure UI is added.
}

c = c.replace(
    /<button onClick=\{startCamera\} type="button" className="px-4 py-1\.5 bg-slate-800 text-white text-xs font-bold rounded shadow hover:bg-slate-900 flex items-center">\s*<Camera className="w-3 h-3 mr-1\.5" \/> Tomar Foto\s*<\/button>/,
    `<button onClick={startCamera} type="button" className="px-4 py-1.5 bg-slate-800 text-white text-xs font-bold rounded shadow hover:bg-slate-900 flex items-center">
                          <Camera className="w-3 h-3 mr-1.5" /> Tomar Foto
                         </button>
                         <label className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded shadow hover:bg-emerald-700 flex items-center cursor-pointer ml-2">
                            <Upload className="w-3 h-3 mr-1.5" /> Subir
                            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                         </label>`
);

// We need to import Upload icon if not imported
if (!c.includes('Upload') && c.includes('lucide-react')) {
    c = c.replace('Camera,', 'Camera, Upload,');
}

fs.writeFileSync('src/components/HojaDeVida.jsx', c);
console.log("Upload button added to HojaDeVida");
