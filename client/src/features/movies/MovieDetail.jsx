import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import client from '../../api/client';

const MovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get(`/movies/${id}`)
      .then(res => setMovie(res.data))
      .catch((err) => {
        console.error('[MovieDetail] Error:', err);
        navigate('/');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return <div className="loading-screen">Loading movie...</div>;
  if (!movie) return null;

  // Group shows by theatre
  const showsByTheatre = (movie.Shows || []).reduce((acc, show) => {
    const theatre = show.Screen?.Theatre;
    if (!theatre) return acc;
    if (!acc[theatre.id]) acc[theatre.id] = { theatre, shows: [] };
    acc[theatre.id].shows.push(show);
    return acc;
  }, {});

  return (
    <div className="movie-detail-page">
      {/* Hero */}
      <div className="movie-hero">
        {movie.poster_url && (
          <div className="hero-poster">
            <img src={movie.poster_url} alt={movie.title} />
          </div>
        )}
        <div className="hero-info">
          <span className="genre-pill">{movie.genre}</span>
          <h1>{movie.title}</h1>
          <div className="movie-tags">
            <span>🌐 {movie.language}</span>
            <span>⏱ {movie.duration_mins} min</span>
          </div>
          <p className="movie-description">{movie.description}</p>
        </div>
      </div>

      {/* Show Timings */}
      <div className="shows-section">
        <h2>Select Showtime</h2>
        {Object.keys(showsByTheatre).length === 0 ? (
          <p className="no-shows">No upcoming shows available.</p>
        ) : (
          Object.values(showsByTheatre).map(({ theatre, shows }) => (
            <div key={theatre.id} className="theatre-block">
              <div className="theatre-header">
                <h3>{theatre.name}</h3>
                <span className="theatre-city">📍 {theatre.city}</span>
              </div>
              <div className="show-timings">
                {shows.map(show => (
                  <Link key={show.id} to={`/shows/${show.id}`} className="show-chip">
                    <span className="show-time">
                      {new Date(show.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="show-price">₹{show.base_price}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MovieDetail;
