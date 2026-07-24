import { prisma } from '../config/prisma.js';
import { BusinessError } from '../utils/errors.js';
import { AttendanceStatus, EventStatus, RegistrationStatus, CreditStatus } from '@prisma/client';

function mapAttendance(a: any) {
  return {
    id: String(a.id),
    eventId: String(a.eventId),
    studentId: String(a.studentId),
    studentCode: a.student?.studentCode || '',
    studentName: a.student?.fullName || '',
    status: a.status.toLowerCase(),
    checkInTime: a.checkInTime || undefined,
    checkOutTime: a.checkOutTime || undefined,
    notes: a.notes || undefined,
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

export async function getAttendanceList(eventId: number, userRole: string, userId: number) {
  const event = await prisma.workEvent.findUnique({
    where: { id: eventId }
  });

  if (!event) {
    throw new BusinessError(404, 'Không tìm thấy sự kiện');
  }

  if (userRole === 'ORGANIZER' && event.organizerId !== userId) {
    throw new BusinessError(403, 'Bạn không có quyền quản lý sự kiện này');
  }

  const list = await prisma.attendance.findMany({
    where: { eventId },
    include: { student: true },
  });

  return list.map(mapAttendance);
}

export async function updateStatus(attId: number, updateData: any, userRole: string, userId: number) {
  const existing = await prisma.attendance.findUnique({
    where: { id: attId },
    include: { event: true, student: true },
  });

  if (!existing) {
    throw new BusinessError(404, 'Không tìm thấy bản ghi điểm danh');
  }

  if (userRole === 'ORGANIZER' && existing.event.organizerId !== userId) {
    throw new BusinessError(403, 'Bạn không có quyền điểm danh sự kiện này');
  }

  const { status, checkInTime, checkOutTime, notes } = updateData;
  const updatedStatus = status.toUpperCase() as AttendanceStatus;

  const data: any = {
    status: updatedStatus,
    notes,
  };

  if (checkInTime !== undefined) data.checkInTime = checkInTime;
  if (checkOutTime !== undefined) data.checkOutTime = checkOutTime;

  const updated = await prisma.$transaction(async (tx: any) => {
    const att = await tx.attendance.update({
      where: { id: attId },
      data,
      include: { student: true },
    });

    const reg = await tx.registration.findUnique({
      where: {
        eventId_studentId: {
          eventId: existing.eventId,
          studentId: existing.studentId,
        }
      }
    });

    if (reg) {
      let regStatus: RegistrationStatus = reg.status;
      if (updatedStatus === AttendanceStatus.ABSENT) {
        regStatus = RegistrationStatus.ABSENT;
      }

      await tx.registration.update({
        where: { id: reg.id },
        data: { status: regStatus }
      });
    }

    return att;
  });

  return mapAttendance(updated);
}

export async function completeWorkEvent(eventId: number, userId: number, userRole: string) {
  const event = await prisma.workEvent.findUnique({
    where: { id: eventId },
    include: {
      registrations: {
        where: { status: { in: [RegistrationStatus.APPROVED, RegistrationStatus.PENDING] } },
        include: { student: true }
      },
      attendances: true,
    }
  });

  if (!event) {
    throw new BusinessError(404, 'Không tìm thấy sự kiện');
  }

  if (userRole === 'ORGANIZER' && event.organizerId !== userId) {
    throw new BusinessError(403, 'Bạn không có quyền hoàn thành sự kiện này');
  }

  if (event.status === EventStatus.COMPLETED) {
    throw new BusinessError(400, 'Sự kiện này đã được hoàn thành từ trước');
  }

  const activeSemester = await prisma.semesterConfig.findFirst({
    where: { isActive: true }
  });

  if (!activeSemester) {
    throw new BusinessError(400, 'Không tìm thấy học kỳ hoạt động. Vui lòng cấu hình học kỳ trước.');
  }

  await prisma.$transaction(async (tx: any) => {
    await tx.workEvent.update({
      where: { id: eventId },
      data: { status: EventStatus.COMPLETED }
    });

    for (const reg of event.registrations) {
      const attendance = event.attendances.find((a: any) => a.studentId === reg.studentId);
      
      let finalStatus: RegistrationStatus = RegistrationStatus.COMPLETED;
      let creditValue = event.workdayCredit;

      if (!attendance || attendance.status === AttendanceStatus.ABSENT || attendance.status === AttendanceStatus.NOT_CHECKED) {
        finalStatus = RegistrationStatus.ABSENT;
        creditValue = 0;
      }

      await tx.registration.update({
        where: { id: reg.id },
        data: { status: finalStatus }
      });

      if (finalStatus === RegistrationStatus.COMPLETED) {
        await tx.workCredit.upsert({
          where: {
            studentId_eventId: {
              studentId: reg.studentId,
              eventId,
            }
          },
          create: {
            studentId: reg.studentId,
            eventId,
            semesterId: activeSemester.id,
            creditValue,
            status: CreditStatus.RECORDED,
          },
          update: {
            creditValue,
            status: CreditStatus.RECORDED,
          }
        });

        await tx.notification.create({
          data: {
            userId: reg.student.userId,
            type: 'CREDIT',
            title: 'Ghi nhận ngày công',
            message: `Bạn được ghi nhận ${creditValue} ngày công cho sự kiện "${event.name}".`,
            link: '/student/work-credits',
          }
        });
      }

      await recalculateStudentWorkdays(reg.studentId, tx);
    }
  });
}
