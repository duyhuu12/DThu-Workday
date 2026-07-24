import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: UserRole;
    fullName: string;
    studentId?: number | null;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'DayLaKhoaBiMatSieuCapVipProChoHeThongDThuWorkday2026';

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role as UserRole,
      fullName: decoded.fullName,
      studentId: decoded.studentId,
    };
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Phiên đăng nhập hết hạn hoặc không hợp lệ' });
  }
}

export function authorize(roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'Không có quyền thực hiện hành động này' });
      return;
    }
    next();
  };
}
