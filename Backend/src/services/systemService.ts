import bcrypt from 'bcrypt';
import { AccountStatus, UserRole } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { BusinessError } from '../utils/errors.js';
import { normalizeRole, toApiRole } from '../utils/roles.js';

function toId(value: unknown, fieldName = 'ID'): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new BusinessError(400, `${fieldName} không hợp lệ`);
  }
  return id;
}

function toAccountStatus(
  value: unknown,
  fallback: AccountStatus = AccountStatus.ACTIVE,
): AccountStatus {
  if (value === undefined || value === null || value === '') return fallback;
  const normalized = String(value).trim().toUpperCase();
  if (normalized === 'ACTIVE') return AccountStatus.ACTIVE;
  if (normalized === 'LOCKED') return AccountStatus.LOCKED;
  if (normalized === 'INACTIVE') return AccountStatus.INACTIVE;
  throw new BusinessError(400, 'Trạng thái tài khoản không hợp lệ');
}

function apiAccountStatus(value: AccountStatus): 'active' | 'locked' {
  return value === AccountStatus.ACTIVE ? 'active' : 'locked';
}

function mapFaculty(faculty: any) {
  return {
    id: String(faculty.id),
    name: faculty.name,
    code: faculty.code,
    deanName: faculty.deanName || '',
  };
}

function mapClass(item: any) {
  return {
    id: String(item.id),
    name: item.name,
    code: item.code,
    facultyId: String(item.facultyId),
    schoolYear: item.schoolYear,
  };
}

function mapStudent(student: any) {
  return {
    id: String(student.id),
    userId: String(student.userId),
    studentCode: student.studentCode,
    fullName: student.fullName,
    email: student.email,
    phone: student.phone || undefined,
    facultyId: String(student.facultyId),
    classId: String(student.classId),
    schoolYear: student.schoolYear,
    gender: String(student.gender || 'male').toLowerCase(),
    birthDate: student.birthDate ? student.birthDate.toISOString().split('T')[0] : undefined,
    hometown: student.hometown || undefined,
    status: apiAccountStatus(student.status),
    requiredWorkdays: student.requiredWorkdays,
    accumulatedWorkdays: student.accumulatedWorkdays,
    completedWorkdays: student.completedWorkdays,
    accountRole: student.user ? toApiRole(student.user.role) : 'student',
  };
}

function mapUser(user: any) {
  return {
    id: String(user.id),
    email: user.email,
    name: user.fullName,
    role: toApiRole(user.role),
    phone: user.phone || undefined,
    avatarUrl: user.avatarUrl || undefined,
    status: apiAccountStatus(user.status),
    createdAt: user.createdAt.toISOString(),
    lastLogin: user.lastLoginAt ? user.lastLoginAt.toISOString() : undefined,
  };
}

function mapActivityLog(log: any) {
  return {
    id: String(log.id),
    userId: String(log.userId),
    userName: log.user?.fullName || 'Không xác định',
    userRole: log.user ? toApiRole(log.user.role) : 'student',
    action: log.action,
    affectedItem: log.affectedItem,
    oldValue: log.oldValue || undefined,
    newValue: log.newValue || undefined,
    timestamp: log.timestamp.toISOString(),
    ipAddress: log.ipAddress || undefined,
  };
}

async function writeActivityLog(
  actorId: number,
  action: string,
  affectedItem: string,
  oldValue?: unknown,
  newValue?: unknown,
  ipAddress?: string,
) {
  await prisma.activityLog.create({
    data: {
      userId: actorId,
      action,
      affectedItem,
      oldValue: oldValue === undefined ? null : JSON.stringify(oldValue),
      newValue: newValue === undefined ? null : JSON.stringify(newValue),
      ipAddress: ipAddress || null,
    },
  });
}

async function validateFacultyAndClass(facultyIdValue: unknown, classIdValue: unknown) {
  const facultyId = toId(facultyIdValue, 'Khoa');
  const classId = toId(classIdValue, 'Lớp');
  const [faculty, classItem] = await Promise.all([
    prisma.faculty.findUnique({ where: { id: facultyId } }),
    prisma.class.findUnique({ where: { id: classId } }),
  ]);
  if (!faculty) throw new BusinessError(404, 'Không tìm thấy khoa');
  if (!classItem) throw new BusinessError(404, 'Không tìm thấy lớp');
  if (classItem.facultyId !== facultyId) {
    throw new BusinessError(400, 'Lớp đã chọn không thuộc khoa đã chọn');
  }
  return { facultyId, classId };
}

// FACULTIES
export async function listFaculties() {
  const list = await prisma.faculty.findMany({ orderBy: { name: 'asc' } });
  return list.map(mapFaculty);
}

export async function createFaculty(input: any, actorId: number, ipAddress?: string) {
  const name = String(input.name ?? '').trim();
  const code = String(input.code ?? '').trim().toUpperCase();
  const deanName = String(input.deanName ?? '').trim() || null;
  if (!name || !code) throw new BusinessError(400, 'Tên khoa và mã khoa là bắt buộc');
  if (deanName && deanName.length > 150) throw new BusinessError(400, 'Tên trưởng khoa tối đa 150 ký tự');

  const exists = await prisma.faculty.findUnique({ where: { code } });
  if (exists) throw new BusinessError(409, 'Mã khoa đã tồn tại');

  const faculty = await prisma.faculty.create({ data: { name, code, deanName } });
  await writeActivityLog(actorId, 'Thêm khoa', `${code} - ${name}`, undefined, mapFaculty(faculty), ipAddress);
  return mapFaculty(faculty);
}

export async function updateFaculty(idValue: unknown, input: any, actorId: number, ipAddress?: string) {
  const id = toId(idValue, 'Khoa');
  const existing = await prisma.faculty.findUnique({ where: { id } });
  if (!existing) throw new BusinessError(404, 'Không tìm thấy khoa');

  const name = input.name === undefined ? existing.name : String(input.name).trim();
  const code = input.code === undefined ? existing.code : String(input.code).trim().toUpperCase();
  const deanName = input.deanName === undefined ? existing.deanName : (String(input.deanName).trim() || null);
  if (!name || !code) throw new BusinessError(400, 'Tên khoa và mã khoa là bắt buộc');
  if (deanName && deanName.length > 150) throw new BusinessError(400, 'Tên trưởng khoa tối đa 150 ký tự');

  const duplicate = await prisma.faculty.findFirst({ where: { code, NOT: { id } } });
  if (duplicate) throw new BusinessError(409, 'Mã khoa đã tồn tại');

  const updated = await prisma.faculty.update({ where: { id }, data: { name, code, deanName } });
  await writeActivityLog(actorId, 'Cập nhật khoa', `${code} - ${name}`, mapFaculty(existing), mapFaculty(updated), ipAddress);
  return mapFaculty(updated);
}

export async function deleteFaculty(idValue: unknown, actorId: number, ipAddress?: string) {
  const id = toId(idValue, 'Khoa');
  const existing = await prisma.faculty.findUnique({
    where: { id },
    include: { _count: { select: { classes: true, students: true } } },
  });
  if (!existing) throw new BusinessError(404, 'Không tìm thấy khoa');
  if (existing._count.classes > 0 || existing._count.students > 0) {
    throw new BusinessError(409, 'Không thể xóa khoa đang có lớp hoặc sinh viên');
  }
  await prisma.faculty.delete({ where: { id } });
  await writeActivityLog(actorId, 'Xóa khoa', `${existing.code} - ${existing.name}`, mapFaculty(existing), undefined, ipAddress);
}

// CLASSES
export async function listClasses() {
  const list = await prisma.class.findMany({ orderBy: { name: 'asc' } });
  return list.map(mapClass);
}

export async function createClass(input: any, actorId: number, ipAddress?: string) {
  const name = String(input.name ?? '').trim();
  const code = String(input.code ?? '').trim().toUpperCase();
  const schoolYear = String(input.schoolYear ?? '').trim();
  const facultyId = toId(input.facultyId, 'Khoa');
  if (!name || !code || !schoolYear) throw new BusinessError(400, 'Tên lớp, mã lớp và khóa là bắt buộc');

  const [faculty, duplicate] = await Promise.all([
    prisma.faculty.findUnique({ where: { id: facultyId } }),
    prisma.class.findUnique({ where: { code } }),
  ]);
  if (!faculty) throw new BusinessError(404, 'Không tìm thấy khoa');
  if (duplicate) throw new BusinessError(409, 'Mã lớp đã tồn tại');

  const item = await prisma.class.create({ data: { name, code, schoolYear, facultyId } });
  await writeActivityLog(actorId, 'Thêm lớp', `${code} - ${name}`, undefined, mapClass(item), ipAddress);
  return mapClass(item);
}

export async function updateClass(idValue: unknown, input: any, actorId: number, ipAddress?: string) {
  const id = toId(idValue, 'Lớp');
  const existing = await prisma.class.findUnique({ where: { id } });
  if (!existing) throw new BusinessError(404, 'Không tìm thấy lớp');

  const name = input.name === undefined ? existing.name : String(input.name).trim();
  const code = input.code === undefined ? existing.code : String(input.code).trim().toUpperCase();
  const schoolYear = input.schoolYear === undefined ? existing.schoolYear : String(input.schoolYear).trim();
  const facultyId = input.facultyId === undefined ? existing.facultyId : toId(input.facultyId, 'Khoa');
  if (!name || !code || !schoolYear) throw new BusinessError(400, 'Tên lớp, mã lớp và khóa là bắt buộc');

  const [faculty, duplicate] = await Promise.all([
    prisma.faculty.findUnique({ where: { id: facultyId } }),
    prisma.class.findFirst({ where: { code, NOT: { id } } }),
  ]);
  if (!faculty) throw new BusinessError(404, 'Không tìm thấy khoa');
  if (duplicate) throw new BusinessError(409, 'Mã lớp đã tồn tại');

  const updated = await prisma.class.update({ where: { id }, data: { name, code, schoolYear, facultyId } });
  await writeActivityLog(actorId, 'Cập nhật lớp', `${code} - ${name}`, mapClass(existing), mapClass(updated), ipAddress);
  return mapClass(updated);
}

export async function deleteClass(idValue: unknown, actorId: number, ipAddress?: string) {
  const id = toId(idValue, 'Lớp');
  const existing = await prisma.class.findUnique({
    where: { id },
    include: { _count: { select: { students: true } } },
  });
  if (!existing) throw new BusinessError(404, 'Không tìm thấy lớp');
  if (existing._count.students > 0) throw new BusinessError(409, 'Không thể xóa lớp đang có sinh viên');

  await prisma.class.delete({ where: { id } });
  await writeActivityLog(actorId, 'Xóa lớp', `${existing.code} - ${existing.name}`, mapClass(existing), undefined, ipAddress);
}

// STUDENTS
export async function listStudents(viewerRole: UserRole, viewerStudentId?: number | null) {
  const where = viewerRole === UserRole.STUDENT
    ? { id: viewerStudentId || -1 }
    : undefined;
  const list = await prisma.student.findMany({
    where,
    include: { user: true },
    orderBy: { fullName: 'asc' },
  });
  return list.map(mapStudent);
}

export async function createStudent(input: any, actorId: number, ipAddress?: string) {
  const fullName = String(input.fullName ?? '').trim();
  const studentCode = String(input.studentCode ?? '').trim().toUpperCase();
  const email = String(input.email || `${studentCode.toLowerCase()}@student.dthu.edu.vn`).trim().toLowerCase();
  const schoolYear = String(input.schoolYear ?? '').trim();
  const gender = String(input.gender || 'male').trim().toLowerCase();
  if (!fullName || !studentCode || !schoolYear) {
    throw new BusinessError(400, 'Họ tên, mã sinh viên và khóa là bắt buộc');
  }
  if (!['male', 'female'].includes(gender)) throw new BusinessError(400, 'Giới tính không hợp lệ');

  const { facultyId, classId } = await validateFacultyAndClass(input.facultyId, input.classId);
  const duplicate = await prisma.student.findFirst({
    where: { OR: [{ studentCode }, { email }] },
  });
  const duplicateUser = await prisma.user.findUnique({ where: { email } });
  if (duplicate || duplicateUser) throw new BusinessError(409, 'Mã sinh viên hoặc email đã tồn tại');

  const settings = await prisma.systemSettings.findFirst();
  const passwordHash = await bcrypt.hash(process.env.DEFAULT_USER_PASSWORD || '123456', 10);
  const status = toAccountStatus(input.status);
  const birthDate = input.birthDate ? new Date(input.birthDate) : null;
  if (birthDate && Number.isNaN(birthDate.getTime())) throw new BusinessError(400, 'Ngày sinh không hợp lệ');

  const student = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        role: UserRole.STUDENT,
        status,
        phone: input.phone ? String(input.phone).trim() : null,
      },
    });
    return tx.student.create({
      data: {
        userId: user.id,
        studentCode,
        fullName,
        email,
        phone: input.phone ? String(input.phone).trim() : null,
        facultyId,
        classId,
        schoolYear,
        gender,
        birthDate,
        hometown: input.hometown ? String(input.hometown).trim() : null,
        status,
        // Chỉ tiêu ngày công là cấu hình chung, không cho từng hồ sơ ghi đè.
        requiredWorkdays: Number(settings?.defaultRequiredWorkdays ?? 12),
      },
    });
  });

  await writeActivityLog(actorId, 'Thêm sinh viên', `${studentCode} - ${fullName}`, undefined, mapStudent(student), ipAddress);
  return mapStudent(student);
}

export async function updateStudent(idValue: unknown, input: any, actorId: number, ipAddress?: string) {
  const id = toId(idValue, 'Sinh viên');
  const existing = await prisma.student.findUnique({ where: { id }, include: { user: true } });
  if (!existing) throw new BusinessError(404, 'Không tìm thấy sinh viên');

  const fullName = input.fullName === undefined ? existing.fullName : String(input.fullName).trim();
  const email = input.email === undefined ? existing.email : String(input.email).trim().toLowerCase();
  const schoolYear = input.schoolYear === undefined ? existing.schoolYear : String(input.schoolYear).trim();
  const gender = input.gender === undefined ? existing.gender : String(input.gender).trim().toLowerCase();
  const status = input.status === undefined ? existing.status : toAccountStatus(input.status, existing.status);
  if (!fullName || !email || !schoolYear) throw new BusinessError(400, 'Họ tên, email và khóa là bắt buộc');
  if (!['male', 'female'].includes(gender)) throw new BusinessError(400, 'Giới tính không hợp lệ');

  const { facultyId, classId } = await validateFacultyAndClass(
    input.facultyId === undefined ? existing.facultyId : input.facultyId,
    input.classId === undefined ? existing.classId : input.classId,
  );
  const duplicate = await prisma.student.findFirst({ where: { email, NOT: { id } } });
  const duplicateUser = await prisma.user.findFirst({ where: { email, NOT: { id: existing.userId } } });
  if (duplicate || duplicateUser) throw new BusinessError(409, 'Email đã tồn tại');

  const birthDate = input.birthDate === undefined
    ? existing.birthDate
    : input.birthDate
      ? new Date(input.birthDate)
      : null;
  if (birthDate && Number.isNaN(birthDate.getTime())) throw new BusinessError(400, 'Ngày sinh không hợp lệ');

  const settings = await prisma.systemSettings.findFirst();
  const updated = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: existing.userId },
      data: {
        fullName,
        email,
        phone: input.phone === undefined ? existing.phone : (input.phone ? String(input.phone).trim() : null),
        status,
      },
    });
    return tx.student.update({
      where: { id },
      data: {
        fullName,
        email,
        phone: input.phone === undefined ? existing.phone : (input.phone ? String(input.phone).trim() : null),
        facultyId,
        classId,
        schoolYear,
        gender,
        birthDate,
        hometown: input.hometown === undefined ? existing.hometown : (input.hometown ? String(input.hometown).trim() : null),
        status,
        // Giữ hồ sơ luôn đồng bộ với cấu hình hệ thống.
        requiredWorkdays: Number(settings?.defaultRequiredWorkdays ?? existing.requiredWorkdays),
      },
    });
  });

  await writeActivityLog(actorId, 'Cập nhật sinh viên', `${existing.studentCode} - ${fullName}`, mapStudent(existing), mapStudent(updated), ipAddress);
  return mapStudent(updated);
}

export async function deleteStudent(idValue: unknown, actorId: number, ipAddress?: string) {
  const id = toId(idValue, 'Sinh viên');
  const existing = await prisma.student.findUnique({ where: { id } });
  if (!existing) throw new BusinessError(404, 'Không tìm thấy sinh viên');

  await prisma.user.delete({ where: { id: existing.userId } });
  await writeActivityLog(actorId, 'Xóa sinh viên', `${existing.studentCode} - ${existing.fullName}`, mapStudent(existing), undefined, ipAddress);
}

// USERS (non-student accounts; student accounts are managed with the student module)
export async function listUsers() {
  const list = await prisma.user.findMany({
    where: { role: { not: UserRole.STUDENT } },
    orderBy: { fullName: 'asc' },
  });
  return list.map(mapUser);
}

export async function createUser(input: any, actorId: number, ipAddress?: string) {
  const name = String(input.name ?? input.fullName ?? '').trim();
  const email = String(input.email ?? '').trim().toLowerCase();
  const role = normalizeRole(input.role || 'ORGANIZER');
  if (role === UserRole.STUDENT) throw new BusinessError(400, 'Sinh viên phải được quản lý tại mô-đun sinh viên');
  if (!name || !email) throw new BusinessError(400, 'Họ tên và email là bắt buộc');
  const duplicate = await prisma.user.findUnique({ where: { email } });
  if (duplicate) throw new BusinessError(409, 'Email đã tồn tại');

  const password = String(input.password || process.env.DEFAULT_USER_PASSWORD || '123456');
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      fullName: name,
      email,
      passwordHash,
      role,
      status: toAccountStatus(input.status),
      phone: input.phone ? String(input.phone).trim() : null,
    },
  });
  await writeActivityLog(actorId, 'Thêm người dùng', `${name} (${email})`, undefined, mapUser(user), ipAddress);
  return mapUser(user);
}

export async function updateUser(idValue: unknown, input: any, actorId: number, ipAddress?: string) {
  const id = toId(idValue, 'Người dùng');
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new BusinessError(404, 'Không tìm thấy người dùng');

  const fullName = input.name === undefined && input.fullName === undefined
    ? existing.fullName
    : String(input.name ?? input.fullName).trim();
  const email = input.email === undefined ? existing.email : String(input.email).trim().toLowerCase();
  const role = input.role === undefined ? existing.role : normalizeRole(input.role);
  if (role === UserRole.STUDENT) throw new BusinessError(400, 'Vai trò sinh viên phải được quản lý tại mô-đun sinh viên');
  if (!fullName || !email) throw new BusinessError(400, 'Họ tên và email là bắt buộc');

  const duplicate = await prisma.user.findFirst({ where: { email, NOT: { id } } });
  if (duplicate) throw new BusinessError(409, 'Email đã tồn tại');

  const data: any = {
    fullName,
    email,
    role,
    status: input.status === undefined ? existing.status : toAccountStatus(input.status, existing.status),
    phone: input.phone === undefined ? existing.phone : (input.phone ? String(input.phone).trim() : null),
  };
  if (input.password) {
    const password = String(input.password);
    if (password.length < 6 || password.length > 128) {
      throw new BusinessError(400, 'Mật khẩu phải có từ 6 đến 128 ký tự');
    }
    data.passwordHash = await bcrypt.hash(password, 10);
  }

  const updated = await prisma.user.update({ where: { id }, data });
  await writeActivityLog(actorId, 'Cập nhật người dùng', `${fullName} (${email})`, mapUser(existing), mapUser(updated), ipAddress);
  return mapUser(updated);
}

export async function deleteUser(idValue: unknown, actorId: number, ipAddress?: string) {
  const id = toId(idValue, 'Người dùng');
  if (id === actorId) throw new BusinessError(400, 'Không thể tự xóa tài khoản đang đăng nhập');
  const existing = await prisma.user.findUnique({
    where: { id },
    include: { _count: { select: { eventsManaged: true } } },
  });
  if (!existing) throw new BusinessError(404, 'Không tìm thấy người dùng');
  if (existing.role === UserRole.STUDENT) throw new BusinessError(400, 'Hãy quản lý tài khoản này tại trang Sinh viên');
  if (existing._count.eventsManaged > 0) {
    throw new BusinessError(409, 'Không thể xóa người phụ trách đang có sự kiện');
  }

  await prisma.user.delete({ where: { id } });
  await writeActivityLog(actorId, 'Xóa người dùng', `${existing.fullName} (${existing.email})`, mapUser(existing), undefined, ipAddress);
}

// SETTINGS, SEMESTERS, ACTIVITY LOGS
export async function getSystemConfig() {
  const settings = await prisma.systemSettings.findFirst();
  if (settings) {
    const { id: _id, ...data } = settings;
    return data;
  }
  const created = await prisma.systemSettings.create({ data: {} });
  const { id: _id, ...data } = created;
  return data;
}

export async function updateSystemConfig(settingsData: any, actorId: number, ipAddress?: string) {
  const existing = await prisma.systemSettings.findFirst();
  const data = {
    siteName: String(settingsData.siteName ?? existing?.siteName ?? 'DThU Workday').trim(),
    supportEmail: String(settingsData.supportEmail ?? existing?.supportEmail ?? 'workday@dthu.edu.vn').trim(),
    supportPhone: String(settingsData.supportPhone ?? existing?.supportPhone ?? '02776543210').trim(),
    defaultRequiredWorkdays: Number(settingsData.defaultRequiredWorkdays ?? existing?.defaultRequiredWorkdays ?? 12),
    maxConcurrentRegistrations: Number(settingsData.maxConcurrentRegistrations ?? existing?.maxConcurrentRegistrations ?? 3),
    maintenanceMode: Boolean(settingsData.maintenanceMode ?? existing?.maintenanceMode ?? false),
  };
  if (!Number.isInteger(data.defaultRequiredWorkdays) || data.defaultRequiredWorkdays <= 0) {
    throw new BusinessError(400, 'Ngày công yêu cầu phải là số nguyên dương');
  }
  if (!Number.isInteger(data.maxConcurrentRegistrations) || data.maxConcurrentRegistrations <= 0) {
    throw new BusinessError(400, 'Số đăng ký đồng thời phải là số nguyên dương');
  }

  const settings = await prisma.$transaction(async (tx) => {
    const saved = existing
      ? await tx.systemSettings.update({ where: { id: existing.id }, data })
      : await tx.systemSettings.create({ data });

  // Cấu hình ngày công là chỉ tiêu chung cho toàn hệ thống. Đồng bộ trường
  // hồ sơ để các màn hình quản trị, báo cáo và CSV cùng một giá trị.
    await tx.student.updateMany({
      data: { requiredWorkdays: data.defaultRequiredWorkdays },
    });
    await tx.semesterConfig.updateMany({
      where: { isActive: true },
      data: { requiredWorkdays: data.defaultRequiredWorkdays },
    });
    return saved;
  });

  const { id: _id, ...result } = settings;
  await writeActivityLog(actorId, 'Cập nhật cài đặt hệ thống', 'System Settings', existing, result, ipAddress);
  return result;
}

export async function listSemesters() {
  const list = await prisma.semesterConfig.findMany({ orderBy: [{ schoolYear: 'desc' }, { startDate: 'desc' }] });
  return list.map(mapSemester);
}

function mapSemester(item: any) {
  return {
    id: String(item.id),
    name: item.name,
    schoolYear: item.schoolYear,
    startDate: item.startDate.toISOString().split('T')[0],
    endDate: item.endDate.toISOString().split('T')[0],
    requiredWorkdays: item.requiredWorkdays,
    isActive: item.isActive,
  };
}

function semesterData(input: any, existing?: any) {
  const name = String(input.name ?? existing?.name ?? '').trim();
  const schoolYear = String(input.schoolYear ?? existing?.schoolYear ?? '').trim();
  const startDate = input.startDate === undefined && existing ? existing.startDate : new Date(input.startDate);
  const endDate = input.endDate === undefined && existing ? existing.endDate : new Date(input.endDate);
  const requiredWorkdays = Number(input.requiredWorkdays ?? existing?.requiredWorkdays);

  if (!name || !schoolYear) throw new BusinessError(400, 'Tên học kỳ và năm học là bắt buộc');
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new BusinessError(400, 'Thời gian học kỳ không hợp lệ');
  }
  if (endDate < startDate) throw new BusinessError(400, 'Ngày kết thúc phải sau ngày bắt đầu');
  if (!Number.isInteger(requiredWorkdays) || requiredWorkdays <= 0) {
    throw new BusinessError(400, 'Chỉ tiêu ngày công phải là số nguyên dương');
  }
  return { name, schoolYear, startDate, endDate, requiredWorkdays };
}

async function syncActiveSemesterTarget(tx: any, requiredWorkdays: number) {
  const settings = await tx.systemSettings.findFirst();
  if (settings) {
    await tx.systemSettings.update({
      where: { id: settings.id },
      data: { defaultRequiredWorkdays: requiredWorkdays },
    });
  } else {
    await tx.systemSettings.create({ data: { defaultRequiredWorkdays: requiredWorkdays } });
  }
  await tx.student.updateMany({ data: { requiredWorkdays } });
}

export async function createSemester(input: any, actorId: number, ipAddress?: string) {
  const data = semesterData(input);
  const semesterCount = await prisma.semesterConfig.count();
  const isActive = Boolean(input.isActive) || semesterCount === 0;
  const created = await prisma.$transaction(async (tx) => {
    if (isActive) await tx.semesterConfig.updateMany({ data: { isActive: false } });
    const item = await tx.semesterConfig.create({ data: { ...data, isActive } });
    if (isActive) await syncActiveSemesterTarget(tx, data.requiredWorkdays);
    return item;
  });
  await writeActivityLog(actorId, 'Thêm học kỳ', `${data.name} ${data.schoolYear}`, undefined, mapSemester(created), ipAddress);
  return mapSemester(created);
}

export async function updateSemester(idValue: unknown, input: any, actorId: number, ipAddress?: string) {
  const id = toId(idValue, 'Học kỳ');
  const existing = await prisma.semesterConfig.findUnique({ where: { id } });
  if (!existing) throw new BusinessError(404, 'Không tìm thấy học kỳ');
  if (existing.isActive && input.isActive === false) {
    throw new BusinessError(400, 'Hãy kích hoạt học kỳ khác thay vì tắt học kỳ hiện tại');
  }

  const data = semesterData(input, existing);
  const isActive = input.isActive === undefined ? existing.isActive : Boolean(input.isActive);
  const updated = await prisma.$transaction(async (tx) => {
    if (isActive) await tx.semesterConfig.updateMany({ where: { id: { not: id } }, data: { isActive: false } });
    const item = await tx.semesterConfig.update({ where: { id }, data: { ...data, isActive } });
    if (isActive) await syncActiveSemesterTarget(tx, data.requiredWorkdays);
    return item;
  });
  await writeActivityLog(actorId, 'Cập nhật học kỳ', `${data.name} ${data.schoolYear}`, mapSemester(existing), mapSemester(updated), ipAddress);
  return mapSemester(updated);
}

export async function activateSemester(idValue: unknown, actorId: number, ipAddress?: string) {
  const id = toId(idValue, 'Học kỳ');
  const existing = await prisma.semesterConfig.findUnique({ where: { id } });
  if (!existing) throw new BusinessError(404, 'Không tìm thấy học kỳ');

  const activated = await prisma.$transaction(async (tx) => {
    await tx.semesterConfig.updateMany({ data: { isActive: false } });
    const item = await tx.semesterConfig.update({ where: { id }, data: { isActive: true } });
    await syncActiveSemesterTarget(tx, item.requiredWorkdays);
    return item;
  });
  await writeActivityLog(actorId, 'Kích hoạt học kỳ', `${existing.name} ${existing.schoolYear}`, mapSemester(existing), mapSemester(activated), ipAddress);
  return mapSemester(activated);
}

export async function deleteSemester(idValue: unknown, actorId: number, ipAddress?: string) {
  const id = toId(idValue, 'Học kỳ');
  const existing = await prisma.semesterConfig.findUnique({
    where: { id },
    include: { _count: { select: { workCredits: true } } },
  });
  if (!existing) throw new BusinessError(404, 'Không tìm thấy học kỳ');
  if (existing.isActive) throw new BusinessError(400, 'Không thể xóa học kỳ hiện tại');
  if (existing._count.workCredits > 0) throw new BusinessError(409, 'Không thể xóa học kỳ đã có dữ liệu ngày công');
  await prisma.semesterConfig.delete({ where: { id } });
  await writeActivityLog(actorId, 'Xóa học kỳ', `${existing.name} ${existing.schoolYear}`, mapSemester(existing), undefined, ipAddress);
}

export async function listActivityLogs() {
  const list = await prisma.activityLog.findMany({
    include: { user: true },
    orderBy: { timestamp: 'desc' },
    take: 1000,
  });
  return list.map(mapActivityLog);
}
