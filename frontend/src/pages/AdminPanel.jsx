import React, { useEffect, useState } from 'react';
import api from '../services/api';

const SECTIONS = [
  { key: 'movies', title: '🎬 Movie / Event Management' },
  { key: 'venues', title: '🏢 Theatre / Venue Management' },
  { key: 'schedules', title: '⏰ Show Scheduling' },
  { key: 'bookings', title: '🎟️ Booking Management' },
  { key: 'payments', title: '💰 Payments & Transactions' },
  { key: 'users', title: '👥 User Management' },
  { key: 'analytics', title: '📊 Analytics' },
  { key: 'roles', title: '⚙️ Admin Roles & Permissions' },
  { key: 'offers', title: '📢 Offers / Coupons' },
  { key: 'logs', title: '🔐 Logs & Activity Tracking' }
];

const AdminPanel = () => {
  const [active, setActive] = useState('movies');
  const [data, setData] = useState({});
  const [summary, setSummary] = useState({ movies: 0, shows: 0, bookings: 0, revenue: 0 });

  const load = async () => {
    const endpoints = {
      movies: '/admin/movies', theatres: '/admin/theatres', screens: '/admin/screens', shows: '/admin/shows',
      bookings: '/admin/bookings', payments: '/admin/payments', users: '/admin/users', analytics: '/admin/analytics',
      offers: '/admin/offers', logs: '/admin/logs'
    };
    const requests = Object.entries(endpoints).map(([k, path]) => api.get(path).then((res) => [k, res.data]));
    const all = await Promise.all(requests);
    setData(Object.fromEntries(all));
    const { data: stats } = await api.get('/admin/summary');
    setSummary(stats);
  };

  useEffect(() => { load(); }, []);

  const quickCreate = async (path, payload) => {
    await api.post(path, payload);
    await load();
  };

  const update = async (path, payload) => {
    await api.patch(path, payload);
    await load();
  };

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="logo">TikeTales Admin</div>
        <button className="logout-btn" onClick={() => { localStorage.clear(); window.location.href = '/admin/login'; }}>Log Out</button>
      </nav>
      <main className="dashboard-content">
        <div className="stats-grid admin-stats">
          <div className="stat-box"><h3>Total Movies</h3><p>{summary.movies}</p></div>
          <div className="stat-box"><h3>Total Shows</h3><p>{summary.shows}</p></div>
          <div className="stat-box"><h3>Total Bookings</h3><p>{summary.bookings}</p></div>
          <div className="stat-box"><h3>Revenue</h3><p>${Number(summary.revenue).toFixed(2)}</p></div>
        </div>

        <div className="admin-tabs">
          {SECTIONS.map((section) => (
            <button key={section.key} className={`logout-btn ${active === section.key ? 'active-tab' : ''}`} onClick={() => setActive(section.key)}>
              {section.title}
            </button>
          ))}
        </div>

        <div className="glass-card admin-panel-card">
          {active === 'movies' && (
            <>
              <h3>Movie/Event</h3>
              <button className="primary-btn" onClick={() => quickCreate('/admin/movies', { title: `New Movie ${Date.now()}`, language: 'English', genre: 'Action', duration: 140, release_date: new Date().toISOString().slice(0, 10), poster_url: '', trailer_url: '' })}>Add Movie</button>
              <pre>{JSON.stringify(data.movies || [], null, 2)}</pre>
            </>
          )}
          {active === 'venues' && (
            <>
              <h3>Theatres, Screens, Seating Layout</h3>
              <button className="primary-btn" onClick={() => quickCreate('/admin/theatres', { name: `Cinema ${Date.now()}`, location: 'Downtown' })}>Add Theatre</button>
              {(data.theatres?.length ?? 0) > 0 && <button className="primary-btn" onClick={() => quickCreate('/admin/screens', { theatre_id: data.theatres[0].id, name: `Screen ${Date.now() % 100}`, seating_layout: 'VIP:A1-A5,REG:B1-B10' })}>Add Screen</button>}
              <pre>{JSON.stringify({ theatres: data.theatres, screens: data.screens }, null, 2)}</pre>
            </>
          )}
          {active === 'schedules' && (
            <>
              <h3>Show Scheduling & Seat Pricing</h3>
              <button className="primary-btn" disabled={!data.movies?.length || !data.screens?.length} onClick={() => quickCreate('/admin/shows', { movie_id: data.movies[0].id, screen_id: data.screens[0].id, show_time: new Date(Date.now() + 3600000).toISOString(), vip_price: 18, regular_price: 11 })}>Create Show</button>
              <pre>{JSON.stringify(data.shows || [], null, 2)}</pre>
            </>
          )}
          {active === 'bookings' && (
            <>
              <h3>Bookings, Status & Ticket IDs</h3>
              <pre>{JSON.stringify(data.bookings || [], null, 2)}</pre>
              {!!data.bookings?.length && <button className="primary-btn" onClick={() => update(`/admin/bookings/${data.bookings[0].id}/status`, { status: 'cancelled' })}>Mark Latest Booking Cancelled</button>}
            </>
          )}
          {active === 'payments' && (
            <>
              <h3>Payments, Refund & Transaction Status</h3>
              <pre>{JSON.stringify(data.payments || [], null, 2)}</pre>
              {!!data.payments?.length && <button className="primary-btn" onClick={() => update(`/admin/payments/${data.payments[0].id}/status`, { status: 'failed' })}>Mark Latest Payment Failed</button>}
            </>
          )}
          {active === 'users' && (
            <>
              <h3>Users + Booking History Controls</h3>
              <pre>{JSON.stringify(data.users || [], null, 2)}</pre>
              {!!data.users?.length && <button className="primary-btn" onClick={() => update(`/admin/users/${data.users[0].id}`, { is_blocked: 1 })}>Block Latest User</button>}
            </>
          )}
          {active === 'analytics' && (
            <>
              <h3>Bookings, Revenue & Popular Shows</h3>
              <pre>{JSON.stringify(data.analytics || {}, null, 2)}</pre>
            </>
          )}
          {active === 'roles' && (
            <>
              <h3>Admin Roles / Permissions</h3>
              <p className="subtitle">Promote trusted users to staff. Keep super_admin limited.</p>
              {!!data.users?.length && <button className="primary-btn" onClick={() => update(`/admin/users/${data.users[0].id}`, { role: 'staff' })}>Promote Latest User to Staff</button>}
            </>
          )}
          {active === 'offers' && (
            <>
              <h3>Coupons & Campaigns</h3>
              <button className="primary-btn" onClick={() => quickCreate('/admin/offers', { code: `SAVE${Date.now() % 1000}`, discount_percent: 15, starts_at: new Date().toISOString(), ends_at: new Date(Date.now() + 7 * 86400000).toISOString(), is_active: true })}>Create Offer</button>
              <pre>{JSON.stringify(data.offers || [], null, 2)}</pre>
            </>
          )}
          {active === 'logs' && (
            <>
              <h3>Audit Logs</h3>
              <pre>{JSON.stringify(data.logs || [], null, 2)}</pre>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
