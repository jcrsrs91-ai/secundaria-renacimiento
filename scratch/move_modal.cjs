const fs = require('fs');

let c = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');

// The modal block to extract
const modalStart = '{showPagoAdminModal && (';
const startIdx = c.indexOf(modalStart);

if (startIdx !== -1) {
  // Find the end of the modal block
  const endMarker = `        </div>\n      )}`;
  const endIdx = c.indexOf(endMarker, startIdx);
  if (endIdx !== -1) {
    const fullEndIdx = endIdx + endMarker.length;
    const modalBlock = c.substring(startIdx, fullEndIdx);
    
    // Remove the modal from its current position
    c = c.slice(0, startIdx) + c.slice(fullEndIdx);
    
    // Add it right before `</>`
    c = c.replace('</>\n  );\n}', modalBlock + '\n    </>\n  );\n}');
    
    fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', c);
    console.log("Moved showPagoAdminModal to root of component!");
  } else {
    console.log("Could not find end of modal block");
  }
} else {
  console.log("Could not find modal start");
}

