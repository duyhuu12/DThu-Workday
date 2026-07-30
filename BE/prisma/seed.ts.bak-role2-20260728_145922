import '../src/config/env.js';
import bcrypt from 'bcrypt';
import { prisma } from '../src/config/prisma.js';
import { UserRole, AccountStatus, WorkShift, EventStatus, RegistrationStatus, AttendanceStatus, CreditStatus, ComplaintType, ComplaintStatus, ComplaintPriority, NotificationType } from '@prisma/client';


async function main() {
  if (process.env.ALLOW_DATABASE_SEED !== 'true') {
    throw new Error('Seed có thể xóa dữ liệu hiện có. Hãy đặt ALLOW_DATABASE_SEED=true khi bạn thực sự muốn tạo lại dữ liệu demo.');
  }

  console.log('Bắt đầu dọn dẹp database...');
  await prisma.activityLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.complaintTimeline.deleteMany({});
  await prisma.complaint.deleteMany({});
  await prisma.workCredit.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.registration.deleteMany({});
  await prisma.workEvent.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.class.deleteMany({});
  await prisma.faculty.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.semesterConfig.deleteMany({});
  await prisma.systemSettings.deleteMany({});

  console.log('Seeding dữ liệu hệ thống...');

  // 1. System Settings
  await prisma.systemSettings.create({
    data: {
      siteName: 'DThU Workday',
      supportEmail: 'workday@dthu.edu.vn',
      supportPhone: '02776543210',
      defaultRequiredWorkdays: 12,
      maxConcurrentRegistrations: 3,
      maintenanceMode: false,
    }
  });

  // 2. Semester Configs
  const sem1 = await prisma.semesterConfig.create({
    data: {
      name: 'Học kỳ 1',
      schoolYear: '2024-2025',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2025-01-15'),
      requiredWorkdays: 12,
      isActive: true,
    }
  });

  await prisma.semesterConfig.create({
    data: {
      name: 'Học kỳ 2',
      schoolYear: '2024-2025',
      startDate: new Date('2025-02-01'),
      endDate: new Date('2025-06-15'),
      requiredWorkdays: 12,
      isActive: false,
    }
  });

  // 3. Faculties
  const f1 = await prisma.faculty.create({ data: { name: 'Khoa Sư phạm Toán - Tin', code: 'SP-TT' } });
  const f2 = await prisma.faculty.create({ data: { name: 'Khoa Sư phạm Ngữ văn', code: 'SP-NV' } });
  const f3 = await prisma.faculty.create({ data: { name: 'Khoa Kinh tế - Quản trị kinh doanh', code: 'KT-QTKD' } });
  const f4 = await prisma.faculty.create({ data: { name: 'Khoa Sinh học - Công nghệ sinh học', code: 'SH-CNSH' } });

  // 4. Classes
  const c1 = await prisma.class.create({ data: { name: 'SP Tin 21.A', code: 'SP21A-TIN', facultyId: f1.id, schoolYear: '2021-2025' } });
  const c2 = await prisma.class.create({ data: { name: 'SP Tin 22.B', code: 'SP22B-TIN', facultyId: f1.id, schoolYear: '2022-2026' } });
  const c3 = await prisma.class.create({ data: { name: 'SP Văn 21.A', code: 'SP21A-VAN', facultyId: f2.id, schoolYear: '2021-2025' } });
  const c4 = await prisma.class.create({ data: { name: 'SP Văn 22.B', code: 'SP22B-VAN', facultyId: f2.id, schoolYear: '2022-2026' } });
  const c5 = await prisma.class.create({ data: { name: 'QTKD 21.A', code: 'QTKD21A', facultyId: f3.id, schoolYear: '2021-2025' } });
  const c6 = await prisma.class.create({ data: { name: 'QTKD 22.B', code: 'QTKD22B', facultyId: f3.id, schoolYear: '2022-2026' } });
  const c7 = await prisma.class.create({ data: { name: 'CNSH 21.A', code: 'CNSH21A', facultyId: f4.id, schoolYear: '2021-2025' } });
  const c8 = await prisma.class.create({ data: { name: 'CNSH 22.B', code: 'CNSH22B', facultyId: f4.id, schoolYear: '2022-2026' } });

  // 5. Users
  const demoPassword = process.env.SEED_DEMO_PASSWORD || '123456';
  const passHash = await bcrypt.hash(demoPassword, 10);

  const userStudent = await prisma.user.create({
    data: {
      email: 'student@dthu.edu.vn',
      fullName: 'Nguyễn Văn An',
      passwordHash: passHash,
      role: UserRole.STUDENT,
      status: AccountStatus.ACTIVE,
      phone: '0912345678',
      createdAt: new Date('2021-09-01T00:00:00Z'),
    }
  });

  const userOrganizer = await prisma.user.create({
    data: {
      email: 'organizer@dthu.edu.vn',
      fullName: 'Trần Thị Bình',
      passwordHash: passHash,
      role: UserRole.ORGANIZER,
      status: AccountStatus.ACTIVE,
      phone: '0987654321',
      createdAt: new Date('2021-09-01T00:00:00Z'),
    }
  });

  const userAdmin = await prisma.user.create({
    data: {
      email: 'admin@dthu.edu.vn',
      fullName: 'Lê Hoàng Cường',
      passwordHash: passHash,
      role: UserRole.ADMIN,
      status: AccountStatus.ACTIVE,
      phone: '0901234567',
      createdAt: new Date('2021-09-01T00:00:00Z'),
    }
  });

  const userSuperAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@dthu.edu.vn',
      fullName: 'Phạm Minh Đức',
      passwordHash: passHash,
      role: UserRole.SUPER_ADMIN,
      status: AccountStatus.ACTIVE,
      phone: '0936258014',
      createdAt: new Date('2021-09-01T00:00:00Z'),
    }
  });

  // 6. Create Student profile for Nguyễn Văn An
  const studentAn = await prisma.student.create({
    data: {
      userId: userStudent.id,
      studentCode: 'DHTIN21001',
      fullName: 'Nguyễn Văn An',
      email: 'student@dthu.edu.vn',
      phone: '0912345678',
      facultyId: f1.id,
      classId: c1.id,
      schoolYear: '2021-2025',
      gender: 'male',
      birthDate: new Date('2003-03-15'),
      hometown: 'Cao Lãnh',
      status: AccountStatus.ACTIVE,
      requiredWorkdays: 12,
      accumulatedWorkdays: 8,
      completedWorkdays: 6,
    }
  });

  // Seed thêm các sinh viên khác từ mockData
  const mockStudents = [
    { name: 'Nguyễn Bình', code: 'DHTIN21002', class: c1, faculty: f1, acc: 5, comp: 4 },
    { name: 'Trần Cường', code: 'DHTIN21009', class: c2, faculty: f1, acc: 6, comp: 5 },
    { name: 'Lê Dũng', code: 'DHVAN21001', class: c3, faculty: f2, acc: 4, comp: 4 },
    { name: 'Phạm Giang', code: 'DHVAN22002', class: c4, faculty: f2, acc: 3, comp: 2 },
    { name: 'Hoàng Hải', code: 'DHQTK21001', class: c5, faculty: f3, acc: 7, comp: 6 },
    { name: 'Võ Hùng', code: 'DHQTK22002', class: c6, faculty: f3, acc: 2, comp: 1 },
    { name: 'Đặng Linh', code: 'DHCNS21001', class: c7, faculty: f4, acc: 8, comp: 7 },
    { name: 'Bùi Minh', code: 'DHCNS22002', class: c8, faculty: f4, acc: 5, comp: 5 },
  ];

  const dbStudents = [studentAn];

  for (let i = 0; i < mockStudents.length; i++) {
    const ms = mockStudents[i];
    const email = `${ms.name.split(' ').pop()?.toLowerCase()}${i + 2}@dthu.edu.vn`;
    const user = await prisma.user.create({
      data: {
        email,
        fullName: ms.name,
        passwordHash: passHash,
        role: UserRole.STUDENT,
        status: AccountStatus.ACTIVE,
        createdAt: new Date(),
      }
    });

    const student = await prisma.student.create({
      data: {
        userId: user.id,
        studentCode: ms.code,
        fullName: ms.name,
        email,
        facultyId: ms.faculty.id,
        classId: ms.class.id,
        schoolYear: ms.class.schoolYear,
        gender: i % 2 === 0 ? 'male' : 'female',
        status: AccountStatus.ACTIVE,
        requiredWorkdays: 12,
        accumulatedWorkdays: ms.acc,
        completedWorkdays: ms.comp,
      }
    });
    dbStudents.push(student);
  }

  // 7. Work Events
  const baseEvent = {
    startTime: '07:00',
    endTime: '11:00',
    shift: WorkShift.MORNING,
    registrationOpen: new Date('2024-11-20T00:00:00Z'),
    registrationClose: new Date('2024-12-08T23:59:59Z'),
    cancellationDeadline: new Date('2024-12-09T12:00:00Z'),
    maxCapacity: 40,
    workdayCredit: 1.0,
    clothingRequirements: 'Áo thun, quần dài, giày bệt, đội mũ nón.',
    equipmentRequirements: 'Mang theo chai nước. Cung cấp găng tay, túi rác.',
    contactPerson: 'Trần Thị Bình',
    contactPhone: '0987654321',
    organizerId: userOrganizer.id,
  };

  const e1 = await prisma.workEvent.create({
    data: {
      ...baseEvent,
      code: 'WD-2024-001',
      name: 'Vệ sinh khuôn viên giảng đường A',
      description: 'Dọn dẹp tổng quát giảng đường A để chuẩn bị kỳ thi. Sinh viên được phân công dọn rác, lau sảnh hành lang, sắp xếp bàn ghế.',
      workContent: 'Quét dọn hành lang, thu gom rác, lau kính cửa sổ, sắp xếp bàn ghế.',
      location: 'Giảng đường A - Khu A, ĐH Đồng Tháp',
      date: new Date('2024-12-10'),
      status: EventStatus.OPEN,
      registeredCount: 5,
      eligibleFacultyIds: JSON.stringify([f1.id, f2.id, f3.id, f4.id]),
      eligibleClassIds: JSON.stringify([]),
      eligibleSchoolYears: JSON.stringify(['2021-2025', '2022-2026']),
    }
  });

  const e2 = await prisma.workEvent.create({
    data: {
      ...baseEvent,
      code: 'WD-2024-002',
      name: 'Chăm sóc cây xanh khu A',
      description: 'Tưới tiêu và làm cỏ cho khu vườn cây xanh khu A, rèn luyện ý thức bảo vệ môi trường.',
      workContent: 'Tưới cây, làm cỏ, thu gom lá rụng, bón phân theo hướng dẫn.',
      location: 'Khu vườn cây xanh khu A',
      date: new Date('2024-12-15'),
      startTime: '06:30',
      endTime: '10:30',
      maxCapacity: 25,
      registeredCount: 3,
      status: EventStatus.OPEN,
      eligibleFacultyIds: JSON.stringify([f1.id, f2.id, f3.id, f4.id]),
    }
  });

  const e3 = await prisma.workEvent.create({
    data: {
      ...baseEvent,
      code: 'WD-2024-003',
      name: 'Hỗ trợ Ngày hội tuyển sinh 2025',
      description: 'Tình nguyện hỗ trợ tổ chức Ngày hội tuyển sinh: đón tiếp, hướng dẫn tham quan, hậu cần.',
      workContent: 'Đón tiếp khách, hướng dẫn tham quan, phát tài liệu, hỗ trợ hậu cần.',
      location: 'Hội trường trung tâm - ĐH Đồng Tháp',
      date: new Date('2025-01-12'),
      startTime: '07:30',
      endTime: '17:00',
      shift: WorkShift.FULLDAY,
      maxCapacity: 60,
      workdayCredit: 2.0,
      status: EventStatus.OPEN,
      eligibleFacultyIds: JSON.stringify([f1.id, f2.id, f3.id, f4.id]),
    }
  });

  const e4 = await prisma.workEvent.create({
    data: {
      ...baseEvent,
      code: 'WD-2024-004',
      name: 'Sắp xếp thư viện khoa Sư phạm',
      description: 'Phân loại lại sách tại thư viện, đóng gói sách hư hỏng, cập nhật vị trí trên kệ.',
      workContent: 'Phân loại sách, dán nhãn kệ, đóng gói sách hỏng, lau sạch kệ.',
      location: 'Thư viện khoa SP Toán - Tin',
      date: new Date('2024-11-28'),
      startTime: '13:00',
      endTime: '17:00',
      shift: WorkShift.AFTERNOON,
      maxCapacity: 15,
      registeredCount: 2,
      status: EventStatus.COMPLETED,
      eligibleFacultyIds: JSON.stringify([f1.id]),
      eligibleClassIds: JSON.stringify([c1.id, c2.id]),
    }
  });

  const e5 = await prisma.workEvent.create({
    data: {
      ...baseEvent,
      code: 'WD-2024-005',
      name: 'Hỗ trợ chương trình hiến máu',
      description: 'Hỗ trợ tổ chức chương trình hiến máu tình nguyện tại trường.',
      workContent: 'Hướng dẫn thủ tục, hỗ trợ khu hiến máu, phục vụ nước và bánh.',
      location: 'Hội trường B - ĐH Đồng Tháp',
      date: new Date('2024-12-20'),
      startTime: '07:00',
      endTime: '16:00',
      shift: WorkShift.FULLDAY,
      maxCapacity: 30,
      workdayCredit: 2.0,
      status: EventStatus.OPEN,
      eligibleFacultyIds: JSON.stringify([f1.id, f2.id, f3.id, f4.id]),
    }
  });

  const e7 = await prisma.workEvent.create({
    data: {
      ...baseEvent,
      code: 'WD-2024-007',
      name: 'Hỗ trợ lễ khai giảng năm học mới',
      description: 'Tình nguyện hỗ trợ tổ chức lễ khai giảng: hội trường, đón tiếp, âm thanh.',
      workContent: 'Sắp xếp ghế, đón tiếp khách, hỗ trợ âm thanh, phát tài liệu.',
      location: 'Hội trường trung tâm - ĐH Đồng Tháp',
      date: new Date('2024-09-05'),
      startTime: '06:30',
      endTime: '11:30',
      maxCapacity: 50,
      workdayCredit: 2.0,
      status: EventStatus.COMPLETED,
      eligibleFacultyIds: JSON.stringify([f1.id, f2.id, f3.id, f4.id]),
    }
  });

  const e12 = await prisma.workEvent.create({
    data: {
      ...baseEvent,
      code: 'WD-2024-012',
      name: 'Hỗ trợ hội thao truyền thống 2024',
      description: 'Tình nguyện hỗ trợ hội thao: trọng tài phụ, hậu cần, y tế, an ninh.',
      workContent: 'Hỗ trợ trọng tài, quản lý hậu cần, y tế, kiểm soát cổng.',
      location: 'Sân vận động - ĐH Đồng Tháp',
      date: new Date('2024-11-30'),
      startTime: '06:30',
      endTime: '17:00',
      shift: WorkShift.FULLDAY,
      maxCapacity: 70,
      workdayCredit: 2.0,
      status: EventStatus.COMPLETED,
      eligibleFacultyIds: JSON.stringify([f1.id, f2.id, f3.id, f4.id]),
    }
  });

  // 8. Registrations & Attendance for Nguyễn Văn An
  // e1: approved
  await prisma.registration.create({
    data: {
      eventId: e1.id,
      studentId: studentAn.id,
      status: RegistrationStatus.APPROVED,
      approvedById: userOrganizer.id,
      approvedAt: new Date('2024-11-22T10:00:00Z'),
      registeredAt: new Date('2024-11-21T09:00:00Z'),
    }
  });
  await prisma.attendance.create({
    data: {
      eventId: e1.id,
      studentId: studentAn.id,
      status: AttendanceStatus.NOT_CHECKED,
    }
  });

  // e7: completed
  await prisma.registration.create({
    data: {
      eventId: e7.id,
      studentId: studentAn.id,
      status: RegistrationStatus.COMPLETED,
      approvedById: userOrganizer.id,
      approvedAt: new Date('2024-08-22T10:00:00Z'),
      registeredAt: new Date('2024-08-21T09:00:00Z'),
    }
  });
  await prisma.attendance.create({
    data: {
      eventId: e7.id,
      studentId: studentAn.id,
      status: AttendanceStatus.CHECKED_OUT,
      checkInTime: '07:05',
      checkOutTime: '11:00',
    }
  });
  await prisma.workCredit.create({
    data: {
      studentId: studentAn.id,
      eventId: e7.id,
      semesterId: sem1.id,
      creditValue: 2.0,
      status: CreditStatus.RECORDED,
      createdAt: new Date('2024-08-21T09:00:00Z'),
    }
  });

  // e12: completed (adjusted)
  await prisma.registration.create({
    data: {
      eventId: e12.id,
      studentId: studentAn.id,
      status: RegistrationStatus.COMPLETED,
      approvedById: userOrganizer.id,
      approvedAt: new Date('2024-11-03T10:00:00Z'),
      registeredAt: new Date('2024-11-02T09:00:00Z'),
    }
  });
  await prisma.attendance.create({
    data: {
      eventId: e12.id,
      studentId: studentAn.id,
      status: AttendanceStatus.CHECKED_OUT,
      checkInTime: '07:05',
      checkOutTime: '17:00',
    }
  });
  await prisma.workCredit.create({
    data: {
      studentId: studentAn.id,
      eventId: e12.id,
      semesterId: sem1.id,
      creditValue: 3.0,
      status: CreditStatus.ADJUSTED,
      adjustedById: userAdmin.id,
      adjustmentReason: 'Làm thêm giờ ngoài kế hoạch',
      adjustedAt: new Date('2024-12-01T10:00:00Z'),
      createdAt: new Date('2024-11-02T09:00:00Z'),
    }
  });

  // e3: pending
  await prisma.registration.create({
    data: {
      eventId: e3.id,
      studentId: studentAn.id,
      status: RegistrationStatus.PENDING,
      registeredAt: new Date('2024-12-02T09:00:00Z'),
    }
  });

  // 9. Complaints
  const cpl1 = await prisma.complaint.create({
    data: {
      code: 'KN-2024-001',
      studentId: studentAn.id,
      eventId: e12.id,
      type: ComplaintType.CREDIT,
      priority: ComplaintPriority.MEDIUM,
      title: 'Chưa nhận được ngày công hội thao',
      description: 'Tôi đã tham gia đầy đủ hội thao ngày 30/11 nhưng chưa thấy ngày công được ghi nhận.',
      status: ComplaintStatus.PROCESSING,
      evidence: JSON.stringify(['hinh_minh_chung_1.jpg']),
      createdAt: new Date('2024-12-01T09:00:00Z'),
      updatedAt: new Date('2024-12-02T14:00:00Z'),
    }
  });

  await prisma.complaintTimeline.create({
    data: {
      complaintId: cpl1.id,
      status: ComplaintStatus.SUBMITTED,
      note: 'Khiếu nại đã được gửi',
      actor: 'Nguyễn Văn An',
      timestamp: new Date('2024-12-01T09:00:00Z'),
    }
  });
  await prisma.complaintTimeline.create({
    data: {
      complaintId: cpl1.id,
      status: ComplaintStatus.PROCESSING,
      note: 'Đang xác minh',
      actor: 'Lê Hoàng Cường',
      timestamp: new Date('2024-12-02T14:00:00Z'),
    }
  });

  // 10. Notifications
  await prisma.notification.create({
    data: {
      userId: userStudent.id,
      type: NotificationType.REGISTRATION,
      title: 'Đăng ký được duyệt',
      message: 'Đăng ký "Vệ sinh khuôn viên giảng đường A" đã được duyệt.',
      isRead: false,
      link: '/student/my-registrations',
      createdAt: new Date('2024-11-22T10:00:00Z'),
    }
  });
  await prisma.notification.create({
    data: {
      userId: userStudent.id,
      type: NotificationType.CREDIT,
      title: 'Ghi nhận ngày công',
      message: 'Bạn được ghi nhận 2 ngày công cho sự kiện "Hỗ trợ lễ khai giảng".',
      isRead: false,
      link: '/student/work-credits',
      createdAt: new Date('2024-09-05T12:00:00Z'),
    }
  });

  // 11. Activity Logs
  await prisma.activityLog.create({
    data: {
      userId: userStudent.id,
      action: 'Đăng ký sự kiện',
      affectedItem: 'Vệ sinh khuôn viên giảng đường A',
      newValue: 'pending',
      timestamp: new Date('2024-11-21T09:00:00Z'),
      ipAddress: '10.0.0.21',
    }
  });
  await prisma.activityLog.create({
    data: {
      userId: userOrganizer.id,
      action: 'Duyệt đăng ký',
      affectedItem: 'Đăng ký của Nguyễn Văn An',
      oldValue: 'pending',
      newValue: 'approved',
      timestamp: new Date('2024-11-22T10:00:00Z'),
      ipAddress: '10.0.0.22',
    }
  });

  console.log('Seeding dữ liệu thành công!');
}

main()
  .catch((e) => {
    console.error('Lỗi khi seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
