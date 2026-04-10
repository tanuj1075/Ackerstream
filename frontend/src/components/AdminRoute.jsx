import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) return <Navigate to="/admin/login" replace />;
  if (!['super_admin', 'staff'].includes(role)) return <Navigate to="/" replace />;

  return children;
};

export default AdminRoute;
