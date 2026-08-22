const fs = require('fs');
let c = fs.readFileSync('src/pages/dashboard/Contraloria.jsx', 'utf8');

const correctLucide = "import { DollarSign, PackageOpen, Plus, FileText, CheckCircle2, Printer, X, Edit2, Trash2, ScanLine, Search, Download, History, Monitor, Laptop, Projector, BookOpen, Tv, Speaker, Keyboard, Mouse, Server, Smartphone, Tablet, Archive, PenTool, Box, Armchair, Cpu, Wallet, AlertTriangle, TrendingUp, TrendingDown, BarChart as BarChartIcon, FileSpreadsheet, PieChart as PieChartIcon } from 'lucide-react';";

// remove all existing lucide-react imports
c = c.replace(/import\s+\{[^}]*\}\s+from\s+'lucide-react';/g, '');

// add it properly after react import
c = c.replace("import { useState, useEffect, useMemo } from 'react';", "import { useState, useEffect, useMemo } from 'react';\n" + correctLucide);

fs.writeFileSync('src/pages/dashboard/Contraloria.jsx', c);
console.log("Fixed lucide import fully");
