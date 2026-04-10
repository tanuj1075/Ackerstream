/**
 * /client/src/hooks/useCountdownTimer.js
 * Precise per-second countdown to an expiry date.
 * Used on the Checkout page to show remaining lock time.
 *
 * @param {Date|string|null} expiresAt — expiry timestamp
 * @returns {{ secondsRemaining: number, isExpired: boolean }}
 */
import { useState, useEffect, useRef } from 'react';

export function useCountdownTimer(expiresAt) {
  const getRemaining = () => {
    if (!expiresAt) return 0;
    return Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000));
  };

  const [secondsRemaining, setSecondsRemaining] = useState(getRemaining);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!expiresAt) return;

    const tick = () => {
      const remaining = getRemaining();
      setSecondsRemaining(remaining);
      if (remaining <= 0) clearInterval(timerRef.current);
    };

    timerRef.current = setInterval(tick, 1000);
    tick(); // immediate first tick

    return () => clearInterval(timerRef.current);
  }, [expiresAt]); // eslint-disable-line

  return {
    secondsRemaining,
    isExpired: secondsRemaining <= 0
  };
}
