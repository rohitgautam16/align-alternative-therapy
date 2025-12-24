// src/components/admin/AdminRoutes.jsx
import { Navigate } from 'react-router-dom';
import { useAuthStatus } from '../../hooks/useAuthStatus';
import AuthGate from '../common/AuthGate';

export default function AdminRoute({ children }) {
  const { isAuth, user } = useAuthStatus();

  // Still checking auth / refresh
  if (isAuth === null) {
    return <AuthGate loading />;
  }

  // Not logged in OR not admin
  if (!isAuth || !user || user.user_roles !== 1) {
    return <Navigate to="/admin-login" replace />;
  }

  return children;
}
