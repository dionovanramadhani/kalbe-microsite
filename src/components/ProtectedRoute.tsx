import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { isTokenValid, getToken, getUserData, logout } from '../utils/auth';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const token = getToken();
  const user = getUserData();
  const isValid = Boolean(token && isTokenValid(token) && user);

  if (!isValid) {
    if (token && !user) {
      logout();
    }
    const currentPath = `${location.pathname}${location.search}`;
    const redirectParam = currentPath && currentPath !== '/' ? `?redirect=${encodeURIComponent(currentPath)}` : '';
    return <Navigate to={`/login${redirectParam}`} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
