import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const AdminLogin = () => {
  const { adminLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: 'admin@ticketales.com', password: 'Admin@123' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await adminLogin(form.email, form.password);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.error || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand-logo">🛠️ Tiketales Admin</div>
        <h2>Admin Sign In</h2>
        <p className="auth-subtitle">Use admin credentials to access dashboard</p>
        {error && <div className="error-alert">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field-group">
            <label>Email Address</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="field-group">
            <label>Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Signing in...' : 'Admin Login'}</button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
