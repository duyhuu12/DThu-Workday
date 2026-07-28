import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';
import {
  AttendanceStatus,
  CreditStatus,
  EventStatus,
  RegistrationStatus,
  UserRole,
} from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { BusinessError } from '../utils/errors.js';
import { requiredEnv } from '../config/env.js';

const ALLOWED_STATUSES = new Set(Object.values(AttendanceStatus));

const JWT_SECRET = requiredEnv('JWT_SECRET');
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const QR_PURPOSE = 'dthu_attendance_qr';

type QrMode = 'CHECK_IN' | 'CHECK_OUT';

interface AttendanceQrClaims extends jwt.JwtPayload {
  purpose: string;
  eventId: number;
  mode: QrMode;
}

function normalizeQrMode(value: unknown): QrMode {
  const mode = String(value ?? 'CHECK_IN').toUpperCase();
  if (mode !== 'CHECK_IN' && mode !== 'CHECK_OUT') {
    throw new BusinessError(400, 'Loại mã QR không hợp lệ');
  }
  return mode;
}

function vietnamDateAndTime(now = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(now).map((part) => [part.type, part.value]),
  );

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}

function minutesOf(value: string): number {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
}

function extractQrToken(input: unknown): string {
  const raw = String(input ?? '').trim();
  if (!raw) throw new BusinessError(400, 'Mã QR không được để trống');

  if (raw.startsWith('DTHU-WORKDAY:')) {
    return raw.slice('DTHU-WORKDAY:'.length);
  }

  try {
    const url = new URL(raw);
    const token = url.searchParams.get('token');
    if (token) return token;
  } catch {
    // Không phải URL, tiếp tục xem như JWT thuần.
  }

  return raw;
}

function mapAttendance(attendance: any) {
  return {
    id: String(attendance.id),
    eventId: String(attendance.eventId),
    studentId: String(attendance.studentId),
    studentCode: attendance.student?.studentCode ?? '',
    studentName: attendance.student?.fullName ?? '',
    className: attendance.student?.class?.name ?? '',
    facultyName: attendance.student?.faculty?.name ?? '',
    status: attendance.status.toLowerCase(),
    checkInTime: attendance.checkInTime ?? undefined,
    checkOutTime: attendance.checkOutTime ?? undefined,
    notes: attendance.notes ?? undefined,
  };
}

function assertManagePermission(event: { organizerId: number }, userRole: UserRole | string, userId: number) {
  if (userRole === UserRole.ORGANIZER && event.organizerId !== userId) {
    throw new BusinessError(403, 'Bạn không có quyền quản lý sự kiện này');
  }
}

function normalizeStatus(status: unknown): AttendanceStatus {
  const normalized = String(status ?? '').toUpperCase() as AttendanceStatus;
  if (!ALLOWED_STATUSES.has(normalized)) {
    throw new BusinessError(400, 'Trạng thái điểm danh không hợp lệ');
  }
  return normalized;
}

function currentTime(): string {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());
}

async function ensureAttendanceRows(eventId: number): Promise<void> {
  const approved = await prisma.registration.findMany({
    where: {
      eventId,
      status: { in: [RegistrationStatus.APPROVED, RegistrationStatus.COMPLETED, RegistrationStatus.ABSENT] },
    },
    select: { studentId: true },
  });

  if (approved.length === 0) return;

  await prisma.$transaction(
    approved.map((registration) =>
      prisma.attendance.upsert({
        where: { eventId_studentId: { eventId, studentId: registration.studentId } },
        create: { eventId, studentId: registration.studentId, status: AttendanceStatus.NOT_CHECKED },
        update: {},
      }),
    ),
  );
}

async function recalculateStudentWorkdays(studentId: number, tx: any): Promise<void> {
  const credits = await tx.workCredit.findMany({
    where: { studentId, status: { in: [CreditStatus.RECORDED, CreditStatus.ADJUSTED] } },
    select: { creditValue: true },
  });
  const total = credits.reduce((sum: number, credit: { creditValue: number }) => sum + credit.creditValue, 0);
  await tx.student.update({
    where: { id: studentId },
    data: { accumulatedWorkdays: total, completedWorkdays: total },
  });
}

export async function getAttendanceList(eventId: number, userRole: UserRole | string, userId: number) {
  const event = await prisma.workEvent.findUnique({ where: { id: eventId } });
  if (!event) throw new BusinessError(404, 'Không tìm thấy sự kiện');
  assertManagePermission(event, userRole, userId);

  await ensureAttendanceRows(eventId);

  const list = await prisma.attendance.findMany({
    where: {
      eventId,
      student: {
        registrations: {
          some: {
            eventId,
            status: { in: [RegistrationStatus.APPROVED, RegistrationStatus.COMPLETED, RegistrationStatus.ABSENT] },
          },
        },
      },
    },
    orderBy: { student: { studentCode: 'asc' } },
    include: { student: { include: { class: true, faculty: true } } },
  });

  return list.map(mapAttendance);
}

export async function updateStatus(
  attendanceId: number,
  updateData: { status?: unknown; checkInTime?: string; checkOutTime?: string; notes?: string },
  userRole: UserRole | string,
  userId: number,
) {
  const existing = await prisma.attendance.findUnique({
    where: { id: attendanceId },
    include: { event: true },
  });
  if (!existing) throw new BusinessError(404, 'Không tìm thấy bản ghi điểm danh');
  assertManagePermission(existing.event, userRole, userId);

  const status = normalizeStatus(updateData.status);
  const data: Record<string, unknown> = { status, notes: updateData.notes };
  if (updateData.checkInTime !== undefined) data.checkInTime = updateData.checkInTime;
  if (updateData.checkOutTime !== undefined) data.checkOutTime = updateData.checkOutTime;
  if (status === AttendanceStatus.CHECKED_IN || status === AttendanceStatus.LATE) {
    data.checkInTime = updateData.checkInTime || existing.checkInTime || currentTime();
  }
  if (status === AttendanceStatus.CHECKED_OUT || status === AttendanceStatus.EARLY_LEAVE) {
    data.checkInTime = updateData.checkInTime || existing.checkInTime || currentTime();
    data.checkOutTime = updateData.checkOutTime || currentTime();
  }
  if (status === AttendanceStatus.ABSENT || status === AttendanceStatus.NOT_CHECKED) {
    data.checkInTime = null;
    data.checkOutTime = null;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const attendance = await tx.attendance.update({
      where: { id: attendanceId },
      data,
      include: { student: { include: { class: true, faculty: true } } },
    });

    const registration = await tx.registration.findUnique({
      where: { eventId_studentId: { eventId: existing.eventId, studentId: existing.studentId } },
    });
    if (registration) {
      const registrationStatus = status === AttendanceStatus.ABSENT
        ? RegistrationStatus.ABSENT
        : registration.status === RegistrationStatus.ABSENT
          ? RegistrationStatus.APPROVED
          : registration.status;
      await tx.registration.update({ where: { id: registration.id }, data: { status: registrationStatus } });
    }

    await tx.activityLog.create({
      data: {
        userId,
        action: 'Cập nhật điểm danh',
        affectedItem: `attendance:${attendanceId}`,
        oldValue: existing.status,
        newValue: status,
      },
    });
    return attendance;
  });

  return mapAttendance(updated);
}

export async function bulkUpdateStatus(
  eventId: number,
  statusInput: unknown,
  userRole: UserRole | string,
  userId: number,
) {
  const event = await prisma.workEvent.findUnique({ where: { id: eventId } });
  if (!event) throw new BusinessError(404, 'Không tìm thấy sự kiện');
  assertManagePermission(event, userRole, userId);
  const status = normalizeStatus(statusInput);
  await ensureAttendanceRows(eventId);

  const data: Record<string, unknown> = { status };
  if (status === AttendanceStatus.CHECKED_IN) data.checkInTime = currentTime();
  if (status === AttendanceStatus.CHECKED_OUT) {
    data.checkOutTime = currentTime();
  }
  if (status === AttendanceStatus.ABSENT || status === AttendanceStatus.NOT_CHECKED) {
    data.checkInTime = null;
    data.checkOutTime = null;
  }

  await prisma.$transaction(async (tx) => {
    await tx.attendance.updateMany({ where: { eventId }, data });
    if (status === AttendanceStatus.ABSENT) {
      await tx.registration.updateMany({
        where: { eventId, status: { in: [RegistrationStatus.APPROVED, RegistrationStatus.COMPLETED] } },
        data: { status: RegistrationStatus.ABSENT },
      });
    }
    await tx.activityLog.create({
      data: {
        userId,
        action: 'Điểm danh hàng loạt',
        affectedItem: `event:${eventId}`,
        newValue: status,
      },
    });
  });

  return getAttendanceList(eventId, userRole, userId);
}

export async function completeWorkEvent(eventId: number, userId: number, userRole: UserRole | string) {
  const event = await prisma.workEvent.findUnique({
    where: { id: eventId },
    include: {
      registrations: {
        where: { status: { in: [RegistrationStatus.APPROVED, RegistrationStatus.ABSENT] } },
        include: { student: true },
      },
      attendances: true,
    },
  });
  if (!event) throw new BusinessError(404, 'Không tìm thấy sự kiện');
  assertManagePermission(event, userRole, userId);
  if (event.status === EventStatus.COMPLETED) throw new BusinessError(400, 'Sự kiện đã được hoàn thành');

  const activeSemester = await prisma.semesterConfig.findFirst({ where: { isActive: true } });
  if (!activeSemester) throw new BusinessError(400, 'Chưa cấu hình học kỳ đang hoạt động');

  await prisma.$transaction(async (tx) => {
    await tx.workEvent.update({ where: { id: eventId }, data: { status: EventStatus.COMPLETED } });

    for (const registration of event.registrations) {
      const attendance = event.attendances.find((item) => item.studentId === registration.studentId);
      const attended = Boolean(attendance && attendance.status !== AttendanceStatus.ABSENT && attendance.status !== AttendanceStatus.NOT_CHECKED);
      await tx.registration.update({
        where: { id: registration.id },
        data: { status: attended ? RegistrationStatus.COMPLETED : RegistrationStatus.ABSENT },
      });

      if (attended) {
        await tx.workCredit.upsert({
          where: { studentId_eventId: { studentId: registration.studentId, eventId } },
          create: {
            studentId: registration.studentId,
            eventId,
            semesterId: activeSemester.id,
            creditValue: event.workdayCredit,
            status: CreditStatus.RECORDED,
          },
          update: { creditValue: event.workdayCredit, status: CreditStatus.RECORDED },
        });
        await tx.notification.create({
          data: {
            userId: registration.student.userId,
            type: 'CREDIT',
            title: 'Ghi nhận ngày công',
            message: `Bạn được ghi nhận ${event.workdayCredit} ngày công cho sự kiện "${event.name}".`,
            link: '/student/work-credits',
          },
        });
      } else {
        await tx.workCredit.deleteMany({ where: { studentId: registration.studentId, eventId } });
      }

      await recalculateStudentWorkdays(registration.studentId, tx);
    }

    await tx.activityLog.create({
      data: {
        userId,
        action: 'Hoàn tất sự kiện và ghi nhận ngày công',
        affectedItem: event.name,
        oldValue: event.status,
        newValue: EventStatus.COMPLETED,
      },
    });
  });
}


export async function createAttendanceQr(
  eventId: number,
  modeInput: unknown,
  expiresInMinutesInput: unknown,
  userRole: UserRole | string,
  userId: number,
) {
  const event = await prisma.workEvent.findUnique({ where: { id: eventId } });
  if (!event) throw new BusinessError(404, 'Không tìm thấy sự kiện');
  assertManagePermission(event, userRole, userId);

  const mode = normalizeQrMode(modeInput);
  const requestedMinutes = Number(expiresInMinutesInput ?? 5);
  const expiresInMinutes = Number.isFinite(requestedMinutes)
    ? Math.min(30, Math.max(1, Math.round(requestedMinutes)))
    : 5;

  const token = jwt.sign(
    {
      purpose: QR_PURPOSE,
      eventId,
      mode,
    },
    JWT_SECRET,
    {
      expiresIn: `${expiresInMinutes}m` as jwt.SignOptions['expiresIn'],
    },
  );

  const qrValue = `${FRONTEND_URL}/student/qr-attendance?token=${encodeURIComponent(token)}`;
  const qrDataUrl = await QRCode.toDataURL(qrValue, {
    width: 320,
    margin: 2,
    errorCorrectionLevel: 'M',
  });

  return {
    eventId: String(event.id),
    eventName: event.name,
    mode: mode.toLowerCase(),
    expiresInMinutes,
    expiresAt: new Date(Date.now() + expiresInMinutes * 60_000).toISOString(),
    qrValue,
    qrDataUrl,
  };
}

export async function scanStudentQr(
  qrInput: unknown,
  studentId: number,
  userId: number,
) {
  const token = extractQrToken(qrInput);

  let claims: AttendanceQrClaims;
  try {
    claims = jwt.verify(token, JWT_SECRET) as AttendanceQrClaims;
  } catch {
    throw new BusinessError(400, 'Mã QR không hợp lệ hoặc đã hết hạn');
  }

  if (
    claims.purpose !== QR_PURPOSE ||
    !Number.isInteger(Number(claims.eventId))
  ) {
    throw new BusinessError(400, 'Mã QR điểm danh không hợp lệ');
  }

  const mode = normalizeQrMode(claims.mode);
  const eventId = Number(claims.eventId);

  const event = await prisma.workEvent.findUnique({ where: { id: eventId } });
  if (!event) throw new BusinessError(404, 'Không tìm thấy sự kiện');

  if (
    event.status === EventStatus.CANCELLED ||
    event.status === EventStatus.REJECTED ||
    event.status === EventStatus.COMPLETED
  ) {
    throw new BusinessError(400, 'Sự kiện không còn cho phép điểm danh');
  }

  const registration = await prisma.registration.findUnique({
    where: {
      eventId_studentId: {
        eventId,
        studentId,
      },
    },
  });

  if (!registration || registration.status !== RegistrationStatus.APPROVED) {
    throw new BusinessError(403, 'Đăng ký của bạn chưa được duyệt cho sự kiện này');
  }

  const vietnamNow = vietnamDateAndTime();
  const eventDate = event.date.toISOString().split('T')[0];

  if (vietnamNow.date !== eventDate) {
    throw new BusinessError(400, 'Chỉ được điểm danh đúng ngày diễn ra sự kiện');
  }

  const nowMinutes = minutesOf(vietnamNow.time);
  const startMinutes = minutesOf(event.startTime);
  const endMinutes = minutesOf(event.endTime);

  if (nowMinutes < startMinutes - 60 || nowMinutes > endMinutes + 180) {
    throw new BusinessError(400, 'Ngoài khung thời gian điểm danh của sự kiện');
  }

  const existing = await prisma.attendance.findUnique({
    where: {
      eventId_studentId: {
        eventId,
        studentId,
      },
    },
  });

  if (mode === 'CHECK_IN' && existing?.checkOutTime) {
    throw new BusinessError(400, 'Bạn đã hoàn tất check-out cho sự kiện này');
  }
  if (mode === 'CHECK_IN' && existing?.checkInTime) {
    throw new BusinessError(400, `Bạn đã check-in lúc ${existing.checkInTime}`);
  }
  if (mode === 'CHECK_OUT' && !existing?.checkInTime) {
    throw new BusinessError(400, 'Bạn cần check-in trước khi check-out');
  }
  if (mode === 'CHECK_OUT' && existing?.checkOutTime) {
    throw new BusinessError(400, `Bạn đã check-out lúc ${existing.checkOutTime}`);
  }

  const status =
    mode === 'CHECK_IN'
      ? nowMinutes > startMinutes + 15
        ? AttendanceStatus.LATE
        : AttendanceStatus.CHECKED_IN
      : nowMinutes < endMinutes
        ? AttendanceStatus.EARLY_LEAVE
        : AttendanceStatus.CHECKED_OUT;

  const attendance = await prisma.$transaction(async (tx) => {
    const updated = await tx.attendance.upsert({
      where: {
        eventId_studentId: {
          eventId,
          studentId,
        },
      },
      create: {
        eventId,
        studentId,
        status,
        checkInTime: mode === 'CHECK_IN' ? vietnamNow.time : null,
        checkOutTime: mode === 'CHECK_OUT' ? vietnamNow.time : null,
        notes: 'Điểm danh bằng QR',
      },
      update:
        mode === 'CHECK_IN'
          ? {
              status,
              checkInTime: existing?.checkInTime || vietnamNow.time,
              notes: 'Điểm danh bằng QR',
            }
          : {
              status,
              checkOutTime: vietnamNow.time,
              notes: 'Điểm danh bằng QR',
            },
      include: {
        student: {
          include: {
            class: true,
            faculty: true,
          },
        },
      },
    });

    if (mode === 'CHECK_IN' && event.status !== EventStatus.ONGOING) {
      await tx.workEvent.update({
        where: { id: eventId },
        data: { status: EventStatus.ONGOING },
      });
    }

    await tx.activityLog.create({
      data: {
        userId,
        action: mode === 'CHECK_IN' ? 'Check-in bằng QR' : 'Check-out bằng QR',
        affectedItem: `event:${eventId}`,
        newValue: status,
      },
    });

    await tx.notification.create({
      data: {
        userId,
        type: 'EVENT',
        title: mode === 'CHECK_IN' ? 'Check-in thành công' : 'Check-out thành công',
        message: `${
          mode === 'CHECK_IN' ? 'Check-in' : 'Check-out'
        } sự kiện "${event.name}" lúc ${vietnamNow.time}.`,
        link: '/student/history',
      },
    });

    return updated;
  });

  return {
    ...mapAttendance(attendance),
    eventName: event.name,
    eventCode: event.code,
    eventDate,
    action: mode.toLowerCase(),
    message:
      mode === 'CHECK_IN'
        ? `Check-in thành công lúc ${vietnamNow.time}`
        : `Check-out thành công lúc ${vietnamNow.time}`,
  };
}
