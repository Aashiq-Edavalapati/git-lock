import pool from '../config/db.js';

const run = async () => {
  try {
    console.log('Adding bio column to users table...');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;');
    console.log('Success!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
