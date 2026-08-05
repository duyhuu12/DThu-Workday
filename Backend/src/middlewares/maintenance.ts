import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { requiredEnv } from '../config/env.js';

const JWT_SECRET = requiredEnv('JWT_SECRET');

export async function maintenanceGuard(req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await prisma.systemSettings.findFirst({
      select: { maintenanceMode: true },
    });

    if (!settings?.maintenanceMode) {
      next();
      return;
    }

    // Login and public settings stay available so the UI can show maintenance state.
    if (
      (req.method === 'POST' && req.path === '/api/auth/login')
      || (req.method === 'GET' && req.path === '/api/system/settings')
    ) {
      next();
      return;
    }

    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as { id?: unknown };
      const userId = Number(decoded.id);
      if (Number.isInteger(userId) && userId > 0) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { role: true, status: true },
        });
        if (user?.role === UserRole.SUPER_ADMIN && user.status === 'ACTIVE') {
          next();
          return;
        }
      }
    }

    res.status(503).json({
      success: false,
      code: 'MAINTENANCE_MODE',
      message: 'Hệ thống đang bảo trì. Vui lòng quay lại sau.',
    });
  } catch {
    res.status(503).json({
      success: false,
      code: 'MAINTENANCE_MODE',
      message: 'Hệ thống đang bảo trì. Vui lòng quay lại sau.',
    });
  }
}
