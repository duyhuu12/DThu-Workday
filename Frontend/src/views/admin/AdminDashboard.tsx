'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Award,
  Clock,
  MessageSquareWarning,
  ShieldCheck,
  Users,
} from 'lucide-react';
import {
  Cell,
  Label,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useAppStore } from '@/hooks/useAppStore';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EVENT_STATUS_LABELS, EVENT_STATUS_VARIANTS } from '@/lib/constants';
import { formatDate } from '@/lib/format';

const FACULTY_COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#7c3aed', '#0891b2', '#e11d48', '#64748b'];
const REGISTRATION_COLORS = {
  approved: '#059669',
  pending: '#f59e0b',
};

const tooltipStyle = {
  borderRadius: 8,
  border: '1px solid hsl(var(--border))',
  fontSize: 12,
};

export default function AdminDashboard() {
  const { events, students, registrations, complaints, activityLogs } = useAppStore();

  const pendingEvents = useMemo(() => events.filter((event) => event.status === 'pending'), [events]);
  const pendingComplaints = complaints.filter(
    (complaint) => complaint.status === 'submitted' || complaint.status === 'processing',
  );
  const totalCredits = registrations
    .filter((registration) => registration.workdayResult !== undefined)
    .reduce((total, registration) => total + (registration.workdayResult ?? 0), 0);

  const registrationsByFaculty = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const registration of registrations) {
      const facultyName = registration.facultyName || 'Chưa xác định';
      counts[facultyName] = (counts[facultyName] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [registrations]);

  const registrationStatuses = useMemo(() => [
    {
      name: 'Đã duyệt',
      value: registrations.filter((item) => ['approved', 'completed'].includes(item.status)).length,
      color: REGISTRATION_COLORS.approved,
    },
    {
      name: 'Chưa hoàn tất',
      value: registrations.filter((item) => !['approved', 'completed'].includes(item.status)).length,
      color: REGISTRATION_COLORS.pending,
    },
  ], [registrations]);

  const activeRegistrationCount = registrations.length;
  const recentLogs = activityLogs.slice(0, 5);

  return (
    <div className="space-y-5 pb-6">
      <PageHeader title="Tổng quan" description="Theo dõi nhanh hoạt động của hệ thống" />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard className="p-4" title="Tổng sinh viên" value={students.length} icon={Users} iconClassName="bg-primary/10 text-primary" />
        <StatCard className="p-4" title="Sự kiện chờ duyệt" value={pendingEvents.length} icon={Clock} iconClassName="bg-warning/10 text-warning" />
        <StatCard className="p-4" title="Ngày công đã ghi nhận" value={totalCredits} suffix="ngày" description="Tổng ngày công đã cấp cho sinh viên" icon={Award} iconClassName="bg-success/10 text-success" />
        <StatCard className="p-4" title="Khiếu nại đang xử lý" value={pendingComplaints.length} icon={MessageSquareWarning} iconClassName="bg-destructive/10 text-destructive" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard
          title="Đăng ký theo khoa"
          description="Tỷ trọng lượt đăng ký của từng khoa"
        >
          {registrationsByFaculty.length === 0 ? (
            <ChartEmpty />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={registrationsByFaculty}
                  dataKey="value"
                  nameKey="name"
                  cx="42%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={86}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {registrationsByFaculty.map((item, index) => (
                    <Cell key={item.name} fill={FACULTY_COLORS[index % FACULTY_COLORS.length]} />
                  ))}
                  <Label value={registrations.length} position="center" className="fill-foreground text-xl font-bold" />
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value} lượt`, 'Đăng ký']} />
                <Legend
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, lineHeight: '22px', maxWidth: '48%' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Trạng thái đăng ký"
          description="So sánh đăng ký đã duyệt và chưa hoàn tất"
        >
          {registrations.length === 0 ? (
            <ChartEmpty />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={registrationStatuses}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="47%"
                  innerRadius={58}
                  outerRadius={86}
                  paddingAngle={4}
                  strokeWidth={0}
                >
                  {registrationStatuses.map((item) => <Cell key={item.name} fill={item.color} />)}
                  <Label value={activeRegistrationCount} position="center" className="fill-foreground text-xl font-bold" />
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value} lượt`, 'Đăng ký']} />
                <Legend verticalAlign="bottom" iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 px-5 py-4">
            <CardTitle className="text-base">Sự kiện chờ duyệt</CardTitle>
            {pendingEvents.length > 0 && (
              <Button asChild variant="ghost" size="sm" className="h-8 text-primary">
                <Link href="/admin/event-approvals">Xem tất cả <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            )}
          </CardHeader>
          <CardContent className="px-5 pb-4">
            {pendingEvents.length === 0 ? (
              <EmptyState icon={ShieldCheck} title="Không có sự kiện chờ duyệt" className="min-h-40" />
            ) : (
              <div className="divide-y">
                {pendingEvents.slice(0, 4).map((event) => (
                  <div key={event.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{event.name}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{formatDate(event.date)} · {event.organizerName}</p>
                    </div>
                    <StatusBadge label={EVENT_STATUS_LABELS[event.status]} variant={EVENT_STATUS_VARIANTS[event.status]} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="px-5 py-4"><CardTitle className="text-base">Hoạt động gần đây</CardTitle></CardHeader>
          <CardContent className="px-5 pb-4">
            {recentLogs.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Chưa có hoạt động</p>
            ) : (
              <div className="divide-y">
                {recentLogs.map((log) => (
                  <div key={log.id} className="py-2.5 first:pt-0 last:pb-0">
                    <p className="truncate text-sm"><span className="font-semibold">{log.userName}</span> <span className="text-muted-foreground">· {log.action}</span></p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{log.affectedItem}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="px-5 pb-1 pt-4">
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="px-3 pb-3">{children}</CardContent>
    </Card>
  );
}

function ChartEmpty() {
  return <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">Chưa có dữ liệu</div>;
}
