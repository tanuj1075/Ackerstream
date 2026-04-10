import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AdminProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <p className="empty-state">Loading...</p>;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (user.role !== 'ADMIN') return <Navigate to="/" replace />;

  return children;
};

export default AdminProtectedRoute;
