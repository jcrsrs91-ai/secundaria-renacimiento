const fs = require('fs');

let c = fs.readFileSync('src/components/CartaResguardoPrint.jsx', 'utf8');

c = c.replace("{data.cct || '12DST0068Y'}", "12DST0077B");
c = c.replace(">10</span>", ">24</span>");
c = c.replace("TELEFONO:</span>\n              <span className=\"border-b border-black flex-1 uppercase\"></span>", "TELEFONO:</span>\n              <span className=\"border-b border-black flex-1 uppercase\">7444415678</span>");

const directorOld = `<div className="text-center font-bold text-[10px] mb-2 px-2 uppercase">
            <div className="border-t border-black pt-1 mt-12 w-3/4 mx-auto"></div>
            DIRECTOR DE LA ESCUELA
          </div>`;

const directorNew = `<div className="text-center font-bold text-[10px] mb-2 px-2 uppercase">
            <div className="border-t border-black pt-1 mt-12 w-3/4 mx-auto"></div>
            PROFR. JUAN CARLOS TABOADA BARAJAS<br/>
            DIRECTOR DE LA ESCUELA
          </div>`;

c = c.replace(directorOld, directorNew);

// Make sure it fits perfectly on a letter landscape page.
// We change max-w-1000px and add specific heights
c = c.replace("max-width: 1000px;", "max-width: 1050px;");

fs.writeFileSync('src/components/CartaResguardoPrint.jsx', c, 'utf8');
console.log('Fixed CartaResguardoPrint');
