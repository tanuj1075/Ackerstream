import React from 'react';
import { Link } from 'react-router-dom';

const GENRE_COLORS = {
  'Sci-Fi':  '#6366f1',
  'Action':  '#ef4444',
  'Drama':   '#f59e0b',
  'Comedy':  '#10b981',
  'Horror':  '#8b5cf6',
  'Romance': '#ec4899',
};

const MovieCard = ({ movie }) => {
  const color = GENRE_COLORS[movie.genre] || '#3b82f6';

  return (
    <Link to={`/movies/${movie.id}`} className="movie-card">
      <div className="movie-poster">
        {movie.poster_url
          ? <img src={movie.poster_url} alt={movie.title} loading="lazy" />
          : <div className="poster-placeholder">🎬</div>
        }
        <span className="genre-badge" style={{ backgroundColor: color }}>
          {movie.genre}
        </span>
      </div>
      <div className="movie-info">
        <h3>{movie.title}</h3>
        <p className="movie-meta">{movie.language} · {movie.duration_mins} min</p>
      </div>
    </Link>
  );
};

export default MovieCard;
