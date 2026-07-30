import { prisma } from '../config/prisma.js';
import { BusinessError } from '../utils/errors.js';
import { RegistrationStatus, AttendanceStatus, PreliminaryReviewStatus } from '@prisma/client';

function parseSelection(notes: string | null, event: any) {
  try {
    const parsed = JSON.parse(notes || '{}');
    return {
      selectedDate: String(parsed.selectedDate || event?.date?.toISOString().split('T')[0] || ''),
      selectedShift: String(parsed.selectedShift || event?.shift?.toLowerCase() || ''),
      selectedStartTime: String(parsed.selectedStartTime || event?.startTime || ''),
      selectedEndTime: String(parsed.selectedEndTime || event?.endTime || ''),
    };
  } catch {
    return {
      selectedDate: event?.date?.toISOString().split('T')[0] || '',
      selectedShift: event?.shift?.toLowerCase() || '',
      selectedStartTime: event?.startTime || '',
      selectedEndTime: event?.endTime || '',
    };
  }
}

function mapRegistration(r: any) {
  const selection = parseSelection(r.notes, r.event);

  return {
    id: String(r.id),
    eventId: String(r.eventId),
    eventName: r.event?.name || '',
    eventDate: r.event?.date ? r.event.date.toISOString().split('T')[0] : '',
    studentId: String(r.studentId),
    studentCode: r.student?.studentCode || '',
    studentName: r.student?.fullName || '',
    classId: String(r.student?.classId || ''),
    className: r.student?.class?.name || '',
    facultyId: String(r.student?.facultyId || ''),
    facultyName: r.student?.faculty?.name || '',
    status: r.status.toLowerCase(),
    registeredAt: r.registeredAt.toISOString(),
    approvedAt: r.approvedAt ? r.approvedAt.toISOString() : undefined,
    approvedBy: r.approvedById ? 'Ban Tổ Chức' : undefined,
    rejectionReason: r.rejectionReason || undefined,
    preliminaryStatus: r.preliminaryStatus?.toLowerCase?.() ?? 'unreviewed',
    preliminaryReviewedAt: r.preliminaryReviewedAt?.toISOString?.() ?? undefined,
    preliminaryReviewerName: r.preliminaryReviewer?.fullName || undefined,
    attendanceStatus:
      r.event?.attendances?.find((item: any) => item.studentId === r.studentId)?.status?.toLowerCase() ??
      'not_checked',
    workdayResult:
      r.event?.workCredits?.find((item: any) => item.studentId === r.studentId)?.creditValue ??
      undefined,
    notes: r.notes || undefined,
    ...selection,
  };
}

function overlaps(
  dateA: string,
  startA: string,
  endA: string,
  dateB: string,
  startB: string,
  endB: string,
) {
  return dateA === dateB && startA < endB && startB < endA;
}

export async function listRegistrations(
  filters: { studentId?: string; eventId?: string; status?: string },
  userRole: string,
  currentStudentId: number | null,
) {
  const whereClause: any = {};

  if (['STUDENT', 'CLASS_LEADER', 'student', 'classleader'].includes(userRole)) {
    if (!currentStudentId) {
      throw new BusinessError(400, 'Không tìm thấy hồ sơ sinh viên');
    }
    whereClause.studentId = currentStudentId;
  } else if (filters.studentId) {
    whereClause.studentId = parseInt(filters.studentId);
  }

  if (filters.eventId) {
    whereClause.eventId = parseInt(filters.eventId);
  }

  if (filters.status && filters.status !== 'all') {
    whereClause.status = filters.status.toUpperCase() as RegistrationStatus;
  }

  const regs = await prisma.registration.findMany({
    where: whereClause,
    include: {
      event: {
        include: {
          attendances: true,
          workCredits: true,
        },
      },
      student: {
        include: {
          class: true,
          faculty: true,
        },
      },
      preliminaryReviewer: true,
    },
    orderBy: {
      registeredAt: 'desc',
    },
  });

  return regs.map(mapRegistration);
}

export async function createRegistration(
  eventId: number,
  studentId: number,
  selectionInput: {
    selectedDate?: unknown;
    selectedShift?: unknown;
    selectedStartTime?: unknown;
    selectedEndTime?: unknown;
  } = {},
) {
  return prisma.$transaction(async (tx: any) => {
    const event = await tx.workEvent.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new BusinessError(404, 'Sự kiện không tồn tại');
    }

    if (event.status !== 'OPEN') {
      throw new BusinessError(400, 'Sự kiện chưa mở hoặc đã kết thúc đăng ký');
    }

    const now = new Date();
    if (now < event.registrationOpen || now > event.registrationClose) {
      throw new BusinessError(400, 'Thời gian đăng ký không hợp lệ (đã quá hạn hoặc chưa mở)');
    }

    const student = await tx.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new BusinessError(404, 'Hồ sơ sinh viên không tồn tại');
    }

    const selectedDate = String(
      selectionInput.selectedDate || event.date.toISOString().split('T')[0],
    );
    const selectedShift = String(
      selectionInput.selectedShift || event.shift.toLowerCase(),
    ).toLowerCase();
    const selectedStartTime = String(selectionInput.selectedStartTime || event.startTime);
    const selectedEndTime = String(selectionInput.selectedEndTime || event.endTime);

    const eventDate = event.date.toISOString().split('T')[0];
    const eventShift = event.shift.toLowerCase();

    // Hiện tại mỗi sự kiện có một ngày/ca trong schema. Việc lưu lựa chọn
    // giúp UI xác nhận rõ ràng và sẵn sàng mở rộng nhiều ca ở giai đoạn sau.
    if (
      selectedDate !== eventDate ||
      selectedShift !== eventShift ||
      selectedStartTime !== event.startTime ||
      selectedEndTime !== event.endTime
    ) {
      throw new BusinessError(400, 'Ngày hoặc ca được chọn không thuộc sự kiện này');
    }

    const eligibleFaculties = (JSON.parse(event.eligibleFacultyIds || '[]') as unknown[]).map(String);
    const eligibleClasses = (JSON.parse(event.eligibleClassIds || '[]') as unknown[]).map(String);
    const eligibleSchoolYears = (JSON.parse(event.eligibleSchoolYears || '[]') as unknown[]).map(String);

    if (eligibleFaculties.length > 0 && !eligibleFaculties.includes(String(student.facultyId))) {
      throw new BusinessError(400, 'Sự kiện này không áp dụng cho khoa của bạn');
    }
    if (eligibleClasses.length > 0 && !eligibleClasses.includes(String(student.classId))) {
      throw new BusinessError(400, 'Sự kiện này không áp dụng cho lớp của bạn');
    }
    if (eligibleSchoolYears.length > 0 && !eligibleSchoolYears.includes(student.schoolYear)) {
      throw new BusinessError(400, 'Sự kiện này không áp dụng cho khóa của bạn');
    }

    const existingReg = await tx.registration.findUnique({
      where: {
        eventId_studentId: {
          eventId,
          studentId,
        },
      },
    });

    if (existingReg && existingReg.status !== RegistrationStatus.CANCELLED) {
      throw new BusinessError(400, 'Bạn đã đăng ký sự kiện này rồi');
    }

    const settings = await tx.systemSettings.findFirst();
    const maxConcurrent = settings?.maxConcurrentRegistrations ?? 3;
    const activeRegistrations = await tx.registration.findMany({
      where: {
        studentId,
        status: {
          in: [
            RegistrationStatus.PENDING,
            RegistrationStatus.APPROVED,
            RegistrationStatus.WAITLIST,
          ],
        },
        eventId: { not: eventId },
      },
      include: { event: true },
    });

    if (activeRegistrations.length >= maxConcurrent) {
      throw new BusinessError(
        400,
        `Bạn chỉ được có tối đa ${maxConcurrent} đăng ký đang hoạt động`,
      );
    }

    for (const registration of activeRegistrations) {
      const otherSelection = parseSelection(registration.notes, registration.event);
      if (
        overlaps(
          selectedDate,
          selectedStartTime,
          selectedEndTime,
          otherSelection.selectedDate,
          otherSelection.selectedStartTime,
          otherSelection.selectedEndTime,
        )
      ) {
        throw new BusinessError(
          400,
          `Sự kiện bị trùng lịch với "${registration.event.name}"`,
        );
      }
    }

    if (event.registeredCount >= event.maxCapacity) {
      throw new BusinessError(400, 'Sự kiện đã đủ số lượng sinh viên tham gia');
    }

    const selectionNotes = JSON.stringify({
      selectedDate,
      selectedShift,
      selectedStartTime,
      selectedEndTime,
    });

    await tx.workEvent.update({
      where: { id: eventId },
      data: { registeredCount: { increment: 1 } },
    });

    const registration = existingReg
      ? await tx.registration.update({
          where: { id: existingReg.id },
          data: {
            status: RegistrationStatus.PENDING,
            registeredAt: new Date(),
            rejectionReason: null,
            preliminaryStatus: PreliminaryReviewStatus.UNREVIEWED,
            preliminaryReviewedAt: null,
            preliminaryReviewedById: null,
            notes: selectionNotes,
          },
          include: {
            event: true,
            student: { include: { class: true, faculty: true } },
            preliminaryReviewer: true,
          },
        })
      : await tx.registration.create({
          data: {
            eventId,
            studentId,
            status: RegistrationStatus.PENDING,
            notes: selectionNotes,
          },
          include: {
            event: true,
            student: { include: { class: true, faculty: true } },
            preliminaryReviewer: true,
          },
        });

    await tx.notification.create({
      data: {
        userId: student.userId,
        type: 'REGISTRATION',
        title: 'Đăng ký sự kiện thành công',
        message: `Bạn đã đăng ký sự kiện "${event.name}" và đang chờ duyệt.`,
        link: '/student/my-registrations',
      },
    });

    return mapRegistration(registration);
  });
}

export async function cancelRegistration(regId: number, studentId: number) {
  return prisma.$transaction(async (tx: any) => {
    const reg = await tx.registration.findUnique({
      where: { id: regId },
      include: { event: true, student: true },
    });

    if (!reg || reg.studentId !== studentId) {
      throw new BusinessError(404, 'Không tìm thấy bản ghi đăng ký của bạn');
    }

    if (reg.status === RegistrationStatus.CANCELLED) {
      throw new BusinessError(400, 'Đăng ký này đã được hủy trước đó');
    }

    if (
      reg.status === RegistrationStatus.COMPLETED ||
      reg.status === RegistrationStatus.ABSENT
    ) {
      throw new BusinessError(400, 'Không thể hủy đăng ký đã kết thúc');
    }

    const now = new Date();
    if (now > reg.event.cancellationDeadline) {
      throw new BusinessError(400, 'Đã quá thời hạn hủy đăng ký sự kiện này');
    }

    if (reg.event.registeredCount > 0) {
      await tx.workEvent.update({
        where: { id: reg.eventId },
        data: { registeredCount: { decrement: 1 } },
      });
    }

    const updated = await tx.registration.update({
      where: { id: regId },
      data: {
        status: RegistrationStatus.CANCELLED,
        preliminaryStatus: PreliminaryReviewStatus.UNREVIEWED,
        preliminaryReviewedAt: null,
        preliminaryReviewedById: null,
      },
      include: {
        event: true,
        student: { include: { class: true, faculty: true } },
        preliminaryReviewer: true,
      },
    });

    await tx.attendance.deleteMany({
      where: { eventId: reg.eventId, studentId: reg.studentId },
    });

    await tx.notification.create({
      data: {
        userId: reg.student.userId,
        type: 'REGISTRATION',
        title: 'Đã hủy đăng ký',
        message: `Bạn đã hủy đăng ký sự kiện "${reg.event.name}".`,
        link: '/student/my-registrations',
      },
    });

    return mapRegistration(updated);
  });
}

export async function approveOrReject(
  regId: number,
  status: string,
  rejectionReason: string | undefined,
  approvedById: number,
  userRole: string,
) {
  const reg = await prisma.registration.findUnique({
    where: { id: regId },
    include: { event: true, student: true },
  });

  if (!reg) {
    throw new BusinessError(404, 'Không tìm thấy đăng ký');
  }

  const allowsApproval =
    userRole === 'ORGANIZER' ||
    userRole === 'organizer' ||
    userRole === 'ADMIN' ||
    userRole === 'admin' ||
    userRole === 'SUPER_ADMIN' ||
    userRole === 'superadmin';

  if (!allowsApproval) {
    throw new BusinessError(403, 'Bạn không có quyền duyệt đăng ký sự kiện này');
  }

  if (
    (userRole === 'ORGANIZER' || userRole === 'organizer') &&
    reg.event.organizerId !== approvedById
  ) {
    throw new BusinessError(403, 'Bạn không có quyền duyệt đăng ký sự kiện này');
  }

  const updatedStatus = status.toUpperCase() as RegistrationStatus;

  if (
    updatedStatus !== RegistrationStatus.APPROVED &&
    updatedStatus !== RegistrationStatus.CANCELLED
  ) {
    throw new BusinessError(400, 'Chỉ hỗ trợ duyệt hoặc từ chối đăng ký');
  }

  const updated = await prisma.$transaction(async (tx) => {
    const item = await tx.registration.update({
      where: { id: regId },
      data: {
        status: updatedStatus,
        approvedById,
        approvedAt: new Date(),
        rejectionReason:
          updatedStatus === RegistrationStatus.CANCELLED ? rejectionReason : null,
      },
      include: {
        event: true,
        student: { include: { class: true, faculty: true } },
      },
    });

    if (
      updatedStatus === RegistrationStatus.CANCELLED &&
      reg.status !== RegistrationStatus.CANCELLED &&
      reg.event.registeredCount > 0
    ) {
      await tx.workEvent.update({
        where: { id: reg.eventId },
        data: { registeredCount: { decrement: 1 } },
      });
    }

    if (updatedStatus === RegistrationStatus.APPROVED) {
      await tx.attendance.upsert({
        where: {
          eventId_studentId: {
            eventId: reg.eventId,
            studentId: reg.studentId,
          },
        },
        create: {
          eventId: reg.eventId,
          studentId: reg.studentId,
          status: AttendanceStatus.NOT_CHECKED,
        },
        update: {
          status: AttendanceStatus.NOT_CHECKED,
          checkInTime: null,
          checkOutTime: null,
        },
      });
    } else {
      await tx.attendance.deleteMany({
        where: { eventId: reg.eventId, studentId: reg.studentId },
      });
    }

    await tx.notification.create({
      data: {
        userId: reg.student.userId,
        type: 'REGISTRATION',
        title:
          updatedStatus === RegistrationStatus.APPROVED
            ? 'Đăng ký được phê duyệt'
            : 'Đăng ký bị từ chối',
        message:
          updatedStatus === RegistrationStatus.APPROVED
            ? `Đăng ký tham gia sự kiện "${reg.event.name}" của bạn đã được duyệt.`
            : `Đăng ký tham gia sự kiện "${reg.event.name}" của bạn bị từ chối. Lý do: ${
                rejectionReason || 'Không có'
              }`,
        link: '/student/my-registrations',
      },
    });

    return item;
  });

  return mapRegistration(updated);
}
