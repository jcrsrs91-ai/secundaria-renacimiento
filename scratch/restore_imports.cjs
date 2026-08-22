const fs = require('fs');
let c = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');

// Inject Recharts
if (!c.includes("from 'recharts';")) {
  c = "import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';\n" + c;
}

// Inject PieChartIcon
if (!c.includes('PieChartIcon')) {
  c = c.replace("from 'lucide-react';", ", PieChart as PieChartIcon } from 'lucide-react';");
} else if (!c.includes('PieChart as PieChartIcon')) {
  c = c.replace("PieChartIcon", "PieChart as PieChartIcon");
}

// Inject FileSpreadsheet
if (!c.includes('FileSpreadsheet')) {
  c = c.replace("from 'lucide-react';", ", FileSpreadsheet } from 'lucide-react';");
}

// Clean up duplicate commas
c = c.replace(/,\s*,/g, ',');
c = c.replace(/\{\s*,/g, '{');
c = c.replace(/,\s*\}/g, '}');

fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', c);
console.log("Restored all missing imports!");
