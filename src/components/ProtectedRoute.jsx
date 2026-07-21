import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { currentUser, studentSession } = useAuth();
  const location = useLocation();

  // Si no hay ningún tipo de sesión
  if (!currentUser && !studentSession) {
    if (location.pathname === '/panel/portal-familiar') {
      return <Navigate to="/acceso-padres" replace />;
    }
    return <Navigate to="/admin" replace />;
  }

  // Si es un tutor/alumno y trata de entrar a algo que no es su portal, lo redirigimos a su portal
  if (studentSession && !currentUser) {
    if (location.pathname !== '/panel/portal-familiar') {
      return <Navigate to="/panel/portal-familiar" replace />;
    }
  }

  // Si es administrativo (currentUser), puede ver todo el panel.
  return <Outlet />;
}
