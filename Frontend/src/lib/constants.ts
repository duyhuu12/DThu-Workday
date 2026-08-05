import type { AttendanceStatus, ComplaintPriority, ComplaintStatus, ComplaintType, CreditStatus, EventStatus, NotificationType, RegistrationStatus, UserRole, WorkShift } from '@/types';

export const ROLE_LABELS: Record<UserRole, string> = { student: 'Sinh viên', organizer: 'Người phụ trách', admin: 'Quản trị viên', superadmin: 'Super Admin' };
export const ROLE_HOME: Record<UserRole, string> = { student: '/student/dashboard', organizer: '/organizer/dashboard', admin: '/admin/dashboard', superadmin: '/superadmin/dashboard' };
export const DEMO_ACCOUNTS = [
  { email: 'student@dthu.edu.vn', role: 'student' as UserRole },
  { email: 'organizer@dthu.edu.vn', role: 'organizer' as UserRole },
  { email: 'admin@dthu.edu.vn', role: 'admin' as UserRole },
  { email: 'superadmin@dthu.edu.vn', role: 'superadmin' as UserRole },
];
export const SEMESTERS = ['Học kỳ 1', 'Học kỳ 2', 'Học kỳ hè'];
export const SCHOOL_YEARS = ['2023-2024', '2024-2025', '2025-2026'];
export const CURRENT_SEMESTER = 'Học kỳ 1';
export const CURRENT_SCHOOL_YEAR = '2024-2025';

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = { draft: 'Bản nháp', pending: 'Chờ duyệt', approved: 'Đã duyệt', open: 'Đang đăng ký', upcoming: 'Sắp diễn ra', ongoing: 'Đang diễn ra', completed: 'Đã hoàn thành', rejected: 'Bị từ chối', cancelled: 'Đã hủy' };
export const EVENT_STATUS_VARIANTS: Record<EventStatus, string> = { draft: 'bg-muted text-muted-foreground', pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', approved: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', open: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', upcoming: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300', ongoing: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300', completed: 'bg-slate-200 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300', rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', cancelled: 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700/50 dark:text-zinc-400' };
export const REG_STATUS_LABELS: Record<RegistrationStatus, string> = { pending: 'Đang xử lý', approved: 'Đã đăng ký', waitlist: 'Danh sách chờ', completed: 'Đã hoàn thành', cancelled: 'Đã hủy', absent: 'Vắng mặt' };
export const REG_STATUS_VARIANTS: Record<RegistrationStatus, string> = { pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', waitlist: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', completed: 'bg-slate-200 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300', cancelled: 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700/50 dark:text-zinc-400', absent: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' };
export const ATT_STATUS_LABELS: Record<AttendanceStatus, string> = { not_checked: 'Chưa điểm danh', checked_in: 'Đã check-in', checked_out: 'Đã check-out', late: 'Đi trễ', early_leave: 'Về sớm', absent: 'Vắng mặt' };
export const ATT_STATUS_VARIANTS: Record<AttendanceStatus, string> = { not_checked: 'bg-muted text-muted-foreground', checked_in: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', checked_out: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', late: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', early_leave: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300', absent: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' };
export const CREDIT_STATUS_LABELS: Record<CreditStatus, string> = { pending: 'Chờ xác nhận', recorded: 'Đã ghi nhận', rejected: 'Bị từ chối', adjusted: 'Đã điều chỉnh' };
export const CREDIT_STATUS_VARIANTS: Record<CreditStatus, string> = { pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', recorded: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', adjusted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' };
export const COMPLAINT_STATUS_LABELS: Record<ComplaintStatus, string> = { submitted: 'Đã gửi', processing: 'Đang xử lý', resolved: 'Đã giải quyết', rejected: 'Từ chối' };
export const COMPLAINT_STATUS_VARIANTS: Record<ComplaintStatus, string> = { submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', processing: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' };
export const COMPLAINT_TYPE_LABELS: Record<ComplaintType, string> = { credit: 'Ngày công', attendance: 'Điểm danh', schedule: 'Lịch làm việc', organizer: 'Người phụ trách', other: 'Khác' };
export const COMPLAINT_PRIORITY_LABELS: Record<ComplaintPriority, string> = { low: 'Thấp', medium: 'Trung bình', high: 'Cao' };
export const COMPLAINT_PRIORITY_VARIANTS: Record<ComplaintPriority, string> = { low: 'bg-muted text-muted-foreground', medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', high: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' };
export const NOTIF_TYPE_LABELS: Record<NotificationType, string> = { registration: 'Đăng ký', event: 'Sự kiện', credit: 'Ngày công', complaint: 'Khiếu nại', system: 'Hệ thống' };
export const SHIFT_LABELS: Record<WorkShift, string> = { morning: 'Sáng', afternoon: 'Chiều', evening: 'Tối', fullday: 'Cả ngày' };
