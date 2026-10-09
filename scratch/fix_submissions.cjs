const fs = require('fs');

// Fix PreInscripcion.jsx
let p = fs.readFileSync('src/pages/public/PreInscripcion.jsx', 'utf8');

const pOld = `    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {`;

const pNew = `    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    if (data.tieneBeca === 'NO' || data.tieneBeca === 'false') {
      data.origenBeca = '';
      data.nombreBeca = '';
    }
    if (data.lenguaIndigena === 'NO' || data.lenguaIndigena === 'false') {
      data.nombreLenguaIndigena = '';
    }

    try {`;

p = p.replace(pOld, pNew);
fs.writeFileSync('src/pages/public/PreInscripcion.jsx', p, 'utf8');


// Fix AddStudentModal.jsx
let a = fs.readFileSync('src/components/AddStudentModal.jsx', 'utf8');

const aOld = `      const taller = getTallerPorGrupo(formData.grupo);
      
      await addDoc(collection(db, "students"), {
        ...formData,`;

const aNew = `      const taller = getTallerPorGrupo(formData.grupo);
      
      const submitData = { ...formData };
      if (!submitData.tieneBeca || submitData.tieneBeca === 'false' || submitData.tieneBeca === false) {
         submitData.origenBeca = '';
         submitData.nombreBeca = '';
      }
      
      await addDoc(collection(db, "students"), {
        ...submitData,`;

a = a.replace(aOld, aNew);
fs.writeFileSync('src/components/AddStudentModal.jsx', a, 'utf8');

console.log('Fixed submissions!');
