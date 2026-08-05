import { UserRole } from '@prisma/client';
import { BusinessError } from './errors.js';

const ROLE_MAP: Record<string, UserRole> = {
  STUDENT: UserRole.STUDENT,
  ORGANIZER: UserRole.ORGANIZER,
  ADMIN: UserRole.ADMIN,
  SUPER_ADMIN: UserRole.SUPER_ADMIN,
  SUPERADMIN: UserRole.SUPER_ADMIN,
  student: UserRole.STUDENT,
  organizer: UserRole.ORGANIZER,
  admin: UserRole.ADMIN,
  super_admin: UserRole.SUPER_ADMIN,
  superadmin: UserRole.SUPER_ADMIN,
};

export function normalizeRole(role: unknown): UserRole {
  const value = String(role ?? '').trim();
  if (!value) {
    throw new BusinessError(400, 'Vai trò không được để trống');
  }

  const normalized = value.toUpperCase().replace(/-/g, '_');
  const mapped = ROLE_MAP[normalized];
  if (!mapped) {
    throw new BusinessError(400, `Vai trò không hợp lệ: ${role}`);
  }
  return mapped;
}

export function toApiRole(role: unknown): 'student' | 'organizer' | 'admin' | 'superadmin' {
  const normalized = normalizeRole(role);
  switch (normalized) {
    case UserRole.STUDENT:
      return 'student';
    case UserRole.ORGANIZER:
      return 'organizer';
    case UserRole.ADMIN:
      return 'admin';
    case UserRole.SUPER_ADMIN:
      return 'superadmin';
  }
}

export function isRole(role: unknown, expected: UserRole): boolean {
  return normalizeRole(role) === expected;
}

export function hasAnyRole(role: unknown, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(normalizeRole(role));
}
