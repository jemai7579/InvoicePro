import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Loader } from 'lucide-react';

/**
 * PrivateRoute Component
 * 
 * This component protects routes by checking the authentication state.
 * If the user is authenticated, it renders the child routes via <Outlet />.
 * If not, it redirects to the login page.
 */
const PrivateRoute = () => {
  const { user, loading } = useContext(AuthContext);

  // While checking authentication status (fetching /auth/me)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-10 h-10 animate-spin text-blue-600" />
          <p className="text-slate-500 font-medium animate-pulse">Vérification de la session...</p>
        </div>
      </div>
    );
  }

  // If authenticated, render the protected content, otherwise redirect to login
  return user ? <Outlet /> : <Navigate to="/" replace />;
};

export default PrivateRoute;

