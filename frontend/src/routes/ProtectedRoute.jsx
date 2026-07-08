// src/routes/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Spinner = () => (
  <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
    <div className="relative w-12 h-12">
      <div className="absolute inset-0 rounded-full border-4 border-primary-500/20" />
      <div className="absolute inset-0 rounded-full border-4 border-t-primary-500 animate-spin" />
    </div>
  </div>
);

export default function ProtectedRoute() {
  const { user, isLoggedIn, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  
  if (user && user.accountStatus && user.accountStatus !== 'active') {
    return <Navigate to="/account-status" replace />;
  }

  return <Outlet />;
}
