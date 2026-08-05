import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { prisma } from '../config/prisma.js';
import { requiredEnv } from '../config/env.js';
import { BusinessError } from '../utils/errors.js';
import { ensureMailConfigured, sendPasswordResetOtp } from './mailService.js';

const JWT_SECRET = requiredEnv('JWT_SECRET');
const OTP_LIFETIME_MS = 10 * 60 * 1000;
const OTP_RESEND_WAIT_MS = 60 * 1000;
const OTP_WINDOW_MS = 60 * 60 * 1000;
const MAX_SENDS_PER_WINDOW = 5;
const MAX_ATTEMPTS = 5;
const GENERIC_REQUEST_MESSAGE = 'Nếu email tồn tại trong hệ thống, mã OTP sẽ được gửi đến hộp thư của bạn.';

function normalizeEmail(value: unknown): string {
  const email = String(value ?? '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 150) {
    throw new BusinessError(400, 'Email không hợp lệ');
  }
  return email;
}

function hashOtp(userId: number, otp: string, salt: string): string {
  return createHash('sha256').update(`${userId}:${otp}:${salt}:${JWT_SECRET}`).digest('hex');
}

function invalidOtp(): BusinessError {
  return new BusinessError(400, 'Mã OTP không đúng hoặc đã hết hạn');
}

export async function requestPasswordReset(emailInput: unknown) {
  const email = normalizeEmail(emailInput);
  ensureMailConfigured();
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, fullName: true } });
  if (!user) return { message: GENERIC_REQUEST_MESSAGE, retryAfterSeconds: 60 };

  const now = new Date();
  const existing = await prisma.passwordResetOtp.findUnique({ where: { userId: user.id } });
  if (existing && now.getTime() - existing.lastSentAt.getTime() < OTP_RESEND_WAIT_MS) {
    return { message: GENERIC_REQUEST_MESSAGE, retryAfterSeconds: 60 };
  }

  const sameWindow = existing && now.getTime() - existing.windowStartedAt.getTime() < OTP_WINDOW_MS;
  if (sameWindow && existing.sendCount >= MAX_SENDS_PER_WINDOW) {
    return { message: GENERIC_REQUEST_MESSAGE, retryAfterSeconds: 60 };
  }

  const otp = String(randomInt(0, 1_000_000)).padStart(6, '0');
  const salt = randomBytes(16).toString('hex');
  const codeHash = hashOtp(user.id, otp, salt);
  const expiresAt = new Date(now.getTime() + OTP_LIFETIME_MS);
  const resetRecord = await prisma.passwordResetOtp.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      codeHash,
      salt,
      expiresAt,
      lastSentAt: now,
      windowStartedAt: now,
      sendCount: 1,
    },
    update: {
      codeHash,
      salt,
      attempts: 0,
      expiresAt,
      verifiedAt: null,
      lastSentAt: now,
      windowStartedAt: sameWindow ? existing!.windowStartedAt : now,
      sendCount: sameWindow ? existing!.sendCount + 1 : 1,
    },
  });

  try {
    await sendPasswordResetOtp(user.email, user.fullName, otp);
  } catch (error) {
    await prisma.passwordResetOtp.deleteMany({ where: { id: resetRecord.id, codeHash } });
    console.error('[password-reset-mail]', error);
    throw new BusinessError(503, 'Không thể gửi email OTP lúc này. Vui lòng thử lại sau.');
  }

  return { message: GENERIC_REQUEST_MESSAGE, retryAfterSeconds: 60 };
}

export async function verifyPasswordResetOtp(emailInput: unknown, otpInput: unknown) {
  const email = normalizeEmail(emailInput);
  const otp = String(otpInput ?? '').trim();
  if (!/^\d{6}$/.test(otp)) throw invalidOtp();

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) throw invalidOtp();
  const record = await prisma.passwordResetOtp.findUnique({ where: { userId: user.id } });
  if (!record || record.verifiedAt || record.expiresAt <= new Date() || record.attempts >= MAX_ATTEMPTS) throw invalidOtp();

  const candidate = Buffer.from(hashOtp(user.id, otp, record.salt), 'hex');
  const expected = Buffer.from(record.codeHash, 'hex');
  if (candidate.length !== expected.length || !timingSafeEqual(candidate, expected)) {
    await prisma.passwordResetOtp.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
    throw invalidOtp();
  }

  const verifiedAt = new Date();
  await prisma.passwordResetOtp.update({ where: { id: record.id }, data: { verifiedAt } });
  const resetToken = jwt.sign(
    { purpose: 'password-reset', resetId: record.id, userId: user.id },
    JWT_SECRET,
    { expiresIn: '10m' },
  );
  return { resetToken, expiresInSeconds: 600 };
}

export async function resetPassword(resetTokenInput: unknown, passwordInput: unknown) {
  const resetToken = String(resetTokenInput ?? '');
  const password = String(passwordInput ?? '');
  if (password.length < 8 || password.length > 72 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new BusinessError(400, 'Mật khẩu phải có 8–72 ký tự, gồm ít nhất một chữ cái và một chữ số');
  }

  let payload: jwt.JwtPayload;
  try {
    const decoded = jwt.verify(resetToken, JWT_SECRET);
    if (typeof decoded === 'string') throw new Error('Invalid token');
    payload = decoded;
  } catch {
    throw new BusinessError(400, 'Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn');
  }

  const resetId = Number(payload.resetId);
  const userId = Number(payload.userId);
  if (payload.purpose !== 'password-reset' || !Number.isInteger(resetId) || !Number.isInteger(userId)) {
    throw new BusinessError(400, 'Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn');
  }

  const record = await prisma.passwordResetOtp.findUnique({ where: { id: resetId } });
  if (!record || record.userId !== userId || !record.verifiedAt || record.expiresAt <= new Date()) {
    throw new BusinessError(400, 'Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({ where: { id: userId }, data: { passwordHash } });
    await tx.passwordResetOtp.delete({ where: { id: resetId } });
    await tx.activityLog.create({
      data: {
        userId,
        action: 'Đặt lại mật khẩu bằng OTP',
        affectedItem: `${user.fullName} (${user.email})`,
        newValue: 'success',
      },
    });
  });
  return { message: 'Đổi mật khẩu thành công' };
}
