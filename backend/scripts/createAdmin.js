import pool from '../src/config/db.js';
import bcrypt from 'bcrypt';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const createAdmin = async () => {
    console.log("--- Create ADMIN User ---");

    rl.question('Enter Admin Email: ', async (email) => {
        rl.question('Enter Admin Password: ', async (password) => {
            rl.question('Enter Full Name: ', async (fullName) => {
                
                try {
                    // Check if exists
                    const check = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
                    if (check.rows.length > 0) {
                        console.error('Error: User with this email already exists.');
                        process.exit(1);
                    }

                    const saltRounds = 10;
                    const passwordHash = await bcrypt.hash(password, saltRounds);

                    const query = `
                        INSERT INTO users (email, full_name, password_hash, role, auth_provider)
                        VALUES ($1, $2, $3, 'ADMIN', 'email')
                        RETURNING id, email, role;
                    `;

                    const res = await pool.query(query, [email, fullName, passwordHash]);
                    console.log(`\n✅ Admin User Created Successfully!`);
                    console.log(res.rows[0]);

                } catch (err) {
                    console.error('Database Error:', err);
                } finally {
                    rl.close();
                    // Allow pool to drain/close if needed, though for a script process.exit is fine
                    process.exit(0);
                }
            });
        });
    });
};

createAdmin();
