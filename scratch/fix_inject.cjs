const fs = require('fs');

let c = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');

const handleOld = `  const handleCerrarCiclo = async () => {
    if(!cicloEgreso) { alert('Ingresa la generación de egreso'); return; }
    
    const confirm1 = window.confirm('⚠ ADVERTENCIA: Estás a punto de Cerrar el Ciclo Escolar.\\n\\nEsto modificará los grados de tódos los alumnos de 1ro, 2do y 3ro masivamente.\\n\\n¿Deseas continuar?');
    if(!confirm1) return;
    const confirm2 = window.confirm('¿Estás COMPLETAMENTE SEGURO? Esta acción no se puede deshacer. Los alumnos de 3ro serán movidos a Egresados y los demás avanzarán de grado.');
    if(!confirm2) return;

    try {`;

const handleNew = `  const handleCerrarCiclo = async () => {
    if(!cicloEgreso) { alert('Ingresa la generación de egreso'); return; }
    
    const confirm1 = window.confirm('⚠ ADVERTENCIA: Estás a punto de Cerrar el Ciclo Escolar.\\n\\nEsto modificará los grados de tódos los alumnos de 1ro, 2do y 3ro masivamente.\\n\\n¿Deseas continuar?');
    if(!confirm1) return;
    const confirm2 = window.confirm('¿Estás COMPLETAMENTE SEGURO? Esta acción no se puede deshacer. Los alumnos de 3ro serán movidos a Egresados y los demás avanzarán de grado.');
    if(!confirm2) return;

    try {
      // Tomar Fotografía (Snapshot) para Formato 911
      const currentCycle = config?.cicloEscolarActual || '2025-2026';
      const snapshotAlumnos = _rawDirectorio.map(a => ({
        id: a.id || '',
        status: a.status || '',
        grado: a.grado || '',
        genero: a.genero || '',
        fechaNacimiento: a.fechaNacimiento || '',
        nacionalidad: a.nacionalidad || '',
        lenguaIndigena: a.lenguaIndigena || '',
        usaer: a.usaer || '',
        tipoPrimaria: a.tipoPrimaria || '',
        tieneBeca: a.tieneBeca || '',
        origenBeca: a.origenBeca || '',
        discapacidad: a.discapacidad || '',
        calificaciones: a.calificaciones || null,
        regularizacion: a.regularizacion || null,
        repetidor: a.repetidor || '',
        turno: a.turno || '',
        motivoBaja: a.motivoBaja || ''
      }));

      await setDoc(doc(db, 'historical_911', currentCycle.replace(/\\//g, '-')), {
        ciclo: currentCycle,
        alumnos: snapshotAlumnos,
        fechaCierre: new Date().toISOString()
      });`;

c = c.replace(handleOld, handleNew);
fs.writeFileSync('src/pages/dashboard/ControlEscolar.jsx', c, 'utf8');
console.log('Injected properly');
