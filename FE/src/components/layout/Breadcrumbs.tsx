'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const LABEL_MAP: Record<string, string> = {
  student: 'Sinh viên', organizer: 'Người phụ trách', admin: 'Quản trị viên', superadmin: 'Super Admin',
  dashboard: 'Tổng quan', 'work-events': 'Sự kiện ngày công', 'my-registrations': 'Đăng ký của tôi',
  schedule: 'Lịch làm việc', 'work-credits': 'Ngày công', complaints: 'Khiếu nại', notifications: 'Thông báo',
  profile: 'Hồ sơ', events: 'Sự kiện', new: 'Tạo mới', edit: 'Chỉnh sửa', registrations: 'Đăng ký',
  attendance: 'Điểm danh', results: 'Kết quả', reports: 'Báo cáo', 'event-approvals': 'Duyệt sự kiện',
  students: 'Sinh viên', classes: 'Lớp học', faculties: 'Khoa', 'activity-logs': 'Nhật ký hoạt động',
  users: 'Người dùng', roles: 'Vai trò & quyền', settings: 'Cài đặt hệ thống',
};

export function getPageTitle(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return 'Trang chủ';
  return LABEL_MAP[segments[segments.length - 1]] ?? segments[segments.length - 1];
}

export function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname();
  if (!pathname) return null;
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length <= 1) return null;
  let href = '';
  return <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1.5 text-sm text-muted-foreground', className)}>
    {segments.map((seg, i) => { href += `/${seg}`; const isLast = i === segments.length - 1; const label = LABEL_MAP[seg] ?? seg; return <Fragment key={href}>{i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />}{isLast ? <span className="font-medium text-foreground">{label}</span> : <Link href={href} className="hover:text-foreground">{label}</Link>}</Fragment>; })}
  </nav>;
}
