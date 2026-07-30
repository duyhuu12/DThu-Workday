import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { BusinessError } from '../utils/errors.js';
import { requiredEnv } from '../config/env.js';
import { toApiRole } from '../utils/roles.js';

const JWT_SECRET = requiredEnv('JWT_SECRET');
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '8h';

const userInclude = {
  student: {
    include: {
      class: true,
      faculty: true,
    },
  },
  managedClass: {
    include: {
      faculty: true,
    },
  },
} as const;

function mapAuthUser(user: any) {
  return {
    id: String(user.id),
    email: user.email,
    name: user.fullName,
    role: toApiRole(user.role),
    phone: user.phone || undefined,
    status: user.status.toLowerCase(),
    createdAt: user.createdAt.toISOString(),
    lastLogin: user.lastLoginAt?.toISOString(),
    studentCode: user.student?.studentCode || undefined,
    managedClassId: user.managedClassId ? String(user.managedClassId) : undefined,
    managedClassName: user.managedClass?.name || undefined,
  };
}

export async function loginUser(identifierInput: string, password: string) {
  const identifier = String(identifierInput ?? '').trim();

  if (!identifier || !password) {
    throw new BusinessError(400, 'Vui lòng nhập email hoặc mã sinh viên và mật khẩu');
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier.toLowerCase() },
        {
          student: {
            is: {
              studentCode: identifier.toUpperCase(),
            },
          },
        },
      ],
    },
    include: userInclude,
  });

  if (!user) {
    throw new BusinessError(401, 'Email/mã sinh viên hoặc mật khẩu không đúng');
  }

  if (user.status === 'LOCKED') {
    throw new BusinessError(403, 'Tài khoản của bạn đã bị khóa');
  }

  if (user.status === 'INACTIVE') {
    throw new BusinessError(403, 'Tài khoản chưa được kích hoạt');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new BusinessError(401, 'Email/mã sinh viên hoặc mật khẩu không đúng');
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
    include: userInclude,
  });

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: 'Đăng nhập',
      affectedItem: 'Hệ thống',
      newValue: 'active',
    },
  });

  const payload = {
    id: updatedUser.id,
    email: updatedUser.email,
    role: updatedUser.role,
    fullName: updatedUser.fullName,
    studentId: updatedUser.student?.id || null,
    managedClassId: updatedUser.managedClassId || null,
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });

  return {
    token,
    user: mapAuthUser(updatedUser),
  };
}

export async function getUserById(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: userInclude,
  });

  if (!user) {
    throw new BusinessError(404, 'Không tìm thấy người dùng');
  }

  return mapAuthUser(user);
}

export async function updateOwnProfile(userId: number, input: any) {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    include: userInclude,
  });

  if (!existing) {
    throw new BusinessError(404, 'Không tìm thấy người dùng');
  }

  const fullName = String(input?.name ?? input?.fullName ?? existing.fullName).trim();
  const email = String(input?.email ?? existing.email).trim().toLowerCase();
  const phoneInput = input?.phone;
  const phone = phoneInput === undefined
    ? existing.phone
    : (String(phoneInput).trim() || null);

  if (fullName.length < 2 || fullName.length > 150) {
    throw new BusinessError(400, 'Họ tên phải có từ 2 đến 150 ký tự');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 150) {
    throw new BusinessError(400, 'Email không hợp lệ');
  }

  if (phone && phone.length > 20) {
    throw new BusinessError(400, 'Số điện thoại tối đa 20 ký tự');
  }

  const duplicateUser = await prisma.user.findFirst({
    where: { email, NOT: { id: userId } },
    select: { id: true },
  });
  if (duplicateUser) {
    throw new BusinessError(409, 'Email đã được tài khoản khác sử dụng');
  }

  if (existing.student) {
    const duplicateStudent = await prisma.student.findFirst({
      where: { email, NOT: { id: existing.student.id } },
      select: { id: true },
    });
    if (duplicateStudent) {
      throw new BusinessError(409, 'Email đã được hồ sơ sinh viên khác sử dụng');
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (existing.student) {
      await tx.student.update({
        where: { id: existing.student.id },
        data: {
          fullName,
          email,
          phone,
        },
      });
    }

    const user = await tx.user.update({
      where: { id: userId },
      data: {
        fullName,
        email,
        phone,
      },
      include: userInclude,
    });

    await tx.activityLog.create({
      data: {
        userId,
        action: 'Cập nhật hồ sơ cá nhân',
        affectedItem: `${fullName} (${email})`,
        oldValue: JSON.stringify({
          name: existing.fullName,
          email: existing.email,
          phone: existing.phone,
        }),
        newValue: JSON.stringify({ name: fullName, email, phone }),
      },
    });

    return user;
  });

  return mapAuthUser(updated);
}
