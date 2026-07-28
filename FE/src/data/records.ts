import type { Registration, Attendance, WorkCredit, Complaint, Notification, ActivityLog } from '@/types';
import { students, classes, faculties } from './base';
import { events } from './events';

const clsName = (id: string) => classes.find((c) => c.id === id)?.name ?? '';
const facName = (id: string) => faculties.find((f) => f.id === id)?.name ?? '';
const regSt: Registration['status'][] = ['pending', 'approved', 'waitlist', 'completed', 'cancelled', 'absent'];

export const registrations: Registration[] = [];
for (let i = 0; i < 30; i++) {
  const st = students[i % students.length];
  const ev = events[i % events.length];
  const status = regSt[i % regSt.length];
  const regDate = new Date(2024, 10 + (i % 2), (i % 28) + 1).toISOString();
  const att: Registration['attendanceStatus'] = status === 'completed' ? 'checked_out' : status === 'absent' ? 'absent' : 'not_checked';
  registrations.push({
    id: `r-${i + 1}`, eventId: ev.id, studentId: st.id, studentCode: st.studentCode, studentName: st.fullName,
    classId: st.classId, className: clsName(st.classId), facultyId: st.facultyId, facultyName: facName(st.facultyId),
    status, registeredAt: regDate, approvedAt: status === 'approved' || status === 'completed' ? regDate : undefined,
    approvedBy: status === 'approved' || status === 'completed' ? 'Trần Thị Bình' : undefined,
    rejectionReason: status === 'cancelled' && i % 4 === 0 ? 'Sự kiện đã đủ số lượng' : undefined,
    attendanceStatus: att, workdayResult: status === 'completed' ? ev.workdayCredit : status === 'absent' ? 0 : undefined,
  });
}
// Ensure s-1 has several registrations
for (let i = 0; i < 4; i++) registrations[i] = { ...registrations[i], studentId: 's-1', studentCode: 'DHTIN21001', studentName: 'Nguyễn Văn An', classId: 'c-1', className: 'SP Tin 21.A', facultyId: 'f-1', facultyName: 'Khoa Sư phạm Toán - Tin' };
registrations[0] = { ...registrations[0], eventId: 'e-1', status: 'approved', attendanceStatus: 'not_checked', registeredAt: '2024-11-21T09:00:00Z', approvedAt: '2024-11-22T10:00:00Z', approvedBy: 'Trần Thị Bình' };
registrations[1] = { ...registrations[1], eventId: 'e-7', status: 'completed', attendanceStatus: 'checked_out', workdayResult: 2, registeredAt: '2024-08-21T09:00:00Z', approvedAt: '2024-08-22T10:00:00Z', approvedBy: 'Trần Thị Bình' };
registrations[2] = { ...registrations[2], eventId: 'e-12', status: 'completed', attendanceStatus: 'checked_out', workdayResult: 2, registeredAt: '2024-11-02T09:00:00Z', approvedAt: '2024-11-03T10:00:00Z', approvedBy: 'Trần Thị Bình' };
registrations[3] = { ...registrations[3], eventId: 'e-3', status: 'pending', attendanceStatus: 'not_checked', registeredAt: '2024-12-02T09:00:00Z' };

export const attendanceRecords: Attendance[] = registrations.filter((r) => r.status === 'approved' || r.status === 'completed' || r.status === 'absent').map((r, i) => ({
  id: `a-${i + 1}`, eventId: r.eventId, studentId: r.studentId, studentCode: r.studentCode, studentName: r.studentName,
  status: r.attendanceStatus ?? 'not_checked', checkInTime: r.attendanceStatus === 'checked_in' || r.attendanceStatus === 'checked_out' ? '07:05' : r.attendanceStatus === 'late' ? '07:25' : undefined,
  checkOutTime: r.attendanceStatus === 'checked_out' ? '11:00' : r.attendanceStatus === 'early_leave' ? '10:30' : undefined,
}));

const creditSt: WorkCredit['status'][] = ['pending', 'recorded', 'rejected', 'adjusted'];
export const workCredits: WorkCredit[] = registrations.filter((r) => r.status === 'completed' || r.status === 'absent').map((r, i) => {
  const ev = events.find((e) => e.id === r.eventId)!;
  return {
    id: `wc-${i + 1}`, studentId: r.studentId, studentCode: r.studentCode, studentName: r.studentName,
    classId: r.classId, className: r.className, facultyId: r.facultyId, facultyName: r.facultyName,
    eventId: r.eventId, eventName: ev.name, eventDate: ev.date, semester: 'Học kỳ 1', schoolYear: '2024-2025',
    creditValue: r.workdayResult ?? (r.status === 'absent' ? 0 : ev.workdayCredit), status: creditSt[i % 4],
    adjustedBy: i % 4 === 3 ? 'Lê Hoàng Cường' : undefined, adjustmentReason: i % 4 === 3 ? 'Làm thêm giờ ngoài kế hoạch' : undefined,
    adjustedAt: i % 4 === 3 ? '2024-12-01T10:00:00Z' : undefined, createdAt: r.registeredAt,
  };
});

export const complaints: Complaint[] = [
  { id: 'cp-1', code: 'KN-2024-001', studentId: 's-1', studentCode: 'DHTIN21001', studentName: 'Nguyễn Văn An', classId: 'c-1', className: 'SP Tin 21.A', facultyId: 'f-1', facultyName: 'Khoa Sư phạm Toán - Tin', eventId: 'e-12', eventName: 'Hỗ trợ hội thao truyền thống 2024', type: 'credit', priority: 'medium', title: 'Chưa nhận được ngày công hội thao', description: 'Tôi đã tham gia đầy đủ hội thao ngày 30/11 nhưng chưa thấy ngày công được ghi nhận.', evidence: ['hinh_minh_chung_1.jpg'], status: 'processing', timeline: [{ id: 't-1', status: 'submitted', note: 'Khiếu nại đã được gửi', actor: 'Nguyễn Văn An', timestamp: '2024-12-01T09:00:00Z' }, { id: 't-2', status: 'processing', note: 'Đang xác minh', actor: 'Lê Hoàng Cường', timestamp: '2024-12-02T14:00:00Z' }], createdAt: '2024-12-01T09:00:00Z', updatedAt: '2024-12-02T14:00:00Z' },
  { id: 'cp-2', code: 'KN-2024-002', studentId: 's-2', studentCode: students[1].studentCode, studentName: students[1].fullName, classId: students[1].classId, className: clsName(students[1].classId), facultyId: students[1].facultyId, facultyName: facName(students[1].facultyId), eventId: 'e-4', eventName: 'Sắp xếp thư viện khoa Sư phạm', type: 'attendance', priority: 'low', title: 'Sai thời gian điểm danh', description: 'Tôi check-in đúng giờ nhưng hệ thống ghi nhận là đi trễ.', evidence: [], status: 'resolved', response: 'Đã kiểm tra lại, thời gian check-in của bạn là 07:02, đúng giờ. Đã điều chỉnh.', timeline: [{ id: 't-3', status: 'submitted', note: 'Khiếu nại đã được gửi', actor: students[1].fullName, timestamp: '2024-11-29T10:00:00Z' }, { id: 't-4', status: 'processing', note: 'Đang kiểm tra', actor: 'Lê Hoàng Cường', timestamp: '2024-11-29T15:00:00Z' }, { id: 't-5', status: 'resolved', note: 'Đã điều chỉnh', actor: 'Lê Hoàng Cường', timestamp: '2024-11-30T09:00:00Z' }], createdAt: '2024-11-29T10:00:00Z', updatedAt: '2024-11-30T09:00:00Z' },
  { id: 'cp-3', code: 'KN-2024-003', studentId: 's-3', studentCode: students[2].studentCode, studentName: students[2].fullName, classId: students[2].classId, className: clsName(students[2].classId), facultyId: students[2].facultyId, facultyName: facName(students[2].facultyId), eventId: 'e-7', eventName: 'Hỗ trợ lễ khai giảng năm học mới', type: 'schedule', priority: 'high', title: 'Trùng lịch với giờ học', description: 'Sự kiện khai giảng trùng với giờ học chính khóa, xin phép đổi sang sự kiện khác.', evidence: ['thoi_khoa_bieu.png'], status: 'rejected', response: 'Sự kiện khai giảng là hoạt động toàn trường, không thể chuyển.', timeline: [{ id: 't-6', status: 'submitted', note: 'Khiếu nại đã được gửi', actor: students[2].fullName, timestamp: '2024-09-01T08:00:00Z' }, { id: 't-7', status: 'rejected', note: 'Không thể chuyển sự kiện toàn trường', actor: 'Lê Hoàng Cường', timestamp: '2024-09-02T10:00:00Z' }], createdAt: '2024-09-01T08:00:00Z', updatedAt: '2024-09-02T10:00:00Z' },
];

export const notifications: Notification[] = [
  { id: 'n-1', userId: 'u-1', type: 'registration', title: 'Đăng ký được duyệt', message: 'Đăng ký "Vệ sinh khuôn viên giảng đường A" đã được duyệt.', isRead: false, link: '/student/my-registrations', createdAt: '2024-11-22T10:00:00Z' },
  { id: 'n-2', userId: 'u-1', type: 'credit', title: 'Ghi nhận ngày công', message: 'Bạn được ghi nhận 2 ngày công cho sự kiện "Hỗ trợ lễ khai giảng".', isRead: false, link: '/student/work-credits', createdAt: '2024-09-05T12:00:00Z' },
  { id: 'n-3', userId: 'u-1', type: 'event', title: 'Sự kiện sắp diễn ra', message: 'Sự kiện "Vệ sinh khuôn viên giảng đường A" sẽ diễn ra 10/12/2024.', isRead: true, link: '/student/work-events/e-1', createdAt: '2024-12-08T08:00:00Z' },
  { id: 'n-4', userId: 'u-1', type: 'complaint', title: 'Cập nhật khiếu nại', message: 'Khiếu nại KN-2024-001 đang được xử lý.', isRead: false, link: '/student/complaints', createdAt: '2024-12-02T14:00:00Z' },
  { id: 'n-5', userId: 'u-1', type: 'system', title: 'Chào mừng học kỳ mới', message: 'Học kỳ 1 năm học 2024-2025 đã bắt đầu. Hãy đăng ký ngày công!', isRead: true, link: '/student/work-events', createdAt: '2024-09-01T00:00:00Z' },
  { id: 'n-6', userId: 'u-2', type: 'registration', title: 'Đăng ký mới', message: 'Có 3 đăng ký mới cho sự kiện "Vệ sinh khuôn viên giảng đường A".', isRead: false, link: '/organizer/events/e-1/registrations', createdAt: '2024-11-21T16:00:00Z' },
  { id: 'n-7', userId: 'u-3', type: 'event', title: 'Sự kiện chờ duyệt', message: 'Sự kiện "Hỗ trợ lễ bế giảng" cần phê duyệt.', isRead: false, link: '/admin/event-approvals', createdAt: '2024-12-10T10:00:00Z' },
  { id: 'n-8', userId: 'u-3', type: 'complaint', title: 'Khiếu nại mới', message: 'Có khiếu nại mới KN-2024-001 cần xử lý.', isRead: false, link: '/admin/complaints', createdAt: '2024-12-01T09:00:00Z' },
  { id: 'n-9', userId: 'u-4', type: 'system', title: 'Cập nhật hệ thống', message: 'Hệ thống DThU Workday đã cập nhật phiên bản 1.2.', isRead: true, createdAt: '2024-11-01T00:00:00Z' },
];

export const activityLogs: ActivityLog[] = [
  { id: 'log-1', userId: 'u-1', userName: 'Nguyễn Văn An', userRole: 'student', action: 'Đăng ký sự kiện', affectedItem: 'Vệ sinh khuôn viên giảng đường A', oldValue: undefined, newValue: 'pending', timestamp: '2024-11-21T09:00:00Z', ipAddress: '10.0.0.21' },
  { id: 'log-2', userId: 'u-2', userName: 'Trần Thị Bình', userRole: 'organizer', action: 'Duyệt đăng ký', affectedItem: 'Đăng ký của Nguyễn Văn An', oldValue: 'pending', newValue: 'approved', timestamp: '2024-11-22T10:00:00Z', ipAddress: '10.0.0.22' },
  { id: 'log-3', userId: 'u-2', userName: 'Trần Thị Bình', userRole: 'organizer', action: 'Tạo sự kiện', affectedItem: 'Vệ sinh khuôn viên giảng đường A', oldValue: undefined, newValue: 'draft', timestamp: '2024-11-15T10:00:00Z', ipAddress: '10.0.0.22' },
  { id: 'log-4', userId: 'u-3', userName: 'Lê Hoàng Cường', userRole: 'admin', action: 'Duyệt sự kiện', affectedItem: 'Hỗ trợ hội thao truyền thống 2024', oldValue: 'pending', newValue: 'approved', timestamp: '2024-10-29T08:00:00Z', ipAddress: '10.0.0.23' },
  { id: 'log-5', userId: 'u-3', userName: 'Lê Hoàng Cường', userRole: 'admin', action: 'Điều chỉnh ngày công', affectedItem: 'Nguyễn Văn An - Hội thao', oldValue: '2', newValue: '3', timestamp: '2024-12-01T10:00:00Z', ipAddress: '10.0.0.23' },
  { id: 'log-6', userId: 'u-4', userName: 'Phạm Minh Đức', userRole: 'superadmin', action: 'Cập nhật cấu hình', affectedItem: 'Số ngày công yêu cầu', oldValue: '10', newValue: '12', timestamp: '2024-08-25T09:00:00Z', ipAddress: '10.0.0.24' },
  { id: 'log-7', userId: 'u-4', userName: 'Phạm Minh Đức', userRole: 'superadmin', action: 'Khóa tài khoản', affectedItem: 'Sinh viên ' + students[16].fullName, oldValue: 'active', newValue: 'locked', timestamp: '2024-11-10T11:00:00Z', ipAddress: '10.0.0.24' },
  { id: 'log-8', userId: 'u-2', userName: 'Trần Thị Bình', userRole: 'organizer', action: 'Điểm danh', affectedItem: 'Hỗ trợ lễ khai giảng', oldValue: undefined, newValue: 'checked_out', timestamp: '2024-09-05T11:30:00Z', ipAddress: '10.0.0.22' },
];
