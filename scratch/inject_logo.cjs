const fs = require('fs');
const https = require('https');

https.get('https://upload.wikimedia.org/wikipedia/commons/e/ea/Logo_Secretar%C3%ADa_de_Educaci%C3%B3n_Guerrero.png', (res) => {
  const data = [];
  res.on('data', (chunk) => {
    data.push(chunk);
  });
  res.on('end', () => {
    const buffer = Buffer.concat(data);
    const base64 = 'data:image/png;base64,' + buffer.toString('base64');
    
    let fileContent = fs.readFileSync('src/components/HojaInscripcionPrint.jsx', 'utf8');
    fileContent = fileContent.replace(
      'const logoSEG = "https://upload.wikimedia.org/wikipedia/commons/e/ea/Logo_Secretar%C3%ADa_de_Educaci%C3%B3n_Guerrero.png";',
      `const logoSEG = "${base64}";`
    );
    
    fs.writeFileSync('src/components/HojaInscripcionPrint.jsx', fileContent);
    console.log('Injected base64 logo');
  });
});
