import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const AdminPanel = () => {
  const { user } = useAuth();

  return (
    <section className="movie-detail-page">
      <div className="page-header">
        <h1>Admin Panel</h1>
        <p className="page-subtitle">Welcome {user?.name}. Use this account to manage operations.</p>
      </div>

      <div className="theatre-block">
        <h3>Admin Login is now active ✅</h3>
        <p className="page-subtitle" style={{ marginTop: '0.5rem' }}>
          You are logged in as <strong>{user?.email}</strong> with role <strong>{user?.role}</strong>.
        </p>
      </div>

      <div className="theatre-block">
        <h3>Default Credentials</h3>
        <p className="page-subtitle" style={{ marginTop: '0.5rem' }}>Email: admin@ticketales.com</p>
        <p className="page-subtitle">Password: Admin@123</p>
      </div>
    </section>
  );
};

export default AdminPanel;
