import { CreditStatus } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { BusinessError } from '../utils/errors.js';

function parseSelection(notes: string | null, event: any) {
  try {
    const parsed = JSON.parse(notes || '{}');
    return {
      selectedDate: String(parsed.selectedDate || event.date.toISOString().split('T')[0]),
      selectedShift: String(parsed.selectedShift || event.shift.toLowerCase()),
      selectedStartTime: String(parsed.selectedStartTime || event.startTime),
      selectedEndTime: String(parsed.selectedEndTime || event.endTime),
    };
  } catch {
    return {
      selectedDate: event.date.toISOString().split('T')[0],
      selectedShift: event.shift.toLowerCase(),
      selectedStartTime: event.startTime,
      selectedEndTime: event.endTime,
    };
  }
}

export async function getStudentProfile(studentId: number) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: true,
      class: true,
      faculty: true,
      workCredits: {
        where: {
          status: {
            in: [CreditStatus.RECORDED, CreditStatus.ADJUSTED],
          },
        },
        select: {
          creditValue: true,
        },
      },
    },
  });

  if (!student) {
    throw new BusinessError(404, 'Không tìm thấy hồ sơ sinh viên');
  }

  const accumulatedWorkdays = student.workCredits.reduce(
    (sum, credit) => sum + credit.creditValue,
    0,
  );

  if (
    student.accumulatedWorkdays !== accumulatedWorkdays ||
    student.completedWorkdays !== accumulatedWorkdays
  ) {
    await prisma.student.update({
      where: { id: student.id },
      data: {
        accumulatedWorkdays,
        completedWorkdays: accumulatedWorkdays,
      },
    });
  }

  return {
    id: String(student.id),
    userId: String(student.userId),
    studentCode: student.studentCode,
    fullName: student.fullName,
    email: student.email,
    phone: student.phone || undefined,
    facultyId: String(student.facultyId),
    facultyName: student.faculty.name,
    classId: String(student.classId),
    className: student.class.name,
    schoolYear: student.schoolYear,
    gender: student.gender.toLowerCase(),
    birthDate: student.birthDate?.toISOString(),
    hometown: student.hometown || undefined,
    status: student.status.toLowerCase(),
    requiredWorkdays: student.requiredWorkdays,
    accumulatedWorkdays,
    completedWorkdays: accumulatedWorkdays,
  };
}

export async function getParticipationHistory(studentId: number) {
  const registrations = await prisma.registration.findMany({
    where: { studentId },
    include: {
      event: {
        include: {
          attendances: {
            where: { studentId },
          },
          workCredits: {
            where: { studentId },
          },
        },
      },
    },
    orderBy: {
      registeredAt: 'desc',
    },
  });

  return registrations.map((registration) => {
    const attendance = registration.event.attendances[0];
    const credit = registration.event.workCredits[0];
    const selection = parseSelection(registration.notes, registration.event);

    return {
      id: String(registration.id),
      eventId: String(registration.eventId),
      eventCode: registration.event.code,
      eventName: registration.event.name,
      location: registration.event.location,
      registrationStatus: registration.status.toLowerCase(),
      registeredAt: registration.registeredAt.toISOString(),
      attendanceStatus: attendance?.status.toLowerCase() || 'not_checked',
      checkInTime: attendance?.checkInTime || undefined,
      checkOutTime: attendance?.checkOutTime || undefined,
      creditValue:
        credit && [CreditStatus.RECORDED, CreditStatus.ADJUSTED].includes(credit.status)
          ? credit.creditValue
          : undefined,
      creditStatus: credit?.status.toLowerCase(),
      ...selection,
    };
  });
}
