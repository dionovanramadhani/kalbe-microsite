import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { isTokenValid, getToken, getUserData, logout } from '../utils/auth';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const token = getToken();
  const user = getUserData();
  const isValid = Boolean(token && isTokenValid(token) && user);

  if (!isValid) {
    if (token && !user) {
      logout();
    }
    return <Navigate to="/login" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
