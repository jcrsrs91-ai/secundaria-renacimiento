const fs = require('fs');

let content = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');

const becasBlock = `        {!loading && activeTab === 'becas' && !printMode && (
          <BecasReport activos={activos} onClose={() => setActiveTab('activos')} />
        )}`;

const f911Block = `\n        {!loading && activeTab === 'estadistica911' && !printMode && (
          <Formato911 activos={activos} />
        )}`;

if (content.includes(becasBlock) && !content.includes("<Formato911")) {
  content = content.replace(becasBlock, `${becasBlock}${f911Block}`);
  fs.writeFileSync('src/pages/dashboard/ControlEscolar.jsx', content, 'utf8');
  console.log('Successfully injected <Formato911 /> into render tree.');
} else {
  console.log('Failed to match or already injected.');
}
