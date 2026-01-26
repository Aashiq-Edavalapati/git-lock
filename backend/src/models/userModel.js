import pool from '../config/db.js';

// Create a new user
export const createUser = async (email, fullName, passwordHash, role) => {
  const query = `
    INSERT INTO users (email, full_name, password_hash, role)
    VALUES ($1, $2, $3, $4)
    RETURNING id, email, role, created_at;
  `;
  const values = [email, fullName, passwordHash, role];
  
  const result = await pool.query(query, values);
  return result.rows[0];
};

// Find user by email (for Login)
export const findUserByEmail = async (email) => {
  const query = `SELECT * FROM users WHERE email = $1`;
  const result = await pool.query(query, [email]);
  return result.rows[0]; // Returns undefined if not found
};

// Save the Hashed OTP and Expiry to the user record
export const saveMFASecret = async (userId, secret, expiry) => {
  // We store it as "SECRET|EXPIRY" string for simplicity in this lab
  const mfaData = `${secret}|${expiry}`;
  
  const query = `UPDATE users SET mfa_secret = $1 WHERE id = $2`;
  await pool.query(query, [mfaData, userId]);
};

// Retrieve the secret to verify
export const getMFASecret = async (userId) => {
  const query = `SELECT mfa_secret FROM users WHERE id = $1`;
  const result = await pool.query(query, [userId]);
  return result.rows[0]?.mfa_secret; // Returns "SECRET|EXPIRY"
};

export const clearMFASecret = async (userId) => {
  const query = `UPDATE users SET mfa_secret = NULL WHERE id = $1`;
  await pool.query(query, [userId]);
};