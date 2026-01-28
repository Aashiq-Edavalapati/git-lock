import pool from '../config/db.js';

// Create a new user
// Create a new user
export const createUser = async (email, fullName, passwordHash, role, avatarUrl) => {
  const query = `
    INSERT INTO users (email, full_name, password_hash, role, avatar_url)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, email, role, created_at, avatar_url;
  `;
  const values = [email, fullName, passwordHash, role, avatarUrl || null];
  
  const result = await pool.query(query, values);
  return result.rows[0];
};

// Find user by email (for Login)
export const findUserByEmail = async (email) => {
  const query = `SELECT * FROM users WHERE email = $1`;
  const result = await pool.query(query, [email]);
  return result.rows[0]; // Returns undefined if not found
};

// Find user by ID (for MFA verification/Token generation)
export const findUserById = async (id) => {
  const query = `SELECT id, email, full_name, role, created_at, bio, github_id, github_access_token, avatar_url FROM users WHERE id = $1`;
  const result = await pool.query(query, [id]);
  return result.rows[0];
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

export const updateUserProfile = async (userId, fullName, bio) => {
  const query = `
    UPDATE users 
    SET full_name = $1, bio = $2 
    WHERE id = $3 
    RETURNING id, full_name, email, role, bio;
  `;
  const result = await pool.query(query, [fullName, bio, userId]);
  return result.rows[0];
};