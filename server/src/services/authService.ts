import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { BusinessError } from '../utils/errors.js';

const JWT_SECRET = process.env.JWT_SECRET || 'DayLaKhoaBiMatSieuCapVipProChoHeThongDThuWorkday2026';

export async function loginUser(email: string, password: string) {
  if (!email || !password) {
    throw new BusinessError(400, 'Vui lòng nhập email và mật khẩu');
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { student: true }
  });

  if (!user) {
    throw new BusinessError(401, 'Email hoặc mật khẩu không đúng');
  }

  if (user.status === 'LOCKED') {
    throw new BusinessError(403, 'Tài khoản của bạn đã bị khóa');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new BusinessError(401, 'Email hoặc mật khẩu không đúng');
  }

  // Cập nhật thời gian đăng nhập
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
    include: { student: true }
  });

  // Ghi log hoạt động
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: 'Đăng nhập',
      affectedItem: 'Hệ thống',
      newValue: 'active',
    }
  });

  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
    studentId: user.student?.id || null
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

  return {
    token,
    user: {
      id: String(user.id),
      email: user.email,
      name: user.fullName,
      role: user.role.toLowerCase(),
      phone: user.phone || undefined,
      status: user.status.toLowerCase(),
      createdAt: user.createdAt.toISOString(),
      lastLogin: updatedUser.lastLoginAt?.toISOString()
    }
  };
}

export async function getUserById(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { student: true }
  });

  if (!user) {
    throw new BusinessError(404, 'Không tìm thấy người dùng');
  }

  return {
    id: String(user.id),
    email: user.email,
    name: user.fullName,
    role: user.role.toLowerCase(),
    phone: user.phone || undefined,
    status: user.status.toLowerCase(),
    createdAt: user.createdAt.toISOString(),
    lastLogin: user.lastLoginAt?.toISOString()
  };
}
