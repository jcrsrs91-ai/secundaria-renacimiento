const fs = require('fs');

let c = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');

if (!c.includes('corteConfig') || c.includes('corteConfig is not defined')) {
  const target = "const [activeIngresoTab, setActiveIngresoTab] = useState('generales');";
  const replacement = `const [corteConfig, setCorteConfig] = useState({ fechaInicio: new Date().toISOString().split('T')[0], fechaFin: new Date().toISOString().split('T')[0], turno: 'Ambos' });\n  const [activeIngresoTab, setActiveIngresoTab] = useState('generales');`;
  c = c.replace(target, replacement);
}

if (!c.includes('Wallet,') || !c.includes('AlertTriangle,')) {
  c = c.replace(
    "import { Users, BookOpen, Clock, FileText, CheckCircle2, ShieldCheck, Search, Filter, Megaphone, Activity, Download, Printer, Plus, Edit, Trash2, X, Image as ImageIcon, BarChart as BarChartIcon, PieChart as PieChartIcon, Check, Package, PackageOpen, LayoutDashboard, TrendingUp, TrendingDown, ArrowLeftRight, Settings, ScanLine, Smartphone, Calendar as CalendarIcon, FileSpreadsheet } from 'lucide-react';",
    "import { Users, BookOpen, Clock, FileText, CheckCircle2, ShieldCheck, Search, Filter, Megaphone, Activity, Download, Printer, Plus, Edit, Trash2, X, AlertTriangle, Wallet, Image as ImageIcon, BarChart as BarChartIcon, PieChart as PieChartIcon, Check, Package, PackageOpen, LayoutDashboard, TrendingUp, TrendingDown, ArrowLeftRight, Settings, ScanLine, Smartphone, Calendar as CalendarIcon, FileSpreadsheet } from 'lucide-react';"
  );
  
  // Try another possible import string
  c = c.replace(
    "import { Users, BookOpen, Clock, FileText, CheckCircle2, ShieldCheck, Search, Filter, Megaphone, Activity, Download, Printer, Plus, Edit, Trash2, X, AlertTriangle, Image as ImageIcon, BarChart as BarChartIcon, PieChart as PieChartIcon, Check, Package, PackageOpen, LayoutDashboard, TrendingUp, TrendingDown, ArrowLeftRight, Settings, ScanLine, Smartphone, Calendar as CalendarIcon, FileSpreadsheet } from 'lucide-react';",
    "import { Users, BookOpen, Clock, FileText, CheckCircle2, ShieldCheck, Search, Filter, Megaphone, Activity, Download, Printer, Plus, Edit, Trash2, X, AlertTriangle, Wallet, Image as ImageIcon, BarChart as BarChartIcon, PieChart as PieChartIcon, Check, Package, PackageOpen, LayoutDashboard, TrendingUp, TrendingDown, ArrowLeftRight, Settings, ScanLine, Smartphone, Calendar as CalendarIcon, FileSpreadsheet } from 'lucide-react';"
  );
}

// Ensure lucide-react imports have Wallet and AlertTriangle
const importTarget = "from 'lucide-react';";
if (c.indexOf('Wallet') === -1 || c.indexOf('Wallet') > c.indexOf(importTarget)) {
   c = c.replace("from 'lucide-react';", ", Wallet, AlertTriangle } from 'lucide-react';").replace("} ,", ",");
}

fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', c);
console.log("Fixed missing definitions");
