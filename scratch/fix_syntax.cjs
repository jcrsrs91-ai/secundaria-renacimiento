const fs = require('fs');
let file = fs.readFileSync('src/components/KardexPrint.jsx', 'utf8');

// The file currently has:
//         return {
//           valor: finalMat,
//           originalValor: finalMat,
//           isRegularizacion: false,
//           fecha: null,
//           isReprobada: finalMat < 6,
//           t1: isNaN(t1) ? '-' : t1,
//           t2: isNaN(t2) ? '-' : t2,
//           t3: isNaN(t3) ? '-' : t3
//         };
//
//     }
//     
//     // 2. Fallback to active system grades
//
// We need to add `}` before the `}` that is already there. Actually, let's look at the context.
const target = `
        return {
          valor: finalMat,
          originalValor: finalMat,
          isRegularizacion: false,
          fecha: null,
          isReprobada: finalMat < 6,
          t1: isNaN(t1) ? '-' : t1,
          t2: isNaN(t2) ? '-' : t2,
          t3: isNaN(t3) ? '-' : t3
        };

    }
    
    // 2. Fallback to active system grades`;
    
const fix = `
        return {
          valor: finalMat,
          originalValor: finalMat,
          isRegularizacion: false,
          fecha: null,
          isReprobada: finalMat < 6,
          t1: isNaN(t1) ? '-' : t1,
          t2: isNaN(t2) ? '-' : t2,
          t3: isNaN(t3) ? '-' : t3
        };
      }
    }
    
    // 2. Fallback to active system grades`;
    
if (file.includes(target)) {
  file = file.replace(target, fix);
  fs.writeFileSync('src/components/KardexPrint.jsx', file);
  console.log('Fixed syntax error');
} else {
  // Try regex
  const regex = /t3: isNaN\(t3\) \? '-' : t3\s*};\s*\}\s*\/\/\s*2\.\s*Fallback/;
  if (regex.test(file)) {
    file = file.replace(regex, `t3: isNaN(t3) ? '-' : t3\n        };\n      }\n    }\n    \n    // 2. Fallback`);
    fs.writeFileSync('src/components/KardexPrint.jsx', file);
    console.log('Fixed syntax error via regex');
  } else {
    console.log('Target not found!');
  }
}
