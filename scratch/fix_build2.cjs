const fs = require('fs');

let con = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');

const targetStr = `      </div>
    )}

    
     
      />
    )}
    
    {showPagoAdminModal && (`.replace(/\r\n/g, '\n'); // Normalize just in case

// Using simple replace might fail due to exact whitespace differences.
// So let's find `/>` followed by `)}` before `{showPagoAdminModal`
con = con.replace(/\/>\s*\)\}\s*\{showPagoAdminModal/, "{showPagoAdminModal");

fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', con);
console.log("Fixed!");
