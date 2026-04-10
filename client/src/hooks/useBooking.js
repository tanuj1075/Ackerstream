/**
 * /client/src/hooks/useBooking.js
 * Fetches a booking by ID and polls every 5s while status is PENDING.
 * Stops polling once the booking reaches a terminal state.
 */
import { useState, useEffect, useRef } from 'react';
import client from '../api/client';

const TERMINAL_STATUSES = new Set(['CONFIRMED', 'CANCELLED', 'EXPIRED']);
const POLL_INTERVAL = 5000;

export function useBooking(bookingId) {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const pollRef = useRef(null);

  const fetchBooking = async () => {
    try {
      const res = await client.get(`/bookings/${bookingId}`);
      setBooking(res.data);
      setError(null);

      // Stop polling once terminal
      if (TERMINAL_STATUSES.has(res.data.status)) {
        clearInterval(pollRef.current);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load booking');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!bookingId) return;
    fetchBooking();

    // Poll while booking may still be pending
    pollRef.current = setInterval(fetchBooking, POLL_INTERVAL);

    return () => clearInterval(pollRef.current);
  }, [bookingId]); // eslint-disable-line

  return { booking, loading, error, refetch: fetchBooking };
}
