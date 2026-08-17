const fs = require('fs');

const path = 'src/pages/public/Landing.jsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(
  "import { GraduationCap, UsersRound, Bell, ArrowRight, ShieldCheck, Megaphone, Calendar, MapPin, Hash, Phone } from 'lucide-react';",
  "import { GraduationCap, UsersRound, Bell, ArrowRight, ShieldCheck, Megaphone, Calendar, MapPin, Hash, Phone, Menu, X } from 'lucide-react';"
);

c = c.replace(
  "const [loadingNews, setLoadingNews] = useState(true);",
  "const [loadingNews, setLoadingNews] = useState(true);\n  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);"
);

const navOld = `<div className="hidden md:flex items-center gap-6">
              <Link to="/pre-inscripcion" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Admisiones</Link>
              <Link to="/acceso-padres" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Portal de Padres</Link>
              <Link to="/admin" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-all hover:scale-105 active:scale-95">
                <ShieldCheck className="w-4 h-4" />
                Acceso Personal
              </Link>
            </div>`;

const navNew = `<div className="hidden md:flex items-center gap-6">
              <Link to="/pre-inscripcion" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Admisiones</Link>
              <Link to="/acceso-padres" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Portal de Padres</Link>
              <Link to="/admin" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-all hover:scale-105 active:scale-95">
                <ShieldCheck className="w-4 h-4" />
                Acceso Personal
              </Link>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-300 hover:text-white p-2">
                {mobileMenuOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
              </button>
            </div>`;

c = c.replace(navOld, navNew);

const mobileMenuOld = `</nav>

      {/* Hero Section */}`;

const mobileMenuNew = `</nav>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-[112px] left-0 w-full bg-slate-900 border-b border-white/10 z-40 p-4 flex flex-col gap-4 shadow-xl animate-in slide-in-from-top-2">
          <Link to="/pre-inscripcion" className="text-white font-medium p-3 bg-white/5 rounded-lg text-center" onClick={() => setMobileMenuOpen(false)}>Admisiones</Link>
          <Link to="/acceso-padres" className="text-white font-medium p-3 bg-white/5 rounded-lg text-center" onClick={() => setMobileMenuOpen(false)}>Portal de Padres</Link>
          <Link to="/admin" className="text-white font-bold p-3 bg-primary-600 rounded-lg flex justify-center items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
            <ShieldCheck className="w-5 h-5" /> Acceso Personal (Admin)
          </Link>
        </div>
      )}

      {/* Hero Section */}`;

c = c.replace(mobileMenuOld, mobileMenuNew);

fs.writeFileSync(path, c);
