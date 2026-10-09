const fs = require('fs');
let c = fs.readFileSync('src/components/Formato911.jsx', 'utf8');

const loadRegex = /setHistoricoData\(docSnap\.data\(\)\.tablesData\);/;
const loadReplacement = `
          const d = docSnap.data();
          if (d.tablesDataJson) {
            setHistoricoData(JSON.parse(d.tablesDataJson));
          } else {
            setHistoricoData(d.tablesData);
          }
`;

c = c.replace(loadRegex, loadReplacement);

const saveRegex = /await setDoc\(doc\(db, 'configuracion', 'formato911_historico'\), \{ tablesData: data, updatedAt: new Date\(\)\.toISOString\(\) \}\);/;
const saveReplacement = `await setDoc(doc(db, 'configuracion', 'formato911_historico'), { tablesDataJson: JSON.stringify(data), updatedAt: new Date().toISOString() });`;

c = c.replace(saveRegex, saveReplacement);

fs.writeFileSync('src/components/Formato911.jsx', c, 'utf8');
