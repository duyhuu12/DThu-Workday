import { prisma } from '../config/prisma.js';
import { BusinessError } from '../utils/errors.js';
import { CreditStatus } from '@prisma/client';

function mapCredit(c: any) {
  return {
    id: String(c.id),
    studentId: String(c.studentId),
    studentCode: c.student?.studentCode || '',
    studentName: c.student?.fullName || '',
    classId: String(c.student?.classId || ''),
    className: c.student?.class?.name || '',
    facultyId: String(c.student?.facultyId || ''),
    facultyName: c.student?.faculty?.name || '',
    eventId: c.eventId ? String(c.eventId) : undefined,
    eventName: c.event?.name || 'Điều chỉnh thủ công',
    eventDate: c.event?.date
      ? c.event.date.toISOString().split('T')[0]
      : (c.adjustedAt || c.createdAt).toISOString().split('T')[0],
    semester: c.semester?.name || 'Học kỳ 1',
    schoolYear: c.semester?.schoolYear || '2024-2025',
    creditValue: c.creditValue,
    status: c.status.toLowerCase(),
    notes: c.notes || undefined,
    adjustedBy: c.adjustedBy?.fullName || undefined,
    adjustmentReason: c.adjustmentReason || undefined,
    adjustedAt: c.adjustedAt ? c.adjustedAt.toISOString() : undefined,
    createdAt: c.createdAt.toISOString(),
  };
}

async function recalculateStudentWorkdays(studentId: number, tx: any) {
  const credits = await tx.workCredit.findMany({
    where: {
      studentId,
      status: { in: [CreditStatus.RECORDED, CreditStatus.ADJUSTED] }
    }
  });

  const accumulated = credits.reduce((sum: number, c: any) => sum + c.creditValue, 0);
  const completed = credits.filter((c: any) => c.status === CreditStatus.RECORDED || c.status === CreditStatus.ADJUSTED).reduce((sum: number, c: any) => sum + c.creditValue, 0);

  await tx.student.update({
    where: { id: studentId },
    data: {
      accumulatedWorkdays: accumulated,
      completedWorkdays: completed,
    }
  });
}

export async function listCredits(filters: { studentId?: string, status?: string }, userRole: string, currentStudentId: number | null, currentUserId: number) {
  let whereClause: any = {};

  if (['STUDENT', 'student'].includes(userRole)) {
    if (!currentStudentId) {
      throw new BusinessError(400, 'Không tìm thấy thông tin sinh viên');
    }
    whereClause.studentId = currentStudentId;
  } else if (['ORGANIZER', 'organizer'].includes(userRole)) {
    whereClause.event = { organizerId: currentUserId };
    if (filters.studentId) whereClause.studentId = parseInt(filters.studentId);
  } else if (filters.studentId) {
    whereClause.studentId = parseInt(filters.studentId);
  }

  if (filters.status && filters.status !== 'all') {
    whereClause.status = filters.status.toUpperCase() as CreditStatus;
  }

  const list = await prisma.workCredit.findMany({
    where: whereClause,
    include: {
      event: true,
      student: {
        include: { class: true, faculty: true }
      },
      semester: true,
      adjustedBy: true,
    },
    orderBy: {
      createdAt: 'desc',
    }
  });

  return list.map(mapCredit);
}

export async function adjustCreditValue(creditId: number, creditValue: number, reason: string, adjustedById: number) {
  const existing = await prisma.workCredit.findUnique({
    where: { id: creditId },
    include: { student: true }
  });

  if (!existing) {
    throw new BusinessError(404, 'Không tìm thấy bản ghi ngày công');
  }

  const updated = await prisma.$transaction(async (tx: any) => {
    const credit = await tx.workCredit.update({
      where: { id: creditId },
      data: {
        creditValue,
        status: CreditStatus.ADJUSTED,
        adjustedById,
        adjustmentReason: reason,
        adjustedAt: new Date(),
      },
      include: {
        event: true,
        student: { include: { class: true, faculty: true } },
        semester: true,
        adjustedBy: true,
      }
    });

    await recalculateStudentWorkdays(existing.studentId, tx);

    await tx.notification.create({
      data: {
        userId: existing.student.userId,
        type: 'CREDIT',
        title: 'Ngày công được điều chỉnh',
        message: `Ngày công của bạn cho "${credit.event?.name || 'điều chỉnh thủ công'}" đã được điều chỉnh thành ${creditValue} ngày công. Lý do: ${reason}`,
        link: '/student/work-credits',
      }
    });

    return credit;
  });

  return mapCredit(updated);
}

export async function updateCreditStatus(creditId: number, status: string, actorId: number) {
  const nextStatus = String(status || '').toUpperCase() as CreditStatus;
  if (
    nextStatus !== CreditStatus.RECORDED &&
    nextStatus !== CreditStatus.REJECTED &&
    nextStatus !== CreditStatus.PENDING
  ) {
    throw new BusinessError(400, 'Trạng thái ngày công không hợp lệ');
  }

  const existing = await prisma.workCredit.findUnique({
    where: { id: creditId },
    include: { student: true, event: true },
  });
  if (!existing) throw new BusinessError(404, 'Không tìm thấy bản ghi ngày công');

  const updated = await prisma.$transaction(async (tx: any) => {
    const credit = await tx.workCredit.update({
      where: { id: creditId },
      data: {
        status: nextStatus,
        adjustedById: actorId,
        adjustedAt: new Date(),
      },
      include: {
        event: true,
        student: { include: { class: true, faculty: true } },
        semester: true,
        adjustedBy: true,
      },
    });

    await recalculateStudentWorkdays(existing.studentId, tx);
    await tx.notification.create({
      data: {
        userId: existing.student.userId,
        type: 'CREDIT',
        title: 'Trạng thái ngày công được cập nhật',
        message: `Ngày công của "${existing.event?.name || 'điều chỉnh thủ công'}" đã chuyển sang trạng thái ${nextStatus.toLowerCase()}.`,
        link: '/student/work-credits',
      },
    });
    await tx.activityLog.create({
      data: {
        userId: actorId,
        action: 'Cập nhật trạng thái ngày công',
        affectedItem: `${existing.student.fullName} - ${existing.event?.name || 'Điều chỉnh thủ công'}`,
        oldValue: existing.status,
        newValue: nextStatus,
      },
    });

    return credit;
  });

  return mapCredit(updated);
}

export async function createManualCreditAdjustment(
  studentIdValue: unknown,
  creditValueInput: unknown,
  reasonInput: unknown,
  actorId: number,
) {
  const studentId = Number(studentIdValue);
  const creditValue = Number(creditValueInput);
  const reason = String(reasonInput ?? '').trim();

  if (!Number.isInteger(studentId) || studentId <= 0) {
    throw new BusinessError(400, 'Sinh viên không hợp lệ');
  }
  if (!Number.isFinite(creditValue) || creditValue === 0 || Math.abs(creditValue) > 100) {
    throw new BusinessError(400, 'Số ngày công điều chỉnh phải khác 0 và không vượt quá 100');
  }
  if (reason.length < 5 || reason.length > 500) {
    throw new BusinessError(400, 'Lý do điều chỉnh phải có từ 5 đến 500 ký tự');
  }

  const [student, semester, totals] = await Promise.all([
    prisma.student.findUnique({ where: { id: studentId } }),
    prisma.semesterConfig.findFirst({ where: { isActive: true } }),
    prisma.workCredit.aggregate({
      where: { studentId, status: { in: [CreditStatus.RECORDED, CreditStatus.ADJUSTED] } },
      _sum: { creditValue: true },
    }),
  ]);
  if (!student) throw new BusinessError(404, 'Không tìm thấy sinh viên');
  if (!semester) throw new BusinessError(409, 'Chưa có học kỳ đang hoạt động để ghi nhận ngày công');

  const currentTotal = totals._sum.creditValue ?? 0;
  if (currentTotal + creditValue < 0) {
    throw new BusinessError(400, `Không thể giảm quá ${currentTotal} ngày công hiện có`);
  }

  const created = await prisma.$transaction(async (tx: any) => {
    const credit = await tx.workCredit.create({
      data: {
        student: { connect: { id: studentId } },
        semester: { connect: { id: semester.id } },
        creditValue,
        status: CreditStatus.ADJUSTED,
        notes: 'Điều chỉnh thủ công bởi quản trị viên',
        adjustedBy: { connect: { id: actorId } },
        adjustmentReason: reason,
        adjustedAt: new Date(),
      },
      include: {
        event: true,
        student: { include: { class: true, faculty: true } },
        semester: true,
        adjustedBy: true,
      },
    });

    await recalculateStudentWorkdays(studentId, tx);
    await tx.notification.create({
      data: {
        userId: student.userId,
        type: 'CREDIT',
        title: 'Ngày công được điều chỉnh',
        message: `Quản trị viên đã ${creditValue > 0 ? 'cộng' : 'trừ'} ${Math.abs(creditValue)} ngày công. Lý do: ${reason}`,
        link: '/student/work-credits',
      },
    });
    await tx.activityLog.create({
      data: {
        userId: actorId,
        action: creditValue > 0 ? 'Cấp ngày công thủ công' : 'Thu hồi ngày công thủ công',
        affectedItem: `${student.studentCode} - ${student.fullName}`,
        oldValue: String(currentTotal),
        newValue: String(currentTotal + creditValue),
      },
    });

    return credit;
  });

  return mapCredit(created);
}
