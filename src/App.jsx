import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
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

function App() {
  return (
    <Routes>
      {/* Rutas Públicas */}
      <Route path="/" element={<Login />} />
      <Route path="/pre-inscripcion" element={<PreInscripcion />} />

      {/* Rutas Privadas / Dashboard */}
      <Route path="/panel" element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="control-escolar" element={<ControlEscolar />} />
          <Route path="contraloria" element={<Contraloria />} />
          <Route path="trabajo-social" element={<TrabajoSocial />} />
          <Route path="coordinacion" element={<Coordinacion />} />
          <Route path="asistencia" element={<Asistencia />} />
          <Route path="biblioteca" element={<Biblioteca />} />
          <Route path="portal-familiar" element={<PortalTutores />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
