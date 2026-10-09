const fs = require('fs');

let c = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');

const tOld = `      await setDoc(doc(db, 'historical_911', currentCycle.replace(/\\//g, '-')), {
        ciclo: currentCycle,
        alumnos: snapshotAlumnos,
        fechaCierre: new Date().toISOString()
      });`;

const tNew = `      await setDoc(doc(db, 'historical_911', currentCycle.replace(/\\//g, '-')), {
        ciclo: currentCycle,
        alumnos: snapshotAlumnos,
        fechaCierre: new Date().toISOString()
      });
      await setDoc(doc(db, 'historical_911', 'latest'), {
        ciclo: currentCycle,
        alumnos: snapshotAlumnos,
        fechaCierre: new Date().toISOString()
      });`;

c = c.replace(tOld, tNew);

fs.writeFileSync('src/pages/dashboard/ControlEscolar.jsx', c, 'utf8');
console.log('Fixed ControlEscolar');
