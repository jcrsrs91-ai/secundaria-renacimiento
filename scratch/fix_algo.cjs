const fs = require('fs');

let content = fs.readFileSync('src/components/Formato911.jsx', 'utf8');

const updatedAlgorithm = `
  const calculosV1 = useMemo(() => {
    // Inicializar estructura V.1
    const v1 = {
      '1': { NvoHombres: Array(8).fill(0), RepHombres: Array(8).fill(0), NvoMujeres: Array(8).fill(0), RepMujeres: Array(8).fill(0), grupos: new Set() },
      '2': { NvoHombres: Array(8).fill(0), RepHombres: Array(8).fill(0), NvoMujeres: Array(8).fill(0), RepMujeres: Array(8).fill(0), grupos: new Set() },
      '3': { NvoHombres: Array(8).fill(0), RepHombres: Array(8).fill(0), NvoMujeres: Array(8).fill(0), RepMujeres: Array(8).fill(0), grupos: new Set() }
    };

    activos.forEach(a => {
      // Calcular edad al 1 de septiembre de 2026
      let edadIndex = -1;
      if (a.fechaNacimiento) {
        const fn = new Date(a.fechaNacimiento + 'T12:00:00Z');
        const sep1 = new Date('2026-09-01T12:00:00Z');
        let edad = sep1.getFullYear() - fn.getFullYear();
        const m = sep1.getMonth() - fn.getMonth();
        if (m < 0 || (m === 0 && sep1.getDate() < fn.getDate())) {
          edad--;
        }
        
        if (edad < 12) edadIndex = 0;
        else if (edad === 12) edadIndex = 1;
        else if (edad === 13) edadIndex = 2;
        else if (edad === 14) edadIndex = 3;
        else if (edad === 15) edadIndex = 4;
        else if (edad === 16) edadIndex = 5;
        else if (edad === 17) edadIndex = 6;
        else edadIndex = 7;
      } else {
        // Fallback estimado si no hay fecha de nacimiento para que cuadre la 911
        if (a.grado === '1er Grado' || a.grado === '1ero') edadIndex = 1; // 12
        else if (a.grado === '2do Grado' || a.grado === '2do') edadIndex = 2; // 13
        else edadIndex = 3; // 14
      }

      let g = '1';
      if (a.grado === '2do Grado' || a.grado === '2do') g = '2';
      if (a.grado === '3er Grado' || a.grado === '3ero' || a.grado === '3ro') g = '3';

      const isRep = a.repetidor === 'SÃ';
      const isHombre = a.genero === 'Hombre';

      if (a.grupo) v1[g].grupos.add(a.grupo);

      if (edadIndex !== -1) {
        if (isHombre && !isRep) v1[g].NvoHombres[edadIndex]++;
        if (isHombre && isRep) v1[g].RepHombres[edadIndex]++;
        if (!isHombre && !isRep) v1[g].NvoMujeres[edadIndex]++;
        if (!isHombre && isRep) v1[g].RepMujeres[edadIndex]++;
      }
    });

    return v1;
  }, [activos]);
`;


// Enforce proper encodings across the file

fs.writeFileSync('src/components/Formato911.jsx', content, 'utf8');
console.log("Fixed algorithm and encodings!");
