import { prisma } from '../config/prisma.js';
import { BusinessError } from '../utils/errors.js';
import { RegistrationStatus, AttendanceStatus } from '@prisma/client';

function mapRegistration(r: any) {
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
    notes: r.notes || undefined,
  };
}

export async function listRegistrations(filters: { studentId?: string, eventId?: string, status?: string }, userRole: string, currentStudentId: number | null) {
  let whereClause: any = {};

  if (userRole === 'STUDENT') {
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
      event: true,
      student: {
        include: {
          class: true,
          faculty: true,
        }
      }
    },
    orderBy: {
      registeredAt: 'desc',
    }
  });

  return regs.map(mapRegistration);
}

export async function createRegistration(eventId: number, studentId: number) {
  return await prisma.$transaction(async (tx: any) => {
    // 1. Kiểm tra sự kiện
    const event = await tx.workEvent.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new BusinessError(404, 'Sự kiện không tồn tại');
    }

    if (event.status !== 'OPEN') {
      throw new BusinessError(400, 'Sự kiện chưa mở hoặc đã kết thúc đăng ký');
    }

    // 2. Kiểm tra thời hạn đăng ký
    const now = new Date();
    if (now < event.registrationOpen || now > event.registrationClose) {
      throw new BusinessError(400, 'Thời gian đăng ký không hợp lệ (đã quá hạn hoặc chưa mở)');
    }

    // 3. Kiểm tra số lượng tối đa
    if (event.registeredCount >= event.maxCapacity) {
      throw new BusinessError(400, 'Sự kiện đã đủ số lượng sinh viên tham gia');
    }

    // 4. Kiểm tra sinh viên đã đăng ký chưa
    const existingReg = await tx.registration.findUnique({
      where: {
        eventId_studentId: {
          eventId,
          studentId,
        }
      }
    });

    if (existingReg && existingReg.status !== 'CANCELLED') {
      throw new BusinessError(400, 'Bạn đã đăng ký sự kiện này rồi');
    }

    // 5. Kiểm tra tính hợp lệ về Khoa/Lớp của Sinh viên
    const student = await tx.student.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      throw new BusinessError(404, 'Hồ sơ sinh viên không tồn tại');
    }

    const eligibleFaculties = JSON.parse(event.eligibleFacultyIds || '[]');
    if (eligibleFaculties.length > 0 && !eligibleFaculties.includes(String(student.facultyId))) {
      throw new BusinessError(400, 'Sự kiện này không áp dụng cho Khoa của bạn');
    }

    // 6. Cập nhật số lượng đăng ký của sự kiện
    await tx.workEvent.update({
      where: { id: eventId },
      data: { registeredCount: { increment: 1 } }
    });

    // 7. Tạo bản ghi đăng ký mới (hoặc cập nhật bản ghi đã hủy trước đó)
    let registration;
    if (existingReg) {
      registration = await tx.registration.update({
        where: { id: existingReg.id },
        data: {
          status: RegistrationStatus.PENDING,
          registeredAt: new Date(),
          rejectionReason: null,
        },
        include: {
          event: true,
          student: { include: { class: true, faculty: true } }
        }
      });
    } else {
      registration = await tx.registration.create({
        data: {
          eventId,
          studentId,
          status: RegistrationStatus.PENDING,
        },
        include: {
          event: true,
          student: { include: { class: true, faculty: true } }
        }
      });
    }

    // 8. Tự động tạo bản ghi điểm danh với trạng thái NOT_CHECKED
    await tx.attendance.upsert({
      where: {
        eventId_studentId: {
          eventId,
          studentId,
        }
      },
      create: {
        eventId,
        studentId,
        status: AttendanceStatus.NOT_CHECKED,
      },
      update: {
        status: AttendanceStatus.NOT_CHECKED,
        checkInTime: null,
        checkOutTime: null,
      }
    });

    return mapRegistration(registration);
  });
}

export async function cancelRegistration(regId: number, studentId: number) {
  return await prisma.$transaction(async (tx: any) => {
    const reg = await tx.registration.findUnique({
      where: { id: regId },
      include: { event: true }
    });

    if (!reg || reg.studentId !== studentId) {
      throw new BusinessError(404, 'Không tìm thấy bản ghi đăng ký của bạn');
    }

    if (reg.status === 'CANCELLED') {
      throw new BusinessError(400, 'Đăng ký này đã được hủy trước đó');
    }

    const now = new Date();
    if (now > reg.event.cancellationDeadline) {
      throw new BusinessError(400, 'Đã quá thời hạn hủy đăng ký sự kiện này');
    }

    // Giảm registeredCount
    await tx.workEvent.update({
      where: { id: reg.eventId },
      data: { registeredCount: { decrement: 1 } }
    });

    // Cập nhật trạng thái đăng ký thành CANCELLED
    const updated = await tx.registration.update({
      where: { id: regId },
      data: { status: RegistrationStatus.CANCELLED },
      include: {
        event: true,
        student: { include: { class: true, faculty: true } }
      }
    });

    // Hủy bản ghi điểm danh
    await tx.attendance.delete({
      where: {
        eventId_studentId: {
          eventId: reg.eventId,
          studentId: reg.studentId
        }
      }
    });

    return mapRegistration(updated);
  });
}

export async function approveOrReject(regId: number, status: string, rejectionReason: string | undefined, approvedById: number, userRole: string) {
  const reg = await prisma.registration.findUnique({
    where: { id: regId },
    include: { event: true, student: true }
  });

  if (!reg) {
    throw new BusinessError(404, 'Không tìm thấy đăng ký');
  }

  if (userRole === 'ORGANIZER' && reg.event.organizerId !== approvedById) {
    throw new BusinessError(403, 'Bạn không có quyền duyệt đăng ký sự kiện này');
  }

  const updatedStatus = status.toUpperCase() as RegistrationStatus;

  const updated = await prisma.registration.update({
    where: { id: regId },
    data: {
      status: updatedStatus,
      approvedById,
      approvedAt: new Date(),
      rejectionReason: updatedStatus === 'CANCELLED' || updatedStatus === 'ABSENT' ? rejectionReason : null,
    },
    include: {
      event: true,
      student: { include: { class: true, faculty: true } }
    }
  });

  // Tạo thông báo cho sinh viên
  await prisma.notification.create({
    data: {
      userId: reg.student.userId,
      type: 'REGISTRATION',
      title: updatedStatus === 'APPROVED' ? 'Đăng ký được phê duyệt' : 'Đăng ký bị từ chối',
      message: updatedStatus === 'APPROVED' 
        ? `Đăng ký tham gia sự kiện "${reg.event.name}" của bạn đã được duyệt.`
        : `Đăng ký tham gia sự kiện "${reg.event.name}" của bạn bị từ chối. Lý do: ${rejectionReason || 'Không có'}`,
      link: '/student/my-registrations',
    }
  });

  return mapRegistration(updated);
}
