import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test the connection immediately on startup
pool.connect()
  .then(() => console.log('✅ Connected to Supabase PostgreSQL'))
  .catch((err) => console.error('❌ Database Connection Error:', err));

// Add error listener to prevent crash on idle client errors
pool.on('error', (err, client) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;