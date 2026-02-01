
import pool from '../config/db.js';

const createPayoutMethodsTable = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const query = `
            CREATE TABLE IF NOT EXISTS payout_methods (
                id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
                user_id uuid REFERENCES users(id) ON DELETE CASCADE,
                type VARCHAR(50) NOT NULL, -- 'UPI', 'BANK_ACCOUNT'
                details JSONB NOT NULL,
                is_primary BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await client.query(query);

        // Ensure only one primary method per user (PARTIAL INDEX is cleanest in Postgres)
        // Check if index exists or just create it nicely? 
        // We'll trust application logic or add a unique partial index if needed later. 
        // For now, let's keep it simple and handle primary logic in code.

        console.log("✅ 'payout_methods' table created successfully.");
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("❌ Failed to create table:", err);
    } finally {
        client.release();
        process.exit();
    }
};

createPayoutMethodsTable();
