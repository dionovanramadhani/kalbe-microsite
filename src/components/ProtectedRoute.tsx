import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { isTokenValid, getToken } from '../utils/auth';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isValid = isTokenValid(getToken());

  if (!isValid) {
    return <Navigate to="/login" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
