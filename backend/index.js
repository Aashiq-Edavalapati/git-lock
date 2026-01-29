import 'dotenv/config'; // Load env vars first
import express from 'express';
import cors from 'cors';
import pool from './src/config/db.js';
import authRoutes from './src/routes/authRoutes.js';
import projectRoutes from './src/routes/projectRoutes.js';
import paymentRoutes from './src/routes/paymentRoutes.js';
import githubRoutes from './src/routes/githubRoutes.js';
import cookieParser from 'cookie-parser';

// Auto-Migration for Lab: Ensure readme_preview column exists
const runMigration = async () => {
    try {
        await pool.query(`ALTER TABLE project_versions ADD COLUMN IF NOT EXISTS readme_preview TEXT;`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS github_access_token TEXT;`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS github_id TEXT;`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_access_token TEXT;`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT;`);
        
        // Ensure project_versions has the new columns
        await pool.query(`ALTER TABLE project_versions ADD COLUMN IF NOT EXISTS repo_url TEXT;`);
        await pool.query(`ALTER TABLE project_versions ADD COLUMN IF NOT EXISTS commit_sha TEXT;`);
        
        // 5. Lock Requests Table (Advanced Feature)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lock_requests (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
        request_type TEXT NOT NULL, -- 'UNLOCK' or 'DELETE'
        status TEXT DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✅ Database Tables Verified/Created");
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
app.use('/api/github', githubRoutes);

app.get('/', (req, res) => {
  res.send('GitLock Secure API is Running...');
});

// Notification Routes (Quick implementation for Lab)
app.get('/api/notifications', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    
    // Simple verify to get ID
    // Note: In production use proper middleware.
    // We need to import jwt here if not available, or just decode if we trust cookie (bad practice but avoids import mess if jwt not top level)
    // Actually, let's just do a db query if we can't verify? No, we need verify.
    // Assuming jwt is not imported, let's try to import it dynamically or just use the auth middleware if exported?
    // Let's assume we can import jwt.
    const jwt = await import('jsonwebtoken');
    const { id } = jwt.default.verify(token, process.env.JWT_SECRET);
    
    const { getUserNotifications } = await import('./src/models/notificationModel.js');
    const notifications = await getUserNotifications(id);
    res.json(notifications);
  } catch (e) {
    console.error(e);
    res.status(401).json({ error: 'Unauthorized' });
  }
});

app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const { markNotificationAsRead } = await import('./src/models/notificationModel.js');
    await markNotificationAsRead(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed' });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});