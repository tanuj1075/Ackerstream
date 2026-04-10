/**
 * Checkout v2 — uses useCountdownTimer hook instead of manual setInterval.
 */
import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { useCountdownTimer } from '../../hooks/useCountdownTimer';

const PAYMENT_METHODS = [
  { id: 'CARD',   label: '💳 Credit / Debit Card' },
  { id: 'UPI',    label: '📱 UPI' },
  { id: 'WALLET', label: '👜 Wallet' },
];

const Checkout = () => {
  const { bookingId } = useParams();
  const location      = useLocation();
  const navigate      = useNavigate();

  const [booking, setBooking]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [paying, setPaying]       = useState(false);
  const [error, setError]         = useState('');
  const [method, setMethod]       = useState('CARD');
  const [cardLast4, setCardLast4] = useState('');

  // expiresAt may come from navigation state (fast path) or be read from booking
  const expiresAt = location.state?.expiresAt || booking?.expiresAt || null;
  const { secondsRemaining, isExpired } = useCountdownTimer(expiresAt);

  useEffect(() => {
    client.get(`/bookings/${bookingId}`)
      .then(res => setBooking(res.data))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [bookingId, navigate]);

  // Redirect when lock expires
  useEffect(() => {
    if (isExpired && booking) {
      setError('Your seat hold has expired. Redirecting...');
      const t = setTimeout(() => navigate(`/shows/${booking.show_id}`), 3000);
      return () => clearTimeout(t);
    }
  }, [isExpired, booking, navigate]);

  const handlePay = async () => {
    setError('');
    setPaying(true);
    try {
      await client.post(`/bookings/${bookingId}/pay`, {
        paymentMethod: method,
        ...(method === 'CARD' && cardLast4 ? { cardLast4 } : {})
      });
      navigate(`/booking/${bookingId}/confirmation`);
    } catch (err) {
      const status = err.response?.status;
      if (status === 402) {
        setError('Payment declined. Please try again or switch method.');
      } else if (status === 410) {
        setError('Seat locks expired. Redirecting to seat selection...');
        setTimeout(() => navigate(`/shows/${booking?.show_id}`), 3000);
      } else {
        setError(err.response?.data?.error || 'Payment failed. Please retry.');
      }
    } finally {
      setPaying(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await client.post(`/bookings/${bookingId}/cancel`);
      navigate('/');
    } catch {
      setError('Failed to cancel. Please try again.');
    }
  };

  const formatTime = (s) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  if (loading) return <div className="loading-screen">Loading checkout...</div>;
  if (!booking) return null;

  const seats   = booking.BookingSeats || [];
  const show    = booking.Show;
  const movie   = show?.Movie;
  const theatre = show?.Screen?.Theatre;

  return (
    <div className="checkout-page">
      <div className="checkout-grid">

        {/* Summary */}
        <div className="checkout-summary glass-panel">
          <h2>Booking Summary</h2>
          {movie && (
            <div className="checkout-movie">
              {movie.poster_url && <img src={movie.poster_url} alt={movie.title} className="checkout-poster" />}
              <div>
                <h3>{movie.title}</h3>
                {theatre && <p>🏛 {theatre.name}, {theatre.city}</p>}
                {show && (
                  <p>🕒 {new Date(show.start_time).toLocaleString([], {
                    weekday: 'short', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}</p>
                )}
              </div>
            </div>
          )}

          <div className="checkout-seats">
            <h4>Seats ({seats.length})</h4>
            <div className="seat-tags">
              {seats.map(bs => (
                <span key={bs.id} className="seat-tag">
                  {bs.Seat?.row_label}{bs.Seat?.seat_number}
                  <span className="seat-type-badge">{bs.Seat?.seat_type}</span>
                  <span className="seat-price">₹{bs.price}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="checkout-total">
            <span>Total</span>
            <span className="total-amount">₹{parseFloat(booking.total_amount).toFixed(2)}</span>
          </div>

          {expiresAt && !isExpired && (
            <div className={`timer-pill ${secondsRemaining < 60 ? 'critical' : ''}`}>
              ⏳ Lock expires in {formatTime(secondsRemaining)}
            </div>
          )}
          {isExpired && (
            <div className="timer-pill critical">⛔ Lock expired — redirecting...</div>
          )}
        </div>

        {/* Payment */}
        <div className="checkout-payment glass-panel">
          <h2>Payment</h2>
          {error && <div className="error-alert" style={{ marginBottom: '1rem' }}>{error}</div>}

          <div className="payment-methods">
            {PAYMENT_METHODS.map(pm => (
              <label key={pm.id} className={`payment-option ${method === pm.id ? 'selected' : ''}`}>
                <input type="radio" name="method" value={pm.id}
                  checked={method === pm.id} onChange={() => setMethod(pm.id)} />
                {pm.label}
              </label>
            ))}
          </div>

          {method === 'CARD' && (
            <div className="field-group" style={{ marginTop: '1rem' }}>
              <label>Last 4 digits (optional)</label>
              <input type="text" maxLength={4} placeholder="e.g. 4242"
                value={cardLast4} onChange={e => setCardLast4(e.target.value.replace(/\D/g, ''))} />
            </div>
          )}

          <button className="btn-primary" onClick={handlePay}
            disabled={paying || isExpired} style={{ marginTop: '1.5rem' }}>
            {paying ? 'Processing...' : `Pay ₹${parseFloat(booking.total_amount).toFixed(2)}`}
          </button>

          <button className="btn-cancel" onClick={handleCancel}>Cancel Booking</button>
        </div>

      </div>
    </div>
  );
};

export default Checkout;
