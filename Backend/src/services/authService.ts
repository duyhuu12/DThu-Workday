import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../config/prisma.js';
import { BusinessError } from '../utils/errors.js';
import { requiredEnv } from '../config/env.js';
import { toApiRole } from '../utils/roles.js';

const JWT_SECRET = requiredEnv('JWT_SECRET');
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '8h';
const currentDirectory = dirname(fileURLToPath(import.meta.url));
const avatarDirectory = resolve(currentDirectory, '../../uploads/avatars');
const MAX_AVATAR_BYTES = 1024 * 1024;

const userInclude = {
  student: {
    include: {
      class: true,
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
    avatarUrl: user.avatarUrl || undefined,
    status: user.status.toLowerCase(),
    createdAt: user.createdAt.toISOString(),
    lastLogin: user.lastLoginAt?.toISOString(),
    studentCode: user.student?.studentCode || undefined,
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

function detectImageExtension(buffer: Buffer): 'jpg' | 'png' | 'webp' | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return 'webp';
  return null;
}

export async function updateOwnAvatar(userId: number, imageDataInput: unknown) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: userInclude,
  });
  if (!user) throw new BusinessError(404, 'Không tìm thấy người dùng');
  if (!user.student) throw new BusinessError(403, 'Chỉ tài khoản sinh viên mới có thể thay ảnh đại diện');

  const imageData = String(imageDataInput ?? '');
  const match = imageData.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new BusinessError(400, 'Ảnh phải có định dạng JPG, PNG hoặc WebP');

  const buffer = Buffer.from(match[2], 'base64');
  if (!buffer.length || buffer.length > MAX_AVATAR_BYTES) {
    throw new BusinessError(400, 'Dung lượng ảnh tối đa là 1 MB');
  }

  const extension = detectImageExtension(buffer);
  if (!extension) throw new BusinessError(400, 'Nội dung tệp ảnh không hợp lệ');

  await mkdir(avatarDirectory, { recursive: true });
  const filename = `user-${userId}-${Date.now()}.${extension}`;
  const absolutePath = resolve(avatarDirectory, filename);
  await writeFile(absolutePath, buffer, { flag: 'wx' });

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const nextUser = await tx.user.update({
        where: { id: userId },
        data: { avatarUrl: `/uploads/avatars/${filename}` },
        include: userInclude,
      });
      await tx.activityLog.create({
        data: {
          userId,
          action: 'Thay ảnh đại diện',
          affectedItem: user.fullName,
          oldValue: user.avatarUrl,
          newValue: nextUser.avatarUrl,
        },
      });
      return nextUser;
    });

    if (user.avatarUrl?.startsWith('/uploads/avatars/')) {
      const oldFilename = user.avatarUrl.slice('/uploads/avatars/'.length);
      if (/^user-\d+-\d+\.(jpg|png|webp)$/.test(oldFilename)) {
        await unlink(resolve(avatarDirectory, oldFilename)).catch(() => undefined);
      }
    }

    return mapAuthUser(updated);
  } catch (error) {
    await unlink(absolutePath).catch(() => undefined);
    throw error;
  }
}
