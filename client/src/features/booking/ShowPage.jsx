import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../../api/client';
import SeatMap from './SeatMap';

/**
 * ShowPage — displays show info + interactive SeatMap.
 * When user completes seat selection, navigates to /checkout/:bookingId
 */
const ShowPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get(`/shows/${id}`)
      .then(res => setShow(res.data))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleBookingInitiated = ({ bookingId, totalAmount, expiresAt }) => {
    navigate(`/checkout/${bookingId}`, { state: { totalAmount, expiresAt } });
  };

  if (loading) return <div className="loading-screen">Loading show...</div>;
  if (!show) return null;

  return (
    <div className="page-container">
      <div className="show-header">
        <h1>{show.Movie?.title}</h1>
        <div className="show-meta">
          <span>🏛 {show.Screen?.Theatre?.name}, {show.Screen?.Theatre?.city}</span>
          <span>🎭 {show.Screen?.name}</span>
          <span>🕒 {new Date(show.start_time).toLocaleString([], {
            weekday: 'short', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
          })}</span>
          <span>💺 Base ₹{show.base_price}</span>
        </div>
      </div>

      <SeatMap
        showId={id}
        basePrice={show.base_price}
        onBookingInitiated={handleBookingInitiated}
      />
    </div>
  );
};

export default ShowPage;
