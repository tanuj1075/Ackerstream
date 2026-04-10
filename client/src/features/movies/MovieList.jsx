import React, { useState } from 'react';
import { useMovies } from '../../hooks/useMovies';
import MovieCard from './MovieCard';

const GENRES = ['All', 'Action', 'Sci-Fi', 'Drama', 'Comedy', 'Horror', 'Romance'];
const LANGUAGES = ['All', 'English', 'Hindi', 'Telugu', 'Tamil'];

const MovieList = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ genre: '', language: '' });
  const LIMIT = 9;

  const { movies, pagination, loading, error } = useMovies(filters, page, LIMIT);

  const handleFilter = (key, value) => {
    setFilters(f => ({ ...f, [key]: value === 'All' ? '' : value }));
    setPage(1);
  };

  const totalPages = pagination?.totalPages || 1;
  const totalItems = pagination?.total || 0;

  return (
    <div className="movie-list-page">
      <div className="page-header">
        <h1>Now Showing</h1>
        <p className="page-subtitle">{totalItems} movies available</p>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="filter-group">
          <span>Genre:</span>
          {GENRES.map(g => (
            <button
              key={g}
              className={`filter-chip ${(filters.genre || 'All') === g ? 'active' : ''}`}
              onClick={() => handleFilter('genre', g)}
            >{g}</button>
          ))}
        </div>
        <div className="filter-group">
          <span>Language:</span>
          {LANGUAGES.map(l => (
            <button
              key={l}
              className={`filter-chip ${(filters.language || 'All') === l ? 'active' : ''}`}
              onClick={() => handleFilter('language', l)}
            >{l}</button>
          ))}
        </div>
      </div>

      {error && <div className="error-alert">{error}</div>}

      {loading ? (
        <div className="loading-grid">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton-card" />)}
        </div>
      ) : movies.length === 0 ? (
        <div className="empty-state">
          <p>No movies found for selected filters.</p>
        </div>
      ) : (
        <>
          <div className="movies-grid">
            {movies.map(movie => <MovieCard key={movie.id} movie={movie} />)}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span>Page {page} of {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MovieList;
