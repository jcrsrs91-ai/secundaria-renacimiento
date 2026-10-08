const fs = require('fs');

let c = fs.readFileSync('src/components/Formato911.jsx', 'utf8');

const newLogic = `        if (edad < 12) edadIndex = 0;
        else if (edad === 12) edadIndex = 1;
        else if (edad === 13) edadIndex = 2;
        else if (edad === 14) edadIndex = 3;
        else if (edad === 15) edadIndex = 4;
        else if (edad === 16) edadIndex = 5;
        else if (edad === 17) edadIndex = 6;
        else edadIndex = 7;
      } else {
        // Fallback estimado si no hay fecha de nacimiento para que cuadre la 911
        if (a.grado === '1er Grado' || a.grado === '1ero' || a.grado === '1') edadIndex = 1; // 12
        else if (a.grado === '2do Grado' || a.grado === '2do' || a.grado === '2') edadIndex = 2; // 13
        else edadIndex = 3; // 14
      }

      let g = '1';
      if (a.grado === '2do Grado' || a.grado === '2do' || a.grado === '2') g = '2';
      if (a.grado === '3er Grado' || a.grado === '3ero' || a.grado === '3ro' || a.grado === '3') g = '3';
`;

// I need to find the exact lines to replace.
// Let's replace the `const g = a.grado === ...` part too.

const oldLogic = `        if (edad < 12) edadIndex = 0;
        else if (edad === 12) edadIndex = 1;
        else if (edad === 13) edadIndex = 2;
        else if (edad === 14) edadIndex = 3;
        else if (edad === 15) edadIndex = 4;
        else if (edad === 16) edadIndex = 5;
        else if (edad === 17) edadIndex = 6;
        else edadIndex = 7;
      }

      const g = a.grado === '1er Grado' ? '1' : a.grado === '2do Grado' ? '2' : '3';`;

c = c.replace(oldLogic, newLogic);
fs.writeFileSync('src/components/Formato911.jsx', c, 'utf8');
console.log('Fallback applied successfully');
