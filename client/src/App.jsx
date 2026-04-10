import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import MovieList    from './features/movies/MovieList';
import MovieDetail  from './features/movies/MovieDetail';
import ShowPage     from './features/booking/ShowPage';
import Checkout     from './features/booking/Checkout';
import Confirmation from './features/booking/Confirmation';
import MyBookings   from './features/booking/MyBookings';
import Login        from './features/auth/Login';
import Register     from './features/auth/Register';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <main className="main-content">
          <Routes>
            {/* Public */}
            <Route path="/"            element={<MovieList />} />
            <Route path="/movies/:id"  element={<MovieDetail />} />
            <Route path="/shows/:id"   element={<ShowPage />} />
            <Route path="/login"       element={<Login />} />
            <Route path="/register"    element={<Register />} />

            {/* Protected */}
            <Route path="/checkout/:bookingId"         element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/booking/:bookingId/confirmation" element={<ProtectedRoute><Confirmation /></ProtectedRoute>} />
            <Route path="/bookings/my"                 element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
          </Routes>
        </main>
      </Router>
    </AuthProvider>
  );
}

export default App;
