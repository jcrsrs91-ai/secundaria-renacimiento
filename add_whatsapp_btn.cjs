const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');

const insertBtn = 
            <button onClick={handleCopyWhatsApp} className=" flex items-center px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors shadow-sm\>
 <MessageCircle className=\w-4 h-4 mr-2\ /> WhatsApp
 </button>
 <button onClick={handleExportCSV};

if (!code.includes('<MessageCircle')) {
 code = code.replace(/<button onClick=\{handleExportCSV\}/, insertBtn);
 fs.writeFileSync('src/pages/dashboard/ControlEscolar.jsx', code);
 console.log('Button inserted');
} else {
 console.log('Button already exists');
}