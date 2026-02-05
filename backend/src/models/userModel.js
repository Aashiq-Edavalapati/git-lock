import pool from '../config/db.js';

// Create a new user
// Create a new user
// Create a new user
export const createUser = async (email, fullName, passwordHash, role, avatarUrl, publicKey) => {
  const query = `
    INSERT INTO users (email, full_name, password_hash, role, avatar_url, public_key)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, email, role, created_at, avatar_url;
  `;
  const values = [email, fullName, passwordHash, role, avatarUrl || null, publicKey || null];
  
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
  const query = `SELECT id, email, full_name, role, created_at, bio, github_id, github_access_token, avatar_url, password_hash, public_key FROM users WHERE id = $1`;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

// Save the Hashed OTP, Expiry, and (Optional) Intent to the user record
export const saveMFASecret = async (userId, secret, expiry, intent = 'LOGIN') => {
  // We store it as "SECRET|EXPIRY|INTENT"
  const mfaData = `${secret}|${expiry}|${intent}`;
  
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

export const saveResetSecret = async (userId, secret, expiry) => {
  const resetData = `${secret}|${expiry}`;
  const query = `UPDATE users SET reset_secret = $1 WHERE id = $2`;
  await pool.query(query, [resetData, userId]);
};

export const getResetSecret = async (userId) => {
  const query = `SELECT reset_secret FROM users WHERE id = $1`;
  const result = await pool.query(query, [userId]);
  return result.rows[0]?.reset_secret;
};

export const clearResetSecret = async (userId) => {
  const query = `UPDATE users SET reset_secret = NULL WHERE id = $1`;
  await pool.query(query, [userId]);
};

export const updateUserPassword = async (userId, passwordHash) => {
  const query = `UPDATE users SET password_hash = $1 WHERE id = $2`;
  await pool.query(query, [passwordHash, userId]);
};

// Update User Public Key
export const updateUserPublicKey = async (userId, publicKey) => {
  const query = `UPDATE users SET public_key = $1 WHERE id = $2`;
  await pool.query(query, [publicKey, userId]);
};

// Safe Delete User (with Client Notification)
export const deleteUser = async (userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 0. Pre-cleanup: Delete Audit Logs & Notifications
    await client.query('DELETE FROM audit_logs WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM notifications WHERE user_id = $1', [userId]);

    // 2. Notify Clients & Unlink as Developer
    // Find projects where this user is the developer
    const devProjectsQuery = `
      SELECT p.id, p.title, p.client_id, u.email as client_email, u.full_name as client_name 
      FROM projects p
      JOIN users u ON p.client_id = u.id
      WHERE p.developer_id = $1
    `;
    const devProjectsRes = await client.query(devProjectsQuery, [userId]);
    const devProjects = devProjectsRes.rows;

    if (devProjects.length > 0) {
        // Dynamically import to avoid circular dependency issues at top level if any
        const { createNotification } = await import('./notificationModel.js');
        const { sendNotificationEmail } = await import('../utils/emailService.js');

        for (const project of devProjects) {
            const message = `Developer has left the project "${project.title}". The project is now open for a new developer.`;
            
            // 1. Create In-App Notification
            await createNotification(project.client_id, message);
            
            // 2. Send Email
            await sendNotificationEmail(
                project.client_email, 
                `Developer Departure: ${project.title}`,
                `Hello ${project.client_name},\n\nThe developer assigned to your project "${project.title}" has deleted their account. The project status has been reset. You may now invite a new developer.\n\n- GitLock Team`
            );
        }
    }

    // Unlink properly
    await client.query('UPDATE projects SET developer_id = NULL, developer_email = NULL, status = $1 WHERE developer_id = $2', ['INVITE_SENT', userId]);

    // 3. Delete Projects as Client (Cascade to versions)
    // First, find all project IDs owned by this user
    const res = await client.query('SELECT id FROM projects WHERE client_id = $1', [userId]);
    const projectIds = res.rows.map(row => row.id);

    if (projectIds.length > 0) {
        // Delete versions for these projects
        await client.query('DELETE FROM project_versions WHERE project_id = ANY($1)', [projectIds]);
        // Delete the projects themselves
        await client.query('DELETE FROM projects WHERE client_id = $1', [userId]);
    }

    // 4. Delete the User
    const query = `DELETE FROM users WHERE id = $1 RETURNING id`;
    const result = await client.query(query, [userId]);

    await client.query('COMMIT');
    return result.rows[0];
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};