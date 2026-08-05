import { EventStatus, RegistrationStatus, UserRole, WorkShift } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { BusinessError } from '../utils/errors.js';
import { isStudentLikeRole } from '../utils/roles.js';

function parseJsonArray(value: string | null): string[] {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

async function syncEventLifecycle(now = new Date()) {
  await prisma.$transaction([
    prisma.workEvent.updateMany({
      where: {
        status: EventStatus.APPROVED,
        registrationOpen: { lte: now },
        registrationClose: { gte: now },
      },
      data: { status: EventStatus.OPEN },
    }),
    prisma.workEvent.updateMany({
      where: {
        status: { in: [EventStatus.APPROVED, EventStatus.OPEN] },
        registrationClose: { lt: now },
      },
      data: { status: EventStatus.UPCOMING },
    }),
  ]);
}

function mapEvent(event: any) {
  return {
    id: String(event.id),
    code: event.code,
    name: event.name,
    description: event.description,
    workContent: event.workContent,
    location: event.location,
    date: event.date.toISOString().split('T')[0],
    startTime: event.startTime,
    endTime: event.endTime,
    shift: event.shift.toLowerCase(),
    registrationOpen: event.registrationOpen.toISOString(),
    registrationClose: event.registrationClose.toISOString(),
    cancellationDeadline: event.cancellationDeadline.toISOString(),
    maxCapacity: event.maxCapacity,
    registeredCount: event._count?.registrations ?? event.registeredCount,
    workdayCredit: event.workdayCredit,
    eligibleFacultyIds: parseJsonArray(event.eligibleFacultyIds),
    eligibleClassIds: parseJsonArray(event.eligibleClassIds),
    eligibleSchoolYears: parseJsonArray(event.eligibleSchoolYears),
    clothingRequirements: event.clothingRequirements || '',
    equipmentRequirements: event.equipmentRequirements || '',
    contactPerson: event.contactPerson,
    contactPhone: event.contactPhone,
    organizerId: String(event.organizerId),
    organizerName: event.organizer?.fullName || 'Ban Tổ Chức',
    status: event.status.toLowerCase(),
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
}

function eventDateTime(date: string, time: string): Date {
  const value = new Date(`${date}T${time || '00:00'}:00`);
  if (Number.isNaN(value.getTime())) throw new BusinessError(400, 'Ngày hoặc giờ sự kiện không hợp lệ');
  return value;
}

const SHIFT_TIMES: Record<WorkShift, { start: string; end: string }> = {
  MORNING: { start: '07:00', end: '10:00' },
  AFTERNOON: { start: '13:00', end: '16:00' },
  EVENING: { start: '17:00', end: '18:30' },
  FULLDAY: { start: '07:00', end: '18:30' },
};

function validateAndNormalizeEvent(input: any) {
  const name = String(input.name ?? '').trim();
  const location = String(input.location ?? '').trim();
  const workContent = String(input.workContent ?? '').trim();
  const date = String(input.date ?? '').trim();
  const shift = String(input.shift || 'morning').toUpperCase() as WorkShift;
  const shiftTimes = SHIFT_TIMES[shift] || SHIFT_TIMES.MORNING;
  const startTime = String(input.startTime || shiftTimes.start);
  const endTime = String(input.endTime || shiftTimes.end);
  if (!name || !location || !workContent || !date) {
    throw new BusinessError(400, 'Tên sự kiện, địa điểm, nội dung công việc và ngày tổ chức là bắt buộc');
  }

  const start = eventDateTime(date, startTime);
  const end = eventDateTime(date, endTime);
  if (end <= start) throw new BusinessError(400, 'Giờ kết thúc phải sau giờ bắt đầu');
  if (start <= new Date()) throw new BusinessError(400, 'Thời gian tổ chức phải ở tương lai');

  const registrationOpen = input.registrationOpen ? new Date(input.registrationOpen) : new Date();
  const registrationClose = input.registrationClose
    ? new Date(input.registrationClose)
    : new Date(start.getTime() - 60 * 60 * 1000);
  const cancellationDeadline = input.cancellationDeadline
    ? new Date(input.cancellationDeadline)
    : new Date(registrationClose);

  if ([registrationOpen, registrationClose, cancellationDeadline].some((value) => Number.isNaN(value.getTime()))) {
    throw new BusinessError(400, 'Thời gian đăng ký hoặc hạn hủy không hợp lệ');
  }
  if (registrationClose <= registrationOpen) {
    throw new BusinessError(400, 'Thời gian đóng đăng ký phải sau thời gian mở đăng ký');
  }
  if (registrationClose >= start) {
    throw new BusinessError(400, 'Thời gian đóng đăng ký phải trước lúc sự kiện bắt đầu');
  }
  if (cancellationDeadline > start) {
    throw new BusinessError(400, 'Hạn hủy đăng ký không được sau lúc sự kiện bắt đầu');
  }

  const maxCapacity = Number(input.maxCapacity || 30);
  const workdayCredit = Number(input.workdayCredit || 1);
  if (!Number.isInteger(maxCapacity) || maxCapacity <= 0) throw new BusinessError(400, 'Sức chứa phải là số nguyên dương');
  if (!Number.isFinite(workdayCredit) || workdayCredit <= 0) throw new BusinessError(400, 'Ngày công phải lớn hơn 0');

  return {
    name,
    description: String(input.description ?? ''),
    workContent,
    location,
    date: new Date(date),
    startTime,
    endTime,
    shift,
    registrationOpen,
    registrationClose,
    cancellationDeadline,
    maxCapacity,
    workdayCredit,
    eligibleFacultyIds: JSON.stringify((input.eligibleFacultyIds || []).map(String)),
    eligibleClassIds: JSON.stringify((input.eligibleClassIds || []).map(String)),
    eligibleSchoolYears: JSON.stringify((input.eligibleSchoolYears || []).map(String)),
    clothingRequirements: String(input.clothingRequirements ?? ''),
    equipmentRequirements: String(input.equipmentRequirements ?? ''),
    contactPerson: String(input.contactPerson ?? '').trim() || 'Ban Tổ Chức',
    contactPhone: String(input.contactPhone ?? '').trim(),
  };
}

export async function getAllEvents(
  filters: { status?: string; shift?: string; faculty?: string; search?: string },
  viewer?: { role: UserRole; id: number; studentId?: number | null },
) {
  await syncEventLifecycle();

  const where: any = {};
  if (viewer?.role === UserRole.ORGANIZER) where.organizerId = viewer.id;
  if (viewer && isStudentLikeRole(viewer.role)) {
    where.status = { in: [EventStatus.APPROVED, EventStatus.OPEN, EventStatus.UPCOMING, EventStatus.ONGOING, EventStatus.COMPLETED, EventStatus.CANCELLED] };
  } else if (filters.status && filters.status !== 'all') {
    where.status = String(filters.status).toUpperCase() as EventStatus;
  }
  if (filters.shift && filters.shift !== 'all') where.shift = String(filters.shift).toUpperCase() as WorkShift;

  const dbEvents = await prisma.workEvent.findMany({
    where,
    include: {
      organizer: true,
      _count: {
        select: {
          registrations: {
            where: { status: { not: RegistrationStatus.CANCELLED } },
          },
        },
      },
    },
    orderBy: { date: 'desc' },
  });
  let result = dbEvents.map(mapEvent);

  if (viewer && isStudentLikeRole(viewer.role) && viewer.studentId) {
    const student = await prisma.student.findUnique({ where: { id: viewer.studentId } });
    if (student) {
      result = result.filter((event) => {
        const facultyOk = event.eligibleFacultyIds.length === 0 || event.eligibleFacultyIds.includes(String(student.facultyId));
        const classOk = event.eligibleClassIds.length === 0 || event.eligibleClassIds.includes(String(student.classId));
        const yearOk = event.eligibleSchoolYears.length === 0 || event.eligibleSchoolYears.includes(student.schoolYear);
        return facultyOk && classOk && yearOk;
      });
    }
  }

  if (filters.faculty && filters.faculty !== 'all') {
    result = result.filter((event) => event.eligibleFacultyIds.length === 0 || event.eligibleFacultyIds.includes(String(filters.faculty)));
  }
  if (filters.search) {
    const query = filters.search.toLowerCase();
    result = result.filter((event) => event.name.toLowerCase().includes(query) || event.location.toLowerCase().includes(query));
  }
  return result;
}

export async function getEventDetail(
  id: number,
  viewer: { role: UserRole; id: number; studentId?: number | null },
) {
  await syncEventLifecycle();
  const event = await prisma.workEvent.findUnique({
    where: { id },
    include: {
      organizer: true,
      _count: {
        select: {
          registrations: {
            where: { status: { not: RegistrationStatus.CANCELLED } },
          },
        },
      },
    },
  });
  if (!event) throw new BusinessError(404, 'Không tìm thấy sự kiện');

  if (viewer.role === UserRole.ORGANIZER && event.organizerId !== viewer.id) {
    throw new BusinessError(403, 'Bạn không được xem sự kiện của đơn vị khác');
  }

  const mapped = mapEvent(event);
  if (isStudentLikeRole(viewer.role)) {
    const visibleStatuses: EventStatus[] = [
      EventStatus.APPROVED,
      EventStatus.OPEN,
      EventStatus.UPCOMING,
      EventStatus.ONGOING,
      EventStatus.COMPLETED,
      EventStatus.CANCELLED,
    ];
    if (!visibleStatuses.includes(event.status)) {
      throw new BusinessError(404, 'Không tìm thấy sự kiện');
    }
    if (!viewer.studentId) throw new BusinessError(403, 'Tài khoản chưa có hồ sơ sinh viên');
    const student = await prisma.student.findUnique({ where: { id: viewer.studentId } });
    if (!student) throw new BusinessError(403, 'Không tìm thấy hồ sơ sinh viên');
    const eligible =
      (mapped.eligibleFacultyIds.length === 0 || mapped.eligibleFacultyIds.includes(String(student.facultyId))) &&
      (mapped.eligibleClassIds.length === 0 || mapped.eligibleClassIds.includes(String(student.classId))) &&
      (mapped.eligibleSchoolYears.length === 0 || mapped.eligibleSchoolYears.includes(student.schoolYear));
    if (!eligible) throw new BusinessError(403, 'Bạn không thuộc đối tượng của sự kiện này');
  }

  return mapped;
}

export async function createNewEvent(eventData: any, organizerId: number) {
  const data = validateAndNormalizeEvent(eventData);
  const event = await prisma.$transaction(async (tx) => {
    const created = await tx.workEvent.create({
      data: {
        ...data,
        code: `WD-${data.date.getFullYear()}-${String(Date.now()).slice(-6)}`,
        organizerId,
        status: EventStatus.PENDING,
      },
      include: { organizer: true },
    });
    const admins = await tx.user.findMany({ where: { role: { in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] } } });
    if (admins.length > 0) {
      await tx.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: 'EVENT' as const,
          title: 'Sự kiện mới chờ duyệt',
          message: `Sự kiện "${created.name}" đang chờ phê duyệt.`,
          link: '/admin/event-approvals',
        })),
      });
    }
    await tx.activityLog.create({
      data: {
        userId: organizerId,
        action: 'Tạo sự kiện',
        affectedItem: created.name,
        newValue: JSON.stringify({ id: created.id, code: created.code, status: created.status }),
      },
    });
    return created;
  });
  return mapEvent(event);
}

export async function updateEventDetail(id: number, updateData: any, userRole: string, userId: number) {
  const existing = await prisma.workEvent.findUnique({ where: { id } });
  if (!existing) throw new BusinessError(404, 'Không tìm thấy sự kiện');
  if (userRole === UserRole.ORGANIZER && existing.organizerId !== userId) {
    throw new BusinessError(403, 'Bạn không được phép sửa sự kiện của người khác');
  }

  const data: any = {};
  const stringFields = [
    'name', 'description', 'workContent', 'location', 'startTime', 'endTime',
    'clothingRequirements', 'equipmentRequirements', 'contactPerson', 'contactPhone',
  ];
  for (const field of stringFields) if (updateData[field] !== undefined) data[field] = String(updateData[field]);
  if (updateData.shift) data.shift = String(updateData.shift).toUpperCase() as WorkShift;
  if (updateData.date) data.date = new Date(updateData.date);
  if (updateData.registrationOpen) data.registrationOpen = new Date(updateData.registrationOpen);
  if (updateData.registrationClose) data.registrationClose = new Date(updateData.registrationClose);
  if (updateData.cancellationDeadline) data.cancellationDeadline = new Date(updateData.cancellationDeadline);
  if (updateData.maxCapacity !== undefined) data.maxCapacity = Number(updateData.maxCapacity);
  if (updateData.workdayCredit !== undefined) data.workdayCredit = Number(updateData.workdayCredit);
  if (updateData.status) data.status = String(updateData.status).toUpperCase() as EventStatus;
  if (updateData.eligibleFacultyIds) data.eligibleFacultyIds = JSON.stringify(updateData.eligibleFacultyIds.map(String));
  if (updateData.eligibleClassIds) data.eligibleClassIds = JSON.stringify(updateData.eligibleClassIds.map(String));
  if (updateData.eligibleSchoolYears) data.eligibleSchoolYears = JSON.stringify(updateData.eligibleSchoolYears.map(String));

  const updated = await prisma.$transaction(async (tx) => {
    const item = await tx.workEvent.update({ where: { id }, data, include: { organizer: true } });
    if (data.status && data.status !== existing.status) {
      await tx.notification.create({
        data: {
          userId: existing.organizerId,
          type: 'EVENT',
          title: data.status === EventStatus.APPROVED ? 'Sự kiện được duyệt' : data.status === EventStatus.REJECTED ? 'Sự kiện bị từ chối' : 'Trạng thái sự kiện được cập nhật',
          message: `Sự kiện "${existing.name}" đã chuyển sang trạng thái ${String(data.status).toLowerCase()}.`,
          link: '/organizer/events',
        },
      });
    }
    await tx.activityLog.create({
      data: {
        userId,
        action: data.status && data.status !== existing.status ? 'Cập nhật trạng thái sự kiện' : 'Chỉnh sửa sự kiện',
        affectedItem: existing.name,
        oldValue: JSON.stringify({ status: existing.status }),
        newValue: JSON.stringify({ status: item.status }),
      },
    });
    return item;
  });
  return mapEvent(updated);
}


export async function openRegistration(
  id: number,
  userRole: string,
  userId: number,
) {
  const existing = await prisma.workEvent.findUnique({
    where: { id },
    include: { organizer: true },
  });

  if (!existing) {
    throw new BusinessError(404, 'Không tìm thấy sự kiện');
  }

  if (
    (userRole === UserRole.ORGANIZER || userRole === 'ORGANIZER') &&
    existing.organizerId !== userId
  ) {
    throw new BusinessError(
      403,
      'Bạn không được phép mở đăng ký cho sự kiện của người khác',
    );
  }

  if (existing.status === EventStatus.OPEN) {
    return mapEvent(existing);
  }

  if (existing.status !== EventStatus.APPROVED) {
    throw new BusinessError(
      400,
      'Chỉ sự kiện đã được duyệt mới có thể mở đăng ký',
    );
  }

  const now = new Date();

  if (existing.registrationClose <= now) {
    throw new BusinessError(
      400,
      'Thời gian đóng đăng ký đã qua. Hãy chỉnh lại thời gian đăng ký trước khi mở',
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const item = await tx.workEvent.update({
      where: { id },
      data: {
        status: EventStatus.OPEN,
        registrationOpen: existing.registrationOpen > now ? now : existing.registrationOpen,
      },
      include: { organizer: true },
    });
    await tx.activityLog.create({
      data: {
        userId,
        action: 'Mở đăng ký sự kiện',
        affectedItem: existing.name,
        oldValue: existing.status,
        newValue: EventStatus.OPEN,
      },
    });
    return item;
  });

  return mapEvent(updated);
}
