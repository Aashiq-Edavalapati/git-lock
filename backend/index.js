import 'dotenv/config'; // Load env vars first
import express from 'express';
import cors from 'cors';
import pool from './src/config/db.js';
import authRoutes from './src/routes/authRoutes.js';
import projectRoutes from './src/routes/projectRoutes.js';
import paymentRoutes from './src/routes/paymentRoutes.js';
import cookieParser from 'cookie-parser';

// Auto-Migration for Lab: Ensure readme_preview column exists
const runMigration = async () => {
    try {
        await pool.query(`ALTER TABLE project_versions ADD COLUMN IF NOT EXISTS readme_preview TEXT;`);
        console.log("✅ Database Migration Checked: readme_preview column exists.");
    } catch (err) {
        console.error("Migration Failed:", err.message);
    }
};
runMigration();

const app = express();

app.use(cors({
  origin: 'http://localhost:3000', // Frontend URL
  credentials: true // Allow cookies
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/', (req, res) => {
  res.send('GitLock Secure API is Running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});