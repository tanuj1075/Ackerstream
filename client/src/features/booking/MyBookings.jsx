import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';

const STATUS_STYLE = {
  PENDING:   { color: '#f59e0b', label: '⏳ Pending' },
  CONFIRMED: { color: '#10b981', label: '✅ Confirmed' },
  CANCELLED: { color: '#ef4444', label: '❌ Cancelled' },
  EXPIRED:   { color: '#6b7280', label: '⏰ Expired' },
};

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const [error, setError]       = useState(null);
  const LIMIT = 5;

  useEffect(() => {
    setLoading(true);
    client.get('/bookings/my', { params: { page, limit: LIMIT } })
      .then(res => { 
        setBookings(res.data.bookings || res.data.data || []); 
        setTotal(res.data.total || res.data.pagination?.total || 0); 
      })
      .catch(err => {
        setError(err.response?.data?.error || 'Failed to load bookings');
      })
      .finally(() => setLoading(false));
  }, [page]);

  if (loading) return <div className="loading-screen">Loading bookings...</div>;

  return (
    <div className="my-bookings-page">
      <div className="page-header">
        <h1>My Bookings</h1>
        <p className="page-subtitle">{total} total booking{total !== 1 ? 's' : ''}</p>
      </div>

      {error && <div className="error-alert">{error}</div>}

      {bookings.length === 0 && !error ? (
        <div className="empty-state">
          <p>No bookings yet.</p>
          <Link to="/" className="btn-primary" style={{ width: 'auto', marginTop: '1rem', display: 'inline-flex' }}>
            Browse Movies
          </Link>
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map(b => {
            const movie   = b.Show?.Movie;
            const theatre = b.Show?.Screen?.Theatre;
            const status  = STATUS_STYLE[b.status] || { color: '#6b7280', label: b.status };
            const seats   = b.BookingSeats || [];

            return (
              <div key={b.id} className="booking-card glass-panel">
                <div className="booking-card-left">
                  {movie?.poster_url && (
                    <img src={movie.poster_url} alt={movie.title} className="booking-poster" />
                  )}
                  <div className="booking-details">
                    <h3>{movie?.title || 'Unknown Movie'}</h3>
                    {theatre && <p>🏛 {theatre.name}, {theatre.city}</p>}
                    {b.Show && (
                      <p>🕒 {new Date(b.Show.start_time).toLocaleString([], {
                        weekday: 'short', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}</p>
                    )}
                    <p>💺 {seats.map(s => `${s.Seat?.row_label}${s.Seat?.seat_number}`).join(', ') || '—'}</p>
                  </div>
                </div>
                <div className="booking-card-right">
                  <span className="booking-status" style={{ color: status.color }}>{status.label}</span>
                  <span className="booking-amount">₹{parseFloat(b.total_amount).toFixed(2)}</span>
                  {b.status === 'PENDING' && (
                    <Link to={`/checkout/${b.id}`} className="btn-primary" style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                      Complete Payment
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {total > LIMIT && (
        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span>Page {page} of {Math.ceil(total / LIMIT)}</span>
          <button disabled={page * LIMIT >= total} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
