const fs = require('fs');

function testDecode() {
  const file = fs.readFileSync('src/components/ConstanciaPrint.jsx', 'utf8');
  const buffer = Buffer.from(file, 'latin1');
  const fixed = buffer.toString('utf8');
  
  if (fixed.includes('Educación Básica') || fixed.includes('Técnica')) {
    console.log('YES! Buffer conversion fixed it.');
    // Let's check for any remaining weird chars
    const regex = /.{0,10}[^\x00-\x7F].{0,10}/g;
    let match;
    const matches = [];
    while ((match = regex.exec(fixed)) !== null) {
      matches.push(match[0]);
    }
    console.log(matches.slice(0, 10).join('\n'));
    
    fs.writeFileSync('src/components/ConstanciaPrint.jsx', fixed);
    console.log('File written.');
  } else {
    console.log('Nope, didn\'t work.');
  }
}
testDecode();
