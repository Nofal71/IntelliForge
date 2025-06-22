import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/Authcontext';

const ProtectedRoute = () => {
  const { user , userData } = useAuth();
  return user && userData ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
