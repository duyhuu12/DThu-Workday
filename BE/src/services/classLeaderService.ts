import {
  CreditStatus,
  EventStatus,
  PreliminaryReviewStatus,
  RegistrationStatus,
  UserRole,
} from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { BusinessError } from '../utils/errors.js';
import type { CsvFile } from './reportService.js';
export type { CsvFile } from './reportService.js';

function toId(value: unknown, label = 'ID'): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new BusinessError(400, `${label} không hợp lệ`);
  }
  return id;
}

function parseIdList(value: string | null): string[] {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function makeCsv(rows: unknown[][]): string {
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}`;
}

async function getLeaderContext(userId: number) {
  const leader = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      student: true,
      managedClass: {
        include: { faculty: true },
      },
    },
  });

  if (!leader || leader.role !== UserRole.CLASS_LEADER) {
    throw new BusinessError(403, 'Chức năng chỉ dành cho cán bộ lớp');
  }
  if (!leader.managedClassId || !leader.managedClass) {
    throw new BusinessError(400, 'Tài khoản chưa được phân công quản lý lớp');
  }

  return leader;
}

function eventIsEligible(event: {
  eligibleClassIds: string | null;
  eligibleFacultyIds: string | null;
  eligibleSchoolYears: string | null;
}, classInfo: { id: number; facultyId: number; schoolYear: string }): boolean {
  const classIds = parseIdList(event.eligibleClassIds);
  const facultyIds = parseIdList(event.eligibleFacultyIds);
  const schoolYears = parseIdList(event.eligibleSchoolYears);

  return (
    (classIds.length === 0 || classIds.includes(String(classInfo.id))) &&
    (facultyIds.length === 0 || facultyIds.includes(String(classInfo.facultyId))) &&
    (schoolYears.length === 0 || schoolYears.includes(classInfo.schoolYear))
  );
}

function mapLeaderStudent(student: any, registration?: any) {
  const missingWorkdays = Math.max(0, student.requiredWorkdays - student.accumulatedWorkdays);
  return {
    id: String(student.id),
    userId: String(student.userId),
    studentCode: student.studentCode,
    fullName: student.fullName,
    email: student.email,
    phone: student.phone || undefined,
    classId: String(student.classId),
    className: student.class?.name || '',
    facultyName: student.faculty?.name || '',
    requiredWorkdays: student.requiredWorkdays,
    accumulatedWorkdays: student.accumulatedWorkdays,
    completedWorkdays: student.completedWorkdays,
    missingWorkdays,
    hasEnoughWorkdays: missingWorkdays <= 0,
    registration: registration
      ? {
          id: String(registration.id),
          status: String(registration.status).toLowerCase(),
          registeredAt: registration.registeredAt.toISOString(),
          preliminaryStatus: String(registration.preliminaryStatus).toLowerCase(),
          preliminaryReviewedAt: registration.preliminaryReviewedAt?.toISOString(),
          preliminaryReviewerName: registration.preliminaryReviewer?.fullName || undefined,
        }
      : null,
  };
}

export async function getProfile(userId: number) {
  const leader = await getLeaderContext(userId);
  return {
    userId: String(leader.id),
    fullName: leader.fullName,
    studentCode: leader.student?.studentCode || undefined,
    classId: String(leader.managedClass.id),
    classCode: leader.managedClass.code,
    className: leader.managedClass.name,
    schoolYear: leader.managedClass.schoolYear,
    facultyId: String(leader.managedClass.facultyId),
    facultyName: leader.managedClass.faculty.name,
  };
}

export async function getDashboard(userId: number) {
  const leader = await getLeaderContext(userId);
  const classId = leader.managedClass.id;
  const students = await prisma.student.findMany({
    where: { classId, status: 'ACTIVE' },
    include: { class: true, faculty: true },
    orderBy: { studentCode: 'asc' },
  });

  const candidateEvents = await prisma.workEvent.findMany({
    where: {
      status: { in: [EventStatus.APPROVED, EventStatus.OPEN, EventStatus.ONGOING] },
    },
    orderBy: { date: 'asc' },
    take: 30,
  });
  const events = candidateEvents
    .filter((event) => eventIsEligible(event, leader.managedClass!))
    .slice(0, 5);

  const registrations = events.length
    ? await prisma.registration.findMany({
        where: {
          eventId: { in: events.map((event) => event.id) },
          student: { classId },
          status: { not: RegistrationStatus.CANCELLED },
        },
      })
    : [];

  return {
    profile: await getProfile(userId),
    totals: {
      students: students.length,
      sufficientStudents: students.filter((student) => student.accumulatedWorkdays >= student.requiredWorkdays).length,
      insufficientStudents: students.filter((student) => student.accumulatedWorkdays < student.requiredWorkdays).length,
      upcomingEvents: events.length,
      registrations: registrations.length,
      preliminaryConfirmed: registrations.filter(
        (registration) => registration.preliminaryStatus === PreliminaryReviewStatus.CONFIRMED,
      ).length,
    },
    insufficientStudents: students
      .filter((student) => student.accumulatedWorkdays < student.requiredWorkdays)
      .slice(0, 8)
      .map((student) => mapLeaderStudent(student)),
    upcomingEvents: events.map((event) => ({
      id: String(event.id),
      code: event.code,
      name: event.name,
      date: event.date.toISOString().slice(0, 10),
      status: event.status.toLowerCase(),
      registeredCount: event.registeredCount,
      maxCapacity: event.maxCapacity,
      classRegistrationCount: registrations.filter((registration) => registration.eventId === event.id).length,
    })),
  };
}

export async function listClassEvents(userId: number) {
  const leader = await getLeaderContext(userId);
  const events = await prisma.workEvent.findMany({
    where: {
      status: {
        in: [EventStatus.APPROVED, EventStatus.OPEN, EventStatus.ONGOING, EventStatus.COMPLETED],
      },
    },
    orderBy: [{ date: 'desc' }, { startTime: 'asc' }],
  });

  return events
    .filter((event) => eventIsEligible(event, leader.managedClass!))
    .map((event) => ({
      id: String(event.id),
      code: event.code,
      name: event.name,
      date: event.date.toISOString().slice(0, 10),
      startTime: event.startTime,
      endTime: event.endTime,
      status: event.status.toLowerCase(),
    }));
}

export async function listClassStudents(userId: number, eventIdValue?: unknown) {
  const leader = await getLeaderContext(userId);
  const eventId = eventIdValue ? toId(eventIdValue, 'Sự kiện') : null;

  if (eventId) {
    const event = await prisma.workEvent.findUnique({ where: { id: eventId } });
    if (!event) throw new BusinessError(404, 'Không tìm thấy sự kiện');
    if (!eventIsEligible(event, leader.managedClass!)) {
      throw new BusinessError(403, 'Sự kiện không áp dụng cho lớp được phân công');
    }
  }

  const students = await prisma.student.findMany({
    where: { classId: leader.managedClassId!, status: 'ACTIVE' },
    include: {
      class: true,
      faculty: true,
      registrations: eventId
        ? {
            where: { eventId, status: { not: RegistrationStatus.CANCELLED } },
            include: { preliminaryReviewer: true },
            take: 1,
          }
        : false,
    },
    orderBy: { studentCode: 'asc' },
  });

  return students.map((student: any) =>
    mapLeaderStudent(student, eventId ? student.registrations?.[0] : undefined),
  );
}

export async function reviewRegistration(
  userId: number,
  registrationIdValue: unknown,
  statusValue: unknown,
) {
  const leader = await getLeaderContext(userId);
  const registrationId = toId(registrationIdValue, 'Đăng ký');
  const normalized = String(statusValue ?? '').trim().toUpperCase();
  if (!['CONFIRMED', 'NEEDS_REVIEW', 'UNREVIEWED'].includes(normalized)) {
    throw new BusinessError(400, 'Trạng thái xác nhận sơ bộ không hợp lệ');
  }

  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: { student: true, event: true },
  });
  if (!registration) throw new BusinessError(404, 'Không tìm thấy đăng ký');
  if (registration.student.classId !== leader.managedClassId) {
    throw new BusinessError(403, 'Bạn chỉ được xác nhận sinh viên trong lớp mình');
  }
  if ([RegistrationStatus.CANCELLED, RegistrationStatus.ABSENT].includes(registration.status)) {
    throw new BusinessError(400, 'Không thể xác nhận sơ bộ đăng ký đã hủy hoặc vắng mặt');
  }

  const nextStatus = normalized as PreliminaryReviewStatus;
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.registration.update({
      where: { id: registrationId },
      data: {
        preliminaryStatus: nextStatus,
        preliminaryReviewedAt:
          nextStatus === PreliminaryReviewStatus.UNREVIEWED ? null : new Date(),
        preliminaryReviewedById:
          nextStatus === PreliminaryReviewStatus.UNREVIEWED ? null : userId,
      },
      include: { preliminaryReviewer: true },
    });

    await tx.activityLog.create({
      data: {
        userId,
        action: 'Xác nhận sơ bộ đăng ký',
        affectedItem: `${registration.student.fullName} - ${registration.event.name}`,
        oldValue: registration.preliminaryStatus,
        newValue: nextStatus,
      },
    });
    return result;
  });

  return {
    id: String(updated.id),
    preliminaryStatus: updated.preliminaryStatus.toLowerCase(),
    preliminaryReviewedAt: updated.preliminaryReviewedAt?.toISOString(),
    preliminaryReviewerName: updated.preliminaryReviewer?.fullName || undefined,
  };
}

interface NotificationInput {
  target?: unknown;
  title?: unknown;
  message?: unknown;
  eventId?: unknown;
  studentIds?: unknown;
}

async function resolveNotificationRecipients(userId: number, input: NotificationInput) {
  const leader = await getLeaderContext(userId);
  const target = String(input.target ?? 'all').trim().toLowerCase();
  const baseWhere: any = { classId: leader.managedClassId!, status: 'ACTIVE' };

  if (target === 'insufficient') {
    const students = await prisma.student.findMany({
      where: baseWhere,
      include: { user: true },
      orderBy: { studentCode: 'asc' },
    });
    return students.filter((student) => student.accumulatedWorkdays < student.requiredWorkdays);
  }

  if (target === 'unregistered') {
    const eventId = toId(input.eventId, 'Sự kiện');
    const event = await prisma.workEvent.findUnique({ where: { id: eventId } });
    if (!event) throw new BusinessError(404, 'Không tìm thấy sự kiện');
    if (!eventIsEligible(event, leader.managedClass!)) {
      throw new BusinessError(403, 'Sự kiện không áp dụng cho lớp được phân công');
    }
    return prisma.student.findMany({
      where: {
        ...baseWhere,
        registrations: {
          none: {
            eventId,
            status: { not: RegistrationStatus.CANCELLED },
          },
        },
      },
      include: { user: true },
      orderBy: { studentCode: 'asc' },
    });
  }

  if (target === 'selected') {
    const rawIds = Array.isArray(input.studentIds) ? input.studentIds : [];
    const ids = rawIds.map((value) => toId(value, 'Sinh viên'));
    if (ids.length === 0) throw new BusinessError(400, 'Vui lòng chọn ít nhất một sinh viên');
    return prisma.student.findMany({
      where: { ...baseWhere, id: { in: ids } },
      include: { user: true },
      orderBy: { studentCode: 'asc' },
    });
  }

  if (target !== 'all') throw new BusinessError(400, 'Nhóm nhận thông báo không hợp lệ');
  return prisma.student.findMany({
    where: baseWhere,
    include: { user: true },
    orderBy: { studentCode: 'asc' },
  });
}

export async function sendClassNotification(userId: number, input: NotificationInput) {
  const leader = await getLeaderContext(userId);
  const title = String(input.title ?? '').trim();
  const message = String(input.message ?? '').trim();
  if (!title || !message) throw new BusinessError(400, 'Tiêu đề và nội dung thông báo là bắt buộc');
  if (title.length > 255) throw new BusinessError(400, 'Tiêu đề không được vượt quá 255 ký tự');

  const recipients = await resolveNotificationRecipients(userId, input);
  if (recipients.length === 0) {
    throw new BusinessError(400, 'Không có sinh viên phù hợp để gửi thông báo');
  }

  await prisma.$transaction(async (tx) => {
    await tx.notification.createMany({
      data: recipients.map((student) => ({
        userId: student.userId,
        type: 'SYSTEM' as const,
        title,
        message,
        link: '/student/notifications',
      })),
    });
    await tx.activityLog.create({
      data: {
        userId,
        action: 'Gửi thông báo lớp',
        affectedItem: `${leader.managedClass!.code} - ${recipients.length} sinh viên`,
        newValue: JSON.stringify({ title, target: input.target ?? 'all' }),
      },
    });
  });

  return { sent: recipients.length };
}

export async function remindInsufficientWorkdays(userId: number, customMessage?: unknown) {
  const message = String(customMessage ?? '').trim() ||
    'Bạn chưa tích lũy đủ ngày công theo yêu cầu. Vui lòng theo dõi và đăng ký các đợt lao động phù hợp.';
  return sendClassNotification(userId, {
    target: 'insufficient',
    title: 'Nhắc nhở tiến độ ngày công',
    message,
  });
}

export async function exportClassWorkCredits(userId: number): Promise<CsvFile> {
  const leader = await getLeaderContext(userId);
  const students = await prisma.student.findMany({
    where: { classId: leader.managedClassId! },
    orderBy: { studentCode: 'asc' },
    include: {
      workCredits: {
        where: { status: { in: [CreditStatus.RECORDED, CreditStatus.ADJUSTED] } },
        include: { event: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  const rows: unknown[][] = [
    [
      'Mã sinh viên',
      'Họ tên',
      'Lớp',
      'Ngày công tích lũy',
      'Ngày công yêu cầu',
      'Còn thiếu',
      'Trạng thái',
      'Chi tiết ngày công',
    ],
    ...students.map((student) => {
      const missing = Math.max(0, student.requiredWorkdays - student.accumulatedWorkdays);
      const detail = student.workCredits
        .map((credit) => `${credit.event.code}: ${credit.creditValue}`)
        .join('; ');
      return [
        student.studentCode,
        student.fullName,
        leader.managedClass!.name,
        student.accumulatedWorkdays,
        student.requiredWorkdays,
        missing,
        missing <= 0 ? 'Đã đủ' : 'Chưa đủ',
        detail,
      ];
    }),
  ];

  return {
    filename: `ngay-cong-lop-${leader.managedClass.code}-${new Date().toISOString().slice(0, 10)}.csv`,
    content: makeCsv(rows),
  };
}

export async function listAssignments() {
  const [leaders, candidates, classes] = await prisma.$transaction([
    prisma.user.findMany({
      where: { role: UserRole.CLASS_LEADER },
      include: {
        student: { include: { class: true, faculty: true } },
        managedClass: { include: { faculty: true } },
      },
      orderBy: { fullName: 'asc' },
    }),
    prisma.student.findMany({
      where: { status: 'ACTIVE', user: { role: { in: [UserRole.STUDENT, UserRole.CLASS_LEADER] } } },
      include: { user: true, class: true, faculty: true },
      orderBy: [{ class: { name: 'asc' } }, { studentCode: 'asc' }],
    }),
    prisma.class.findMany({ include: { faculty: true }, orderBy: { name: 'asc' } }),
  ]);

  return {
    leaders: leaders.map((leader) => ({
      userId: String(leader.id),
      fullName: leader.fullName,
      email: leader.email,
      studentId: leader.student ? String(leader.student.id) : undefined,
      studentCode: leader.student?.studentCode || undefined,
      classId: leader.managedClass ? String(leader.managedClass.id) : undefined,
      className: leader.managedClass?.name || undefined,
      facultyName: leader.managedClass?.faculty.name || undefined,
    })),
    candidates: candidates.map((student) => ({
      studentId: String(student.id),
      userId: String(student.userId),
      studentCode: student.studentCode,
      fullName: student.fullName,
      classId: String(student.classId),
      className: student.class.name,
      facultyName: student.faculty.name,
      currentRole: student.user.role.toLowerCase(),
    })),
    classes: classes.map((item) => ({
      id: String(item.id),
      code: item.code,
      name: item.name,
      facultyName: item.faculty.name,
    })),
  };
}

export async function assignClassLeader(
  studentIdValue: unknown,
  classIdValue: unknown,
  actorId: number,
) {
  const studentId = toId(studentIdValue, 'Sinh viên');
  const classId = toId(classIdValue, 'Lớp');
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { user: true, class: true },
  });
  if (!student) throw new BusinessError(404, 'Không tìm thấy sinh viên');
  if (student.classId !== classId) {
    throw new BusinessError(400, 'Cán bộ lớp phải được phân công đúng lớp đang học');
  }

  const updated = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: student.userId },
      data: { role: UserRole.CLASS_LEADER, managedClassId: classId },
      include: { managedClass: true },
    });
    await tx.activityLog.create({
      data: {
        userId: actorId,
        action: 'Phân công cán bộ lớp',
        affectedItem: `${student.studentCode} - ${student.fullName}`,
        newValue: student.class.name,
      },
    });
    return user;
  });

  return {
    userId: String(updated.id),
    fullName: updated.fullName,
    classId: updated.managedClass ? String(updated.managedClass.id) : undefined,
    className: updated.managedClass?.name || undefined,
  };
}

export async function removeClassLeader(userIdValue: unknown, actorId: number) {
  const userId = toId(userIdValue, 'Người dùng');
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    include: { student: true, managedClass: true },
  });
  if (!existing || existing.role !== UserRole.CLASS_LEADER) {
    throw new BusinessError(404, 'Không tìm thấy cán bộ lớp');
  }
  if (!existing.student) {
    throw new BusinessError(400, 'Tài khoản cán bộ lớp không có hồ sơ sinh viên để chuyển lại');
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { role: UserRole.STUDENT, managedClassId: null },
    }),
    prisma.activityLog.create({
      data: {
        userId: actorId,
        action: 'Hủy phân công cán bộ lớp',
        affectedItem: `${existing.student.studentCode} - ${existing.fullName}`,
        oldValue: existing.managedClass?.name || '',
        newValue: 'STUDENT',
      },
    }),
  ]);
}
