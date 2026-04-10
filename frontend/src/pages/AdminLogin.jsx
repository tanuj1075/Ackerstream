import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AdminLogin = () => {
  const [email, setEmail] = useState('admin@ticketales.com');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/admin/login', { email, password });
      if (!['super_admin', 'staff'].includes(data.user.role)) {
        setError('You do not have admin privileges.');
        return;
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.user.role);
      localStorage.setItem('email', data.user.email);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.error || 'Admin login failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-card">
        <h2>Admin Login</h2>
        <p className="subtitle">Access Ticketales management console</p>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          </div>
          <button className="primary-btn" type="submit">Sign in as Admin</button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
