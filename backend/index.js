import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pool from './src/config/db.js';
import authRoutes from './src/routes/authRoutes.js';
import projectRoutes from './src/routes/projectRoutes.js';
import paymentRoutes from './src/routes/paymentRoutes.js';
import payoutRoutes from './src/routes/payoutRoutes.js';
import githubRoutes from './src/routes/githubRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/github', githubRoutes);

app.get('/', (req, res) => {
  res.send('GitLock Secure API is Running...');
});

// Notification Routes (Quick implementation for Lab)
app.get('/api/notifications', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    
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