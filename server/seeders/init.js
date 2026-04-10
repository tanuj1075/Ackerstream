require('dotenv').config({ path: '../.env' });
const { sequelize, Movie, Theatre, Screen, Seat, Show } = require('../models');

const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const SEATS_PER_ROW = 10;

// Assign seat type based on row position
function getSeatType(row) {
  if (['A', 'B', 'C'].includes(row)) return 'RECLINER';
  if (['D', 'E', 'F', 'G'].includes(row)) return 'PREMIUM';
  return 'STANDARD';
}

async function seed() {
  await sequelize.authenticate();
  console.log('Connected to DB. Starting seed...');

  // 3 Movies
  const [m1, m2, m3] = await Movie.bulkCreate([
    {
      title: 'Interstellar',
      description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
      duration_mins: 169,
      language: 'English',
      genre: 'Sci-Fi',
      poster_url: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg'
    },
    {
      title: 'RRR',
      description: 'A fictional story about two real-life heroes and their journey away from home.',
      duration_mins: 187,
      language: 'Telugu',
      genre: 'Action',
      poster_url: 'https://image.tmdb.org/t/p/w500/nEufeZlyAOLqO6larF0Cl5bXMX7.jpg'
    },
    {
      title: 'Oppenheimer',
      description: 'The story of J. Robert Oppenheimer and his role in the development of the atomic bomb.',
      duration_mins: 180,
      language: 'English',
      genre: 'Drama',
      poster_url: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg'
    }
  ]);

  // 2 Theatres
  const [t1, t2] = await Theatre.bulkCreate([
    { name: 'PVR Nexus', city: 'Bangalore', address: 'Nexus Mall, Koramangala, Bangalore' },
    { name: 'INOX Crescent', city: 'Mumbai', address: 'Crescent Mall, Andheri, Mumbai' }
  ]);

  // 4 Screens (2 per theatre)
  const screens = await Screen.bulkCreate([
    { theatre_id: t1.id, name: 'Screen 1 - Audi', total_seats: ROWS.length * SEATS_PER_ROW },
    { theatre_id: t1.id, name: 'Screen 2 - Gold', total_seats: ROWS.length * SEATS_PER_ROW },
    { theatre_id: t2.id, name: 'Screen 1 - 4DX',  total_seats: ROWS.length * SEATS_PER_ROW },
    { theatre_id: t2.id, name: 'Screen 2 - IMAX', total_seats: ROWS.length * SEATS_PER_ROW }
  ]);

  // Create seats for all screens
  const allSeats = [];
  for (const screen of screens) {
    for (const row of ROWS) {
      for (let num = 1; num <= SEATS_PER_ROW; num++) {
        allSeats.push({
          screen_id: screen.id,
          row_label: row,
          seat_number: num,
          seat_type: getSeatType(row)
        });
      }
    }
  }
  await Seat.bulkCreate(allSeats);
  console.log(`Created ${allSeats.length} seats across ${screens.length} screens`);

  // 5 Shows
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  await Show.bulkCreate([
    {
      movie_id: m1.id,
      screen_id: screens[0].id,
      start_time: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 10, 0),
      end_time:   new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 12, 49),
      base_price: 250.00
    },
    {
      movie_id: m1.id,
      screen_id: screens[0].id,
      start_time: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 15, 0),
      end_time:   new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 17, 49),
      base_price: 300.00
    },
    {
      movie_id: m2.id,
      screen_id: screens[1].id,
      start_time: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 11, 0),
      end_time:   new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 14, 7),
      base_price: 275.00
    },
    {
      movie_id: m3.id,
      screen_id: screens[2].id,
      start_time: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 13, 0),
      end_time:   new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 16, 0),
      base_price: 350.00
    },
    {
      movie_id: m3.id,
      screen_id: screens[3].id,
      start_time: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 18, 0),
      end_time:   new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 21, 0),
      base_price: 400.00
    }
  ]);

  console.log('Seed complete! 3 movies, 2 theatres, 4 screens, 400 seats, 5 shows created.');
  await sequelize.close();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
