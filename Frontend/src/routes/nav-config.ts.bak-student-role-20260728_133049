import type { UserRole } from '@/types';
import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, CalendarDays, ClipboardList, CalendarRange, Award, MessageSquareWarning, Bell, User, FolderKanban, CalendarPlus, Users, BarChart3, ShieldCheck, Building2, GraduationCap, Settings, History, ShieldAlert } from 'lucide-react';

export interface NavItem { label: string; href: string; icon: LucideIcon; exact?: boolean; }
export interface NavSection { title?: string; items: NavItem[]; }

export const NAV_CONFIG: Record<UserRole, NavSection[]> = {
  student: [{ items: [
    { label: 'Tổng quan', href: '/student/dashboard', icon: LayoutDashboard, exact: true },
    { label: 'Sự kiện ngày công', href: '/student/work-events', icon: CalendarDays, exact: true },
    { label: 'Đăng ký của tôi', href: '/student/my-registrations', icon: ClipboardList, exact: true },
    { label: 'Lịch làm việc', href: '/student/schedule', icon: CalendarRange, exact: true },
    { label: 'Ngày công', href: '/student/work-credits', icon: Award, exact: true },
    { label: 'Khiếu nại', href: '/student/complaints', icon: MessageSquareWarning, exact: true },
    { label: 'Thông báo', href: '/student/notifications', icon: Bell, exact: true },
    { label: 'Hồ sơ', href: '/profile', icon: User, exact: true },
  ]}],
  organizer: [{ items: [
    { label: 'Tổng quan', href: '/organizer/dashboard', icon: LayoutDashboard, exact: true },
    { label: 'Sự kiện', href: '/organizer/events', icon: FolderKanban, exact: true },
    { label: 'Tạo sự kiện', href: '/organizer/events/new', icon: CalendarPlus, exact: true },
    { label: 'Báo cáo', href: '/organizer/reports', icon: BarChart3, exact: true },
    { label: 'Hồ sơ', href: '/profile', icon: User, exact: true },
  ]}],
  admin: [{ items: [
    { label: 'Tổng quan', href: '/admin/dashboard', icon: LayoutDashboard, exact: true },
    { label: 'Duyệt sự kiện', href: '/admin/event-approvals', icon: ShieldCheck, exact: true },
    { label: 'Sự kiện', href: '/admin/events', icon: FolderKanban, exact: true },
    { label: 'Sinh viên', href: '/admin/students', icon: Users, exact: true },
    { label: 'Lớp học', href: '/admin/classes', icon: GraduationCap, exact: true },
    { label: 'Khoa', href: '/admin/faculties', icon: Building2, exact: true },
    { label: 'Ngày công', href: '/admin/work-credits', icon: Award, exact: true },
    { label: 'Khiếu nại', href: '/admin/complaints', icon: MessageSquareWarning, exact: true },
    { label: 'Báo cáo', href: '/admin/reports', icon: BarChart3, exact: true },
    { label: 'Nhật ký hoạt động', href: '/admin/activity-logs', icon: History, exact: true },
    { label: 'Hồ sơ', href: '/profile', icon: User, exact: true },
  ]}],
  superadmin: [{ items: [
    { label: 'Tổng quan', href: '/superadmin/dashboard', icon: LayoutDashboard, exact: true },
    { label: 'Người dùng', href: '/superadmin/users', icon: Users, exact: true },
    { label: 'Vai trò & quyền', href: '/superadmin/roles', icon: ShieldAlert, exact: true },
    { label: 'Cài đặt hệ thống', href: '/superadmin/settings', icon: Settings, exact: true },
    { label: 'Nhật ký hoạt động', href: '/superadmin/activity-logs', icon: History, exact: true },
    { label: 'Hồ sơ', href: '/profile', icon: User, exact: true },
  ]}],
};
