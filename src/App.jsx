import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import TutorLogin from './pages/public/TutorLogin';
import Landing from './pages/public/Landing';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import PreInscripcion from './pages/public/PreInscripcion';
import Dashboard from './pages/dashboard/Dashboard';
import ControlEscolar from './pages/dashboard/ControlEscolar';
import Contraloria from './pages/dashboard/Contraloria';
import TrabajoSocial from './pages/dashboard/TrabajoSocial';
import Coordinacion from './pages/dashboard/Coordinacion';
import Asistencia from './pages/dashboard/Asistencia';
import Biblioteca from './pages/dashboard/Biblioteca';
import PortalTutores from './pages/dashboard/PortalTutores';
import ImpresionDocumentos from './pages/dashboard/ImpresionDocumentos';
import AvisosEscolares from './pages/dashboard/AvisosEscolares';
import BuzonTutores from './pages/dashboard/BuzonTutores';
import GenerarCredenciales from './pages/dashboard/GenerarCredenciales';
import VerificacionCredencial from './pages/public/VerificacionCredencial';

function App() {
  return (
    <>
    <Routes>
      {/* Rutas Públicas */}
      <Route path="/" element={<Landing />} />
      <Route path="/admin" element={<Login />} />
      <Route path="/acceso-padres" element={<TutorLogin />} />
      <Route path="/pre-inscripcion" element={<PreInscripcion />} />
      <Route path="/verificar/:matricula" element={<VerificacionCredencial />} />

      {/* Rutas Privadas / Dashboard */}
      <Route path="/panel" element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="control-escolar" element={<ControlEscolar />} />
          <Route path="asistencia" element={<Asistencia />} />
          <Route path="credenciales" element={<GenerarCredenciales />} />
          <Route path="contraloria" element={<Contraloria />} />
          <Route path="trabajo-social" element={<TrabajoSocial />} />
          <Route path="coordinacion" element={<Coordinacion />} />
          <Route path="biblioteca" element={<Biblioteca />} />
          <Route path="portal-familiar" element={<PortalTutores />} />
          <Route path="impresion-documentos" element={<ImpresionDocumentos />} />
          <Route path="avisos" element={<AvisosEscolares />} />
          <Route path="buzon" element={<BuzonTutores />} />
        </Route>
      </Route>
    </Routes>
    <Toaster position="bottom-right" containerClassName="no-print" toastOptions={{ duration: 4000, style: { background: '#334155', color: '#fff', padding: '16px', borderRadius: '8px' } }} />
    </>

  );
}

export default App;
