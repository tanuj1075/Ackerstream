/**
 * SeatMap v2 — uses useShowSeats hook for real-time Socket.io updates.
 * Replaces the previous HTTP-polling approach with event-driven state patches.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShowSeats } from '../../hooks/useShowSeats';
import client from '../../api/client';
import { useAuth } from '../../hooks/useAuth';

const MAX_SEATS = 8;
const SURCHARGE = { STANDARD: 0, PREMIUM: 50, RECLINER: 150 };

const STATUS_CONFIG = {
  AVAILABLE: { bg: '#374151', border: '#6b7280', cursor: 'pointer',     label: 'Available' },
  LOCKED:    { bg: '#7f1d1d', border: '#ef4444', cursor: 'not-allowed', label: 'Locked' },
  LOCKED_ME: { bg: '#78350f', border: '#f59e0b', cursor: 'pointer',     label: 'Hold (Mine)' },
  BOOKED:    { bg: '#1f2937', border: '#374151', cursor: 'not-allowed', label: 'Booked' },
};

const SeatMap = ({ showId, basePrice, onBookingInitiated }) => {
  const { user }                        = useAuth();
  const navigate                        = useNavigate();
  const { seats, isConnected, error: seatsError } = useShowSeats(showId);
  const [selected, setSelected]         = useState(new Set());
  const [initiating, setInitiating]     = useState(false);
  const [error, setError]               = useState('');

  const toggleSeat = (seat) => {
    if (seat.status === 'BOOKED')                    return;
    if (seat.status === 'LOCKED' && !seat.lockedByMe) return;

    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(seat.id)) {
        next.delete(seat.id);
      } else {
        if (next.size >= MAX_SEATS) return prev;
        next.add(seat.id);
      }
      return next;
    });
  };

  // Group by row for grid rendering
  const rows = seats.reduce((acc, seat) => {
    if (!acc[seat.row_label]) acc[seat.row_label] = [];
    acc[seat.row_label].push(seat);
    return acc;
  }, {});

  const selectedSeats = seats.filter(s => selected.has(s.id));
  const total = selectedSeats.reduce(
    (sum, s) => sum + parseFloat(basePrice) + (SURCHARGE[s.seat_type] || 0),
    0
  );

  const handleProceed = async () => {
    if (!user) return navigate('/login');
    if (selected.size === 0) return;
    setInitiating(true);
    setError('');
    try {
      const res = await client.post('/bookings/initiate', {
        showId: parseInt(showId),
        seatIds: [...selected]
      });
      onBookingInitiated(res.data);
    } catch (err) {
      const conflicts = err.response?.data?.conflictSeatIds;
      if (conflicts) {
        setError(`Seats ${conflicts.join(', ')} were just taken. Please reselect.`);
        setSelected(new Set());
      } else {
        setError(err.response?.data?.error || 'Failed to initiate booking');
      }
    } finally {
      setInitiating(false);
    }
  };

  if (seats.length === 0 && !seatsError) {
    return <div className="loading-screen">Loading seat map...</div>;
  }

  return (
    <div className="seatmap-wrapper">
      {/* Real-time connection indicator */}
      <div className="connection-badge" style={{ color: isConnected ? '#10b981' : '#f59e0b' }}>
        {isConnected ? '● Live' : '○ Connecting...'}
      </div>

      {(error || seatsError) && <div className="error-alert">{error || seatsError}</div>}

      {/* Legend */}
      <div className="seat-legend">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <span key={key} className="legend-item">
            <span className="legend-swatch" style={{ background: cfg.bg, borderColor: cfg.border }} />
            {cfg.label}
          </span>
        ))}
      </div>

      <div className="screen-indicator">◛ SCREEN THIS WAY</div>

      {/* Seat grid */}
      <div className="seat-grid">
        {Object.entries(rows)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([row, rowSeats]) => (
            <div key={row} className="seat-row">
              <span className="row-label">{row}</span>
              {rowSeats
                .sort((a, b) => a.seat_number - b.seat_number)
                .map(seat => {
                  const isMine = seat.lockedByMe;
                  const statusKey =
                    seat.status === 'BOOKED'  ? 'BOOKED'    :
                    seat.status === 'LOCKED'  ? (isMine ? 'LOCKED_ME' : 'LOCKED') : 'AVAILABLE';
                  const cfg = STATUS_CONFIG[statusKey];
                  const isSelected = selected.has(seat.id);

                  return (
                    <button
                      key={seat.id}
                      className={`seat-btn ${isSelected ? 'selected' : ''}`}
                      style={{
                        background:  isSelected ? '#e53e3e' : cfg.bg,
                        borderColor: isSelected ? '#e53e3e' : cfg.border,
                        cursor:      cfg.cursor,
                      }}
                      onClick={() => toggleSeat(seat)}
                      title={`${seat.row_label}${seat.seat_number} · ${seat.seat_type} · ${seat.status}${
                        isMine && seat.expiresIn ? ` · ${seat.expiresIn}s left` : ''}`}
                    >
                      {seat.status === 'LOCKED' && !isMine ? '🔒' :
                       isMine ? '⏱' : seat.seat_number}
                    </button>
                  );
                })}
            </div>
          ))}
      </div>

      {selected.size > 0 && (
        <div className="booking-bar">
          <div className="booking-summary">
            <span>{selected.size} seat{selected.size > 1 ? 's' : ''} selected</span>
            <span className="booking-total">₹{total.toFixed(2)}</span>
            <span className="booking-seats-list">
              {selectedSeats.map(s => `${s.row_label}${s.seat_number}`).join(', ')}
            </span>
          </div>
          <button
            className="btn-primary"
            onClick={handleProceed}
            disabled={initiating}
            style={{ width: 'auto', marginTop: 0 }}
          >
            {initiating ? 'Locking seats...' : user ? 'Proceed to Pay →' : 'Login to Book'}
          </button>
        </div>
      )}
    </div>
  );
};

export default SeatMap;
