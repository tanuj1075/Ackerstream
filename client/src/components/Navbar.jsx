import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">🎬 Tiketales</Link>
      <div className="nav-links">
        <Link to="/" className="nav-link">Movies</Link>
        {user ? (
          <>
            <Link to="/bookings/my" className="nav-link">My Bookings</Link>
            {user.role === 'ADMIN' && <Link to="/admin" className="nav-link">Admin</Link>}
            <span className="nav-user">Hi, {user.name?.split(' ')[0]}</span>
            <button onClick={logout} className="btn-outline">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/admin/login" className="nav-link">Admin Login</Link>
            <Link to="/register" className="btn-outline">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
