'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Award, CalendarDays, CheckCircle2, Loader2, UserCheck, Users } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { DataTable, type Column } from '@/components/common/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EVENT_STATUS_LABELS, EVENT_STATUS_VARIANTS } from '@/lib/constants';
import { formatDate } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';
import { getClassLeaderDashboard } from '@/services/classLeaderApi';
import type { ClassLeaderDashboardData, ClassLeaderStudent } from '@/types';

export default function ClassLeaderDashboard() {
  const { toast } = useToast();
  const [data, setData] = useState<ClassLeaderDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getClassLeaderDashboard()
      .then((result) => active && setData(result))
      .catch((error: unknown) => toast({
        title: 'Không thể tải tổng quan lớp',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
        variant: 'destructive',
      }))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [toast]);

  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const totals = data?.totals ?? {
    students: 0, sufficientStudents: 0, insufficientStudents: 0,
    upcomingEvents: 0, registrations: 0, preliminaryConfirmed: 0,
  };

  const studentColumns: Column<ClassLeaderStudent>[] = [
    { key: 'studentCode', header: 'Mã SV', sortable: true, sortValue: (student) => student.studentCode },
    { key: 'fullName', header: 'Họ tên', sortable: true, sortValue: (student) => student.fullName, render: (student) => <span className="font-medium">{student.fullName}</span> },
    { key: 'progress', header: 'Tiến độ', render: (student) => {
      const percent = student.requiredWorkdays > 0 ? Math.min(100, Math.round(student.accumulatedWorkdays / student.requiredWorkdays * 100)) : 0;
      return <div className="min-w-44 space-y-1"><div className="flex justify-between text-xs"><span>{student.accumulatedWorkdays}/{student.requiredWorkdays} ngày</span><span className="text-destructive">Thiếu {student.missingWorkdays}</span></div><Progress value={percent} className="h-2" /></div>;
    } },
  ];

  return <div className="space-y-6">
    <PageHeader
      title="Tổng quan lớp"
      description={data?.profile ? `${data.profile.className} · ${data.profile.facultyName}` : 'Theo dõi tiến độ lao động của lớp'}
    >
      <Button asChild><Link href="/classleader/registrations"><UserCheck className="mr-2 h-4 w-4" />Theo dõi đăng ký</Link></Button>
    </PageHeader>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard title="Sinh viên trong lớp" value={totals.students} icon={Users} />
      <StatCard title="Đã đủ ngày công" value={totals.sufficientStudents} icon={CheckCircle2} iconClassName="bg-emerald-100 text-emerald-700" />
      <StatCard title="Chưa đủ ngày công" value={totals.insufficientStudents} icon={Award} iconClassName="bg-amber-100 text-amber-700" />
      <StatCard title="Sự kiện sắp tới" value={totals.upcomingEvents} icon={CalendarDays} iconClassName="bg-blue-100 text-blue-700" />
      <StatCard title="Đã xác nhận sơ bộ" value={totals.preliminaryConfirmed} icon={UserCheck} iconClassName="bg-violet-100 text-violet-700" />
    </div>

    <div className="grid gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader className="flex-row items-center justify-between"><CardTitle className="text-base">Sinh viên chưa đủ ngày công</CardTitle><Button variant="outline" size="sm" asChild><Link href="/classleader/reminders">Gửi nhắc nhở</Link></Button></CardHeader>
        <CardContent>
          <DataTable columns={studentColumns} data={data?.insufficientStudents ?? []} rowKey={(student) => student.id} pageSize={5} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between"><CardTitle className="text-base">Sự kiện áp dụng cho lớp</CardTitle><Button variant="outline" size="sm" asChild><Link href="/classleader/registrations">Xem tất cả</Link></Button></CardHeader>
        <CardContent className="space-y-3">
          {(data?.upcomingEvents ?? []).length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Chưa có sự kiện phù hợp</p> : data?.upcomingEvents.map((event) => <div key={event.id} className="rounded-lg border p-3">
            <div className="flex items-start justify-between gap-3"><div><p className="font-medium">{event.name}</p><p className="mt-1 text-xs text-muted-foreground">{event.code} · {formatDate(event.date)}</p></div><StatusBadge label={EVENT_STATUS_LABELS[event.status]} variant={EVENT_STATUS_VARIANTS[event.status]} /></div>
            <p className="mt-3 text-sm text-muted-foreground">Lớp đã đăng ký: <span className="font-semibold text-foreground">{event.classRegistrationCount}</span> sinh viên</p>
          </div>)}
        </CardContent>
      </Card>
    </div>
  </div>;
}
