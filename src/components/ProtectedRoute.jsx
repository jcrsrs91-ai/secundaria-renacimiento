import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { currentUser, studentSession, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
      </div>
    );
  }

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
