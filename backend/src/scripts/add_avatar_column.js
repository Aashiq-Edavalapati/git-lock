import pool from '../config/db.js';

const run = async () => {
  try {
    console.log('Adding avatar_url column to users table...');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);');
    console.log('Success!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
