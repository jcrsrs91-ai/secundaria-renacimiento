const fs = require('fs');
let c = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');

const regex = /const unsubAll = onSnapshot\(qAll, \(snapshot\) => \{/;
if(regex.test(c)) {
  const replacement = `
    const qTramites = query(collection(db, "tramites_pendientes"));
    const unsubTramites = onSnapshot(qTramites, snap => {
      setTramitesPagados(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubAll = onSnapshot(qAll, (snapshot) => {`;
    
  c = c.replace(regex, replacement);
  
  // Also clean up the listener
  const cleanupRegex = /return \(\) => unsubAll\(\);/;
  if(cleanupRegex.test(c)) {
    c = c.replace(cleanupRegex, `return () => { unsubAll(); unsubTramites(); };`);
  }
  
  fs.writeFileSync('src/pages/dashboard/ControlEscolar.jsx', c);
  console.log("Success");
} else {
  console.log("Regex not found");
}
