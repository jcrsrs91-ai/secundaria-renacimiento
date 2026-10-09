const fs = require('fs');
const path = 'src/components/Formato911.jsx';
let c = fs.readFileSync(path, 'utf8');

const v8Code = `
  const calculosV8 = useMemo(() => {
    const rows = Array(6).fill(null).map(() => Array(9).fill(0));

    egresadosList.forEach(a => {
      let edadIndex = -1;
      if (a.fechaNacimiento) {
        const fn = new Date(a.fechaNacimiento + 'T12:00:00Z');
        const sep1 = new Date('2026-09-01T12:00:00Z');
        let edad = sep1.getFullYear() - fn.getFullYear();
        const m = sep1.getMonth() - fn.getMonth();
        if (m < 0 || (m === 0 && sep1.getDate() < fn.getDate())) {
          edad--;
        }
        
        if (edad <= 13) edadIndex = 0;
        else if (edad === 14) edadIndex = 1;
        else if (edad === 15) edadIndex = 2;
        else if (edad === 16) edadIndex = 3;
        else if (edad === 17) edadIndex = 4;
        else edadIndex = 5; // 18 o más
      } else {
        edadIndex = 1; // Fallback to 14
      }

      const isHombre = a.genero === 'Hombre';
      
      if (isHombre) rows[edadIndex][0]++;
      else rows[edadIndex][1]++;
      rows[edadIndex][2]++;

      if (a.lenguaIndigena === 'SÍ' || a.lenguaIndigena === 'SÃ ') rows[edadIndex][3]++;
      if (a.nacionalidad === 'EXTRANJERA') rows[edadIndex][4]++;

      if (a.discapacidad && a.discapacidad !== 'Ninguna' && a.discapacidad !== 'NO') {
        let d = a.discapacidad;
        let esTrastorno = d.includes('Trastorno') || d.includes('TDAH');
        let esSobresaliente = d.includes('Aptitudes sobresalientes');
        let esOtra = d.includes('Otras');

        if (!esTrastorno && !esSobresaliente && !esOtra) rows[edadIndex][5]++;
        else if (esTrastorno) rows[edadIndex][6]++;
        else if (esSobresaliente) rows[edadIndex][7]++;
        else if (esOtra) rows[edadIndex][8]++;
      }
    });

    return rows;
  }, [egresadosList]);
`;

c = c.replace('  const calculosV6 = useMemo(() => {', v8Code + '\n  const calculosV6 = useMemo(() => {');

// Update dependencies of useMemo returning the grid
c = c.replace('calculosV7]);', 'calculosV7, calculosV8]);');

fs.writeFileSync(path, c, 'utf8');
console.log('Added V8 calculations');
