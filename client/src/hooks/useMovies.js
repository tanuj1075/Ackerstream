/**
 * /client/src/hooks/useMovies.js
 * Paginated movie list with filter support.
 * Re-fetches whenever `filters` or `page` changes.
 */
import { useState, useEffect, useCallback } from 'react';
import client from '../api/client';

export function useMovies(filters = {}, page = 1, limit = 9) {
  const [movies, setMovies]   = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const fetchMovies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit, ...filters };
      // Remove empty filter values
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const res = await client.get('/movies', { params });
      setMovies(res.data.movies || res.data.data || []);
      setPagination(res.data.pagination || {
        total: res.data.total, page, totalPages: res.data.pages
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load movies');
    } finally {
      setLoading(false);
    }
  }, [page, limit, JSON.stringify(filters)]); // eslint-disable-line

  useEffect(() => { fetchMovies(); }, [fetchMovies]);

  return { movies, pagination, loading, error, refetch: fetchMovies };
}
