const fs = require('fs');
const file = 'src/pages/public/Landing.jsx';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(
  "import { GraduationCap, UsersRound, Bell, ArrowRight, ShieldCheck, Megaphone, Calendar } from 'lucide-react';",
  "import { GraduationCap, UsersRound, Bell, ArrowRight, ShieldCheck, Megaphone, Calendar, MapPin, Hash, Phone } from 'lucide-react';"
);

const oldNav = `<nav className="fixed w-full z-50 top-0 left-0 border-b border-white/10 bg-slate-900/40 backdrop-blur-md">
      
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">`;

const newNav = `<nav className="fixed w-full z-50 top-0 left-0 border-b border-white/10 bg-slate-900/40 backdrop-blur-md flex flex-col">
        <div className="bg-sky-600/95 text-white text-[10px] sm:text-xs py-1.5 px-4 flex justify-center sm:justify-between items-center w-full shadow-md">
          <div className="hidden md:flex items-center justify-between max-w-7xl mx-auto w-full px-2 lg:px-6">
            <span className="flex items-center gap-1.5 font-medium"><MapPin className="w-3.5 h-3.5" /> Calle Alta Quebradora y And. 24 Febrero S/N, Cd. Renacimiento, Acapulco</span>
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-1.5 font-bold tracking-wider"><Hash className="w-3.5 h-3.5" /> C.C.T. 12DST0077B</span>
              <span className="flex items-center gap-1.5 font-bold tracking-wider"><Phone className="w-3.5 h-3.5" /> Tel. 744 441 5678</span>
            </div>
          </div>
          <div className="flex md:hidden items-center justify-center gap-4 w-full">
            <span className="flex items-center gap-1 font-bold"><Hash className="w-3 h-3" /> 12DST0077B</span>
            <span className="flex items-center gap-1 font-bold"><Phone className="w-3 h-3" /> 744 441 5678</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex justify-between h-20 items-center">`;

c = c.replace(oldNav, newNav);

fs.writeFileSync(file, c);
