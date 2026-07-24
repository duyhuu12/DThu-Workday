import cors from 'cors';
import 'dotenv/config';
import express, { Request, Response } from 'express';

// Import Routes (with .js extensions for ES Modules compatibility)
import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import registrationRoutes from './routes/registrationRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import creditRoutes from './routes/creditRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import systemRoutes from './routes/systemRoutes.js';

const app = express();

const PORT = Number(process.env.PORT) || 8080;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

app.use(
  cors({
    origin: [FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  }),
);

app.use(express.json());

// Health Check API
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'DThU Workday API đang hoạt động bình thường',
    timestamp: new Date().toISOString(),
  });
});

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/system', systemRoutes);

// Catch-all route for 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Không tìm thấy API endpoint',
  });
});

app.listen(PORT, () => {
  console.log(`[DThU Workday API Server]: http://localhost:${PORT}`);
  console.log(`[Health check]: http://localhost:${PORT}/api/health`);
});