const fs = require('fs');

let file = fs.readFileSync('src/pages/dashboard/ControlEscolar.jsx', 'utf8');

// Move globalShiftFilter declaration up
const targetDecl = "const [globalShiftFilter, setGlobalShiftFilter] = useState('Todos');\n";
file = file.replace(targetDecl, ""); // Remove it from below

// Put it above _rawActivos
file = file.replace(
  "const [_rawActivos, setActivos] = useState([]);",
  targetDecl + "  const [_rawActivos, setActivos] = useState([]);"
);

fs.writeFileSync('src/pages/dashboard/ControlEscolar.jsx', file);
console.log('Fixed variable ordering crash');
