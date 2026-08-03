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
    eventId: String(c.eventId),
    eventName: c.event?.name || '',
    eventDate: c.event?.date ? c.event.date.toISOString().split('T')[0] : '',
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

export async function listCredits(filters: { studentId?: string, status?: string }, userRole: string, currentStudentId: number | null) {
  let whereClause: any = {};

  if (userRole === 'STUDENT') {
    if (!currentStudentId) {
      throw new BusinessError(400, 'Không tìm thấy thông tin sinh viên');
    }
    whereClause.studentId = currentStudentId;
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
        message: `Ngày công của bạn cho sự kiện "${credit.event.name}" đã được điều chỉnh thành ${creditValue} ngày công. Lý do: ${reason}`,
        link: '/student/work-credits',
      }
    });

    return credit;
  });

  return mapCredit(updated);
}
