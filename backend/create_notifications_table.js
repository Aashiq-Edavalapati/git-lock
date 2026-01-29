import pool from './src/config/db.js';

const createTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS public.notifications (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL,
      message text NOT NULL,
      is_read boolean DEFAULT false,
      created_at timestamp with time zone DEFAULT now(),
      CONSTRAINT notifications_pkey PRIMARY KEY (id),
      CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
    );
  `;
  
  try {
    await pool.query(query);
    console.log("✅ Notifications table created successfully");
  } catch (err) {
    console.error("❌ Error creating table:", err);
  } finally {
    await pool.end();
  }
};

createTable();
