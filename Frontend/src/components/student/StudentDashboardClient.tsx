'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { format, isAfter, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Award,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { useAppStore, useCurrentStudent } from '@/hooks/useAppStore';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  EVENT_STATUS_LABELS,
  EVENT_STATUS_VARIANTS,
  SHIFT_LABELS,
} from '@/lib/constants';
import { formatDate, formatDateTime } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';

export default function StudentDashboardClient() {
  const {
    events,
    registrations,
    credits,
    notifications,
    faculties,
    classes,
    settings,
    fetchEvents,
    fetchRegistrations,
    fetchCredits,
    fetchNotifications,
    fetchCurrentStudent,
  } = useAppStore();
  const student = useCurrentStudent();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchCurrentStudent(),
      fetchEvents(),
      fetchRegistrations(),
      fetchCredits(),
      fetchNotifications(),
    ]).finally(() => setLoading(false));
  }, [
    fetchCurrentStudent,
    fetchEvents,
    fetchRegistrations,
    fetchCredits,
    fetchNotifications,
  ]);

  const myRegs = useMemo(
    () => registrations.filter((registration) => registration.studentId === student?.id),
    [registrations, student],
  );

  const myCredits = useMemo(
    () => credits.filter((credit) => credit.studentId === student?.id),
    [credits, student],
  );

  const upcoming = myRegs.filter((registration) => {
    if (!['approved', 'pending', 'waitlist'].includes(registration.status)) return false;
    const event = events.find((item) => item.id === registration.eventId);
    const date = registration.selectedDate || event?.date;
    return Boolean(date && isAfter(parseISO(date), new Date()));
  });

  const completed = myRegs.filter((registration) => registration.status === 'completed');
  const earnedFromCredits = myCredits
    .filter((credit) => ['recorded', 'adjusted'].includes(credit.status))
    .reduce((sum, credit) => sum + credit.creditValue, 0);
  const total = earnedFromCredits || student?.accumulatedWorkdays || 0;
  const required = Math.max(1, settings.defaultRequiredWorkdays);
  const remaining = Math.max(0, required - total);
  const progress = Math.min(100, (total / required) * 100);
  const openEvents = events
    .filter(
      (event) =>
        event.status === 'open' &&
        isAfter(parseISO(event.registrationClose), new Date()),
    )
    .slice(0, 3);

  const chartData = useMemo(() => {
    const months: Array<{ month: string; ngayCong: number }> = [];
    const now = new Date();

    for (let index = 5; index >= 0; index -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
      const monthPrefix = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const value = myCredits
        .filter(
          (credit) =>
            ['recorded', 'adjusted'].includes(credit.status) &&
            credit.eventDate.startsWith(monthPrefix),
        )
        .reduce((sum, credit) => sum + credit.creditValue, 0);

      months.push({ month: format(date, 'MM/yyyy'), ngayCong: value });
    }

    return months;
  }, [myCredits]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Tổng quan" description="Xin chào, đây là tình hình ngày công của bạn" />
        <Card className="overflow-hidden border-primary/20">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-7 w-1/3" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            <Skeleton className="h-16 w-24 rounded-lg" />
          </CardContent>
        </Card>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <Card key={item}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-12" />
                </div>
                <Skeleton className="h-10 w-10 rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="space-y-6">
        <PageHeader title="Tổng quan" />
        <EmptyState
          icon={CalendarDays}
          title="Chưa có thông tin sinh viên"
          description="Tài khoản chưa được liên kết với hồ sơ sinh viên trong database."
        />
      </div>
    );
  }

  const facultyName =
    student.facultyName || faculties.find((faculty) => faculty.id === student.facultyId)?.name || '—';
  const className =
    student.className || classes.find((item) => item.id === student.classId)?.name || '—';

  return (
    <div className="space-y-6">
      <PageHeader title="Tổng quan" description="Xin chào, đây là tình hình ngày công của bạn" />

      <Card className="overflow-hidden border-primary/20">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Chào mừng trở lại,</p>
            <h2 className="text-xl font-bold text-foreground">{student.fullName}</h2>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span>
                Mã SV: <span className="font-medium text-foreground">{student.studentCode}</span>
              </span>
              <span>
                Lớp: <span className="font-medium text-foreground">{className}</span>
              </span>
              <span>
                Khoa: <span className="font-medium text-foreground">{facultyName}</span>
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 rounded-lg bg-primary/5 p-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{total}</p>
              <p className="text-xs text-muted-foreground">/ {required} ngày công</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Ngày công tích lũy" value={total} icon={Award} iconClassName="bg-primary/10 text-primary" />
        <StatCard
          title="Ngày công còn lại"
          value={remaining}
          icon={TrendingUp}
          iconClassName="bg-warning/10 text-warning"
          description={`Yêu cầu: ${required} ngày`}
        />
        <StatCard title="Sự kiện sắp tới" value={upcoming.length} icon={CalendarCheck2} iconClassName="bg-info/10 text-info" />
        <StatCard title="Đã hoàn thành" value={completed.length} icon={CheckCircle2} iconClassName="bg-success/10 text-success" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tiến độ ngày công</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Đã hoàn thành {total} / {required} ngày công</span>
            <span className="font-semibold text-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-3" />
          {remaining > 0 ? (
            <p className="text-sm text-muted-foreground">
              Bạn cần tích lũy thêm <span className="font-semibold text-foreground">{remaining}</span> ngày công.
            </p>
          ) : (
            <p className="text-sm font-medium text-success">Bạn đã hoàn thành yêu cầu ngày công!</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Lịch sử ngày công theo tháng</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="student-credit-chart" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 13 }} />
                <Area
                  type="monotone"
                  dataKey="ngayCong"
                  name="Ngày công"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#student-credit-chart)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Sự kiện đang mở đăng ký</CardTitle>
            <Link href="/student/work-events" className="text-xs text-primary hover:underline">
              Xem tất cả
            </Link>
          </CardHeader>
          <CardContent className="space-y-3 flex-1">
            {openEvents.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <CalendarDays className="mb-2 h-7 w-7 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Không có sự kiện mở</p>
              </div>
            ) : (
              openEvents.map((event) => (
                <Link key={event.id} href={`/student/work-events/${event.id}`} className="block">
                  <div className="rounded-lg border p-3 transition-all hover:border-primary/40 hover:shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold leading-tight text-foreground text-sm line-clamp-1">{event.name}</h4>
                      <StatusBadge label={EVENT_STATUS_LABELS[event.status]} variant={EVENT_STATUS_VARIANTS[event.status]} />
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <p className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" /> {formatDate(event.date)}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" /> {event.startTime} - {event.endTime} ({SHIFT_LABELS[event.shift]})
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
