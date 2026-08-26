const fs = require('fs');

let fileContent = fs.readFileSync('src/components/HojaInscripcionPrint.jsx', 'utf8');

// Revert corsproxy
fileContent = fileContent.replace(
  '<img src={`https://corsproxy.io/?${encodeURIComponent(data.fotoUrl)}`} alt="Fotografía" className="w-full h-full object-cover grayscale" crossOrigin="anonymous" />',
  '<img src={data.fotoUrl} alt="Fotografía" className="w-full h-full object-cover grayscale" crossOrigin="anonymous" />'
);

fs.writeFileSync('src/components/HojaInscripcionPrint.jsx', fileContent);
console.log('Reverted corsproxy');
