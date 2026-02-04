
import pool from '../config/db.js';

const addResetSecret = async () => {
  try {
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_secret TEXT;');
    console.log('Successfully added reset_secret column to users table');
  } catch (error) {
    console.error('Error adding column:', error);
  } finally {
    process.exit();
  }
};

addResetSecret();
