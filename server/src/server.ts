import cors from "cors";
import "dotenv/config";
import express, { Request, Response } from "express";

const app = express();

const PORT = Number(process.env.PORT) || 8080;
const FRONTEND_URL =
  process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  }),
);

app.use(express.json());

app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "DThU Workday API đang hoạt động",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/events", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: [
      {
        id: 1,
        code: "LD001",
        name: "Vệ sinh khuôn viên giảng đường",
        location: "Khu A - Trường Đại học Đồng Tháp",
        workDate: "2026-07-30",
        startTime: "07:00",
        endTime: "11:00",
        credit: 0.5,
        maximumStudents: 50,
        registeredStudents: 26,
        status: "OPEN_FOR_REGISTRATION",
      },
      {
        id: 2,
        code: "LD002",
        name: "Chăm sóc cây xanh khu B",
        location: "Khu B - Trường Đại học Đồng Tháp",
        workDate: "2026-08-02",
        startTime: "07:00",
        endTime: "16:00",
        credit: 1,
        maximumStudents: 30,
        registeredStudents: 18,
        status: "OPEN_FOR_REGISTRATION",
      }
    ],
  });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Không tìm thấy API endpoint",
  });
});

app.listen(PORT, () => {
  console.log(`DThU Workday API: http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});