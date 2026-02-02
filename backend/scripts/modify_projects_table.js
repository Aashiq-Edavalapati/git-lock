import pool from '../src/config/db.js';

const runMigration = async () => {
    try {
        console.log('Starting migration...');

        // Add requirements column
        await pool.query(`
            ALTER TABLE projects 
            ADD COLUMN IF NOT EXISTS requirements TEXT;
        `);
        console.log('Mapped "requirements" column.');

        // Add attachments column
        await pool.query(`
            ALTER TABLE projects 
            ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
        `);
        console.log('Mapped "attachments" column.');

        console.log('✅ Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

runMigration();
