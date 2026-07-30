import './config/env.js';
import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import { prisma } from './config/prisma.js';
import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import registrationRoutes from './routes/registrationRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import creditRoutes from './routes/creditRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import systemRoutes from './routes/systemRoutes.js';
import studentRoutes from './routes/studentRoutes.js';

const app = express();
const port = Number(process.env.PORT) || 8080;
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

app.disable('x-powered-by');
app.use(cors({ origin: [frontendUrl, 'http://localhost:3000'], credentials: true }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      success: true,
      message: 'DThU Workday API và MySQL đang hoạt động',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[health] Database unavailable:', error);
    res.status(503).json({ success: false, message: 'API hoạt động nhưng chưa kết nối được MySQL' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/student', studentRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Không tìm thấy API endpoint' });
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[unhandled]', error);
  res.status(500).json({ success: false, message: 'Máy chủ gặp lỗi khi xử lý yêu cầu' });
});

let server: ReturnType<typeof app.listen> | undefined;

async function startServer(): Promise<void> {
  try {
    console.log('[DB] Đang kiểm tra kết nối MySQL...');
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log('[DB] Kết nối MySQL thành công');

    server = app.listen(port, () => {
      console.log(`[API] http://localhost:${port}`);
      console.log(`[Health] http://localhost:${port}/api/health`);
    });
  } catch (error) {
    console.error('[DB] Không thể khởi động backend vì kết nối MySQL thất bại');
    console.error(error);
    await prisma.$disconnect().catch(() => undefined);
    process.exit(1);
  }
}

async function shutdown(signal: string): Promise<void> {
  console.log(`\n[API] Nhận ${signal}, đang tắt máy chủ...`);
  if (!server) {
    await prisma.$disconnect();
    process.exit(0);
  }
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

void startServer();
