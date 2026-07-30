import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { requiredEnv } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { normalizeRole } from '../utils/roles.js';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: UserRole;
    fullName: string;
    studentId?: number | null;
    managedClassId?: number | null;
  };
}

const JWT_SECRET = requiredEnv('JWT_SECRET');

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id?: unknown };
    const userId = Number(decoded.id);
    if (!Number.isInteger(userId) || userId <= 0) {
      res.status(401).json({ success: false, message: 'Phiên đăng nhập không hợp lệ' });
      return;
    }

    // Read role and class assignment from MySQL on every request so an admin
    // assignment takes effect immediately without relying on stale JWT fields.
    const databaseUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { student: { select: { id: true } } },
    });

    if (!databaseUser || databaseUser.status !== 'ACTIVE') {
      res.status(401).json({ success: false, message: 'Tài khoản không còn hoạt động' });
      return;
    }

    req.user = {
      id: databaseUser.id,
      email: databaseUser.email,
      role: normalizeRole(databaseUser.role),
      fullName: databaseUser.fullName,
      studentId: databaseUser.student?.id ?? null,
      managedClassId: databaseUser.managedClassId ?? null,
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
