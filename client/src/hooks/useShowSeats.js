/**
 * /client/src/hooks/useShowSeats.js
 * Manages real-time seat state for a show.
 *  1. Initial load via HTTP GET /api/shows/:showId/seats
 *  2. Joins Socket.io room show:{showId}
 *  3. Patches local state on 'seat_update' events — no full refetch needed
 *  4. Leaves room on component unmount
 *
 * Returns: { seats, isConnected, error }
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import client from '../api/client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export function useShowSeats(showId) {
  const [seats, setSeats]           = useState([]);
  const [isConnected, setConnected] = useState(false);
  const [error, setError]           = useState(null);
  const socketRef = useRef(null);

  // ── Patch a list of seatIds with a new status in local state ─────────────
  const patchSeats = useCallback((seatIds, status, meta = {}) => {
    setSeats(prev =>
      prev.map(s =>
        seatIds.includes(s.id)
          ? { ...s, status, ...meta }
          : s
      )
    );
  }, []);

  useEffect(() => {
    if (!showId) return;

    let cancelled = false;

    // ── 1. HTTP initial fetch ────────────────────────────────────────────────
    client.get(`/shows/${showId}/seats`)
      .then(res => {
        if (!cancelled) setSeats(res.data.seats);
      })
      .catch(err => {
        if (!cancelled) setError('Failed to load seats. Please refresh.');
      });

    // ── 2. Socket.io connection ──────────────────────────────────────────────
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_show', showId);
    });

    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));

    // ── 3. Patch state on seat_update event ──────────────────────────────────
    socket.on('seat_update', (payload) => {
      const { type, seatIds } = payload;

      if (type === 'LOCKED') {
        patchSeats(seatIds, 'LOCKED');
      } else if (type === 'RELEASED') {
        patchSeats(seatIds, 'AVAILABLE');
      } else if (type === 'BOOKED') {
        patchSeats(seatIds, 'BOOKED');
      }
    });

    // ── 4. Cleanup ────────────────────────────────────────────────────────────
    return () => {
      cancelled = true;
      socket.emit('leave_show', showId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [showId, patchSeats]);

  return { seats, isConnected, error };
}
