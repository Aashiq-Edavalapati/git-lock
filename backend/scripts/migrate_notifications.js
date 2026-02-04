import pool from '../src/config/db.js';

const migrate = async () => {
  try {
    console.log('Starting migration...');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      console.log('Adding "type" column...');
      await client.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'GENERAL'`);
      
      console.log('Adding "reference_id" column...');
      await client.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_id TEXT`);
      
      console.log('Adding "link" column...');
      await client.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link TEXT`);
      
      await client.query('COMMIT');
      console.log('Migration completed successfully.');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Migration failed:', err);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Connection failed:', err);
  } finally {
    pool.end();
  }
};

migrate();
