import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get('/me');
        setUser(response.data.user);
      } catch (err) {
        console.error(err);
        // If unauthorized, token is likely invalid
        localStorage.removeItem('token');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="logo">TikeTales</div>
        <button onClick={handleLogout} className="logout-btn">Log Out</button>
      </nav>

      <main className="dashboard-content">
        <div className="welcome-card glass-card">
          <h1>Welcome, {user?.email} 👋</h1>
          <p>You have successfully logged into the minimal Fastify + React app.</p>
          <div className="stats-grid">
            <div className="stat-box">
              <h3>User ID</h3>
              <p>{user?.id}</p>
            </div>
            <div className="stat-box">
              <h3>Status</h3>
              <p className="status-active">Active</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
