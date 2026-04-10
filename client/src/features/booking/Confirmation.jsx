import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import client from '../../api/client';

const Confirmation = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get(`/bookings/${bookingId}`)
      .then(res => {
        if (res.data.status !== 'CONFIRMED') navigate('/');
        setBooking(res.data);
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [bookingId, navigate]);

  if (loading) return <div className="loading-screen">Loading confirmation...</div>;
  if (!booking) return null;

  const movie   = booking.Show?.Movie;
  const theatre = booking.Show?.Screen?.Theatre;
  const payment = booking.Payment;
  const seats   = booking.BookingSeats || [];

  return (
    <div className="confirmation-page">
      <div className="confirmation-card glass-panel">
        <div className="confirm-icon">🎉</div>
        <h1>Booking Confirmed!</h1>
        <p className="confirm-subtitle">Your tickets are booked. Enjoy the show!</p>

        <div className="confirm-details">
          {movie && <div className="confirm-row"><span>🎬 Movie</span><strong>{movie.title}</strong></div>}
          {theatre && <div className="confirm-row"><span>🏛 Theatre</span><strong>{theatre.name}, {theatre.city}</strong></div>}
          {booking.Show && (
            <div className="confirm-row">
              <span>🕒 Time</span>
              <strong>{new Date(booking.Show.start_time).toLocaleString([], {
                weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
              })}</strong>
            </div>
          )}
          <div className="confirm-row">
            <span>💺 Seats</span>
            <strong>{seats.map(bs => `${bs.Seat?.row_label}${bs.Seat?.seat_number}`).join(', ')}</strong>
          </div>
          <div className="confirm-row">
            <span>💰 Total Paid</span>
            <strong className="confirm-amount">₹{parseFloat(booking.total_amount).toFixed(2)}</strong>
          </div>
          {payment && (
            <div className="confirm-row">
              <span>🧾 Ref</span>
              <strong className="confirm-ref">{payment.transaction_ref}</strong>
            </div>
          )}
        </div>

        <div className="confirm-actions">
          <Link to="/bookings/my" className="btn-outline" style={{ textAlign: 'center' }}>View My Bookings</Link>
          <Link to="/" className="btn-primary" style={{ width: 'auto', marginTop: 0, textDecoration: 'none', display: 'inline-flex' }}>
            Browse More Movies
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Confirmation;
