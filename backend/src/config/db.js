import pg from 'pg';
import dotenv from 'dotenv';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config(); // fallback to CWD .env if present

const { Pool } = pg;

const isLocal = !process.env.DATABASE_URL || process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Test the connection immediately on startup
pool.connect()
  .then(() => console.log('✅ Connected to Supabase PostgreSQL'))
  .catch((err) => console.error('❌ Database Connection Error:', err));

// Add error listener to prevent crash on idle client errors
pool.on('error', (err) => {
  console.warn('⚠️ Idle PostgreSQL client error (will reconnect automatically):', err?.message || err);
});

export default pool;