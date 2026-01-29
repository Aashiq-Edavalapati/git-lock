import pool from '../config/db.js';

const run = async () => {
    try {
        await pool.query('ALTER TABLE projects ADD COLUMN IF NOT EXISTS pending_budget NUMERIC(15, 2) DEFAULT NULL');
        console.log("✅ Added pending_budget column");
    } catch (e) {
        console.error("Error:", e.message);
    } finally {
        pool.end();
    }
};

run();
