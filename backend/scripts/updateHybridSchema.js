import pool from '../src/config/db.js';

const updateSchema = async () => {
    console.log("🔄 Updating Database Schema...");

    try {
        // 1. Add public_key to users table
        console.log("Checking 'users' table...");
        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS public_key TEXT;
        `);
        console.log("✅ Added 'public_key' to users.");

        // 2. Add encrypted_aes_key to project_versions table
        // This stores the AES key encrypted with the Client's Public Key
        console.log("Checking 'project_versions' table...");
        await pool.query(`
            ALTER TABLE project_versions 
            ADD COLUMN IF NOT EXISTS encrypted_aes_key TEXT;
        `);
        console.log("✅ Added 'encrypted_aes_key' to project_versions.");

    } catch (err) {
        console.error("❌ Schema Update Failed:", err);
        process.exit(1);
    } finally {
        // Close pool
        await pool.end(); // This might hang if not properly handled in db.js, but standard PG pool should verify
        console.log("👋 Done.");
    }
};

updateSchema();
