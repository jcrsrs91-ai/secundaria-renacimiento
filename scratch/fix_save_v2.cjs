const fs = require('fs');
let c = fs.readFileSync('src/components/Formato911.jsx', 'utf8');

const handleSaveRegex = /(await setDoc\(doc\(db, 'configuracion', 'formato911_historico'\), \{ tablesData: data, updatedAt: new Date\(\)\.toISOString\(\) \}\);)/;

const stateUpdate = `$1\n      setHistoricoData(data);`;

c = c.replace(handleSaveRegex, stateUpdate);

fs.writeFileSync('src/components/Formato911.jsx', c, 'utf8');
