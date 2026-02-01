
import pool from '../config/db.js';

const addPayoutColumn = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Add column if not exists
        await client.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS payout_methods JSONB DEFAULT '[]'::jsonb;
        `);
        
        console.log("✅ 'payout_methods' column checked/added to 'users' table.");
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("❌ Failed to alter table:", err);
    } finally {
        client.release();
        process.exit();
    }
};

addPayoutColumn();
