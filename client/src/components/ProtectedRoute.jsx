import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import LoadingScreen from './LoadingScreen.jsx';

export default function ProtectedRoute() {
  const { user, checkingSession } = useAuth();
  if (checkingSession) return <LoadingScreen />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
