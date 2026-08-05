'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/hooks/useAppStore';

import type { WorkEvent } from '@/types';

const LABEL_MAP: Record<string, string> = {
  student: 'Sinh viên', organizer: 'Người phụ trách', admin: 'Quản trị viên', superadmin: 'Super Admin',
  dashboard: 'Tổng quan', 'work-events': 'Sự kiện ngày công', 'my-registrations': 'Đăng ký của tôi',
  schedule: 'Lịch làm việc', 'work-credits': 'Ngày công', complaints: 'Khiếu nại', notifications: 'Thông báo',
  profile: 'Hồ sơ', events: 'Sự kiện', new: 'Tạo mới', edit: 'Chỉnh sửa', registrations: 'Đăng ký',
  attendance: 'Điểm danh', results: 'Kết quả', reports: 'Báo cáo', 'event-approvals': 'Duyệt sự kiện',
  students: 'Sinh viên', classes: 'Lớp học', faculties: 'Khoa', 'activity-logs': 'Nhật ký hoạt động',
  users: 'Người dùng', roles: 'Vai trò & quyền', settings: 'Cài đặt hệ thống',
};

export function getPageTitle(pathname: string, events?: WorkEvent[]): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return 'Trang chủ';
  const lastSeg = segments[segments.length - 1];
  let label = LABEL_MAP[lastSeg];
  if (!label && events) {
    const event = events.find((e) => e.id === lastSeg || e.id.toString() === lastSeg);
    if (event) {
      label = event.name;
    }
  }
  return label ?? lastSeg;
}

const ROLE_HOME_MAP: Record<string, string> = {
  student: '/student/dashboard',
  organizer: '/organizer/dashboard',
  admin: '/admin/dashboard',
  superadmin: '/superadmin/dashboard',
};

export function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname();
  const { events } = useAppStore();
  if (!pathname) return null;
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length <= 1) return null;
  let href = '';
  return <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1.5 text-sm text-muted-foreground', className)}>
    {segments.map((seg, i) => {
      href += `/${seg}`;
      const linkHref = i === 0 && ROLE_HOME_MAP[seg] ? ROLE_HOME_MAP[seg] : href;
      const isLast = i === segments.length - 1;
      
      let label = LABEL_MAP[seg];
      if (!label) {
        const event = events.find((e) => e.id === seg || e.id.toString() === seg);
        if (event) {
          label = event.name;
        } else {
          label = seg;
        }
      }
      
      return <Fragment key={linkHref}>{i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />}{isLast ? <span className="font-medium text-foreground">{label}</span> : <Link href={linkHref} className="hover:text-foreground">{label}</Link>}</Fragment>;
    })}
  </nav>;
}
