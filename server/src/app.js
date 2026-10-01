import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import tagRoutes from './routes/tagRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import habitRoutes from './routes/habitRoutes.js';
import pomodoroRoutes from './routes/pomodoroRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '20kb' }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }));
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/pomodoro', pomodoroRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
