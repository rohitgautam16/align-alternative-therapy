import useIsAuthenticated from 'react-auth-kit/hooks/useIsAuthenticated';
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';
import { Navigate } from 'react-router-dom';

export default function AdminRoute({ children }) {
  const isAuth = useIsAuthenticated(); // ✅ returns true or false
  const auth = useAuthUser(); // contains user info (user_roles etc.)

  if (!isAuth || !auth || auth.user_roles !== 1) {
    return <Navigate to="/admin-login" replace />;
  }

  return children;
}
