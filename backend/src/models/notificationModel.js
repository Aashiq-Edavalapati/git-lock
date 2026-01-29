import pool from '../config/db.js';

export const createNotification = async (userId, message) => {
  const query = `
    INSERT INTO notifications (user_id, message)
    VALUES ($1, $2)
    RETURNING *;
  `;
  const result = await pool.query(query, [userId, message]);
  return result.rows[0];
};

export const getUserNotifications = async (userId) => {
  const query = `
    SELECT * FROM notifications 
    WHERE user_id = $1 
    ORDER BY created_at DESC 
    LIMIT 20;
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
};

export const markNotificationAsRead = async (id) => {
  const query = `UPDATE notifications SET is_read = true WHERE id = $1 RETURNING *`;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};
