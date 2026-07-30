'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { CalendarDays, Users, Award, MessageSquareWarning, ShieldCheck, Clock, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useAppStore } from '@/hooks/useAppStore';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EVENT_STATUS_LABELS, EVENT_STATUS_VARIANTS } from '@/lib/constants';
import { formatDate } from '@/lib/format';

const PIE_COLORS = ['hsl(var(--primary))', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#64748b'];

export default function AdminDashboard() {
  const { events, students, registrations, complaints, activityLogs } = useAppStore();
  const pendingEvents = useMemo(() => events.filter((e) => e.status === 'pending'), [events]);
  const pendingComplaints = complaints.filter((c) => c.status === 'submitted' || c.status === 'processing');
  const totalCredits = registrations.filter((r) => r.workdayResult !== undefined).reduce((s, r) => s + (r.workdayResult ?? 0), 0);
  const eventsByStatus = useMemo(() => { const map: Record<string, number> = {}; for (const e of events) map[e.status] = (map[e.status] ?? 0) + 1; return Object.entries(map).map(([name, value]) => ({ name: EVENT_STATUS_LABELS[name as keyof typeof EVENT_STATUS_LABELS] ?? name, value })); }, [events]);
  const regsByFaculty = useMemo(() => { const map: Record<string, number> = {}; for (const r of registrations) map[r.facultyName] = (map[r.facultyName] ?? 0) + 1; return Object.entries(map).map(([name, value]) => ({ name, value })); }, [registrations]);
  const recentLogs = activityLogs.slice(0, 6);

  return <div className="space-y-6">
    <PageHeader title="Tổng quan" description="Bảng điều khiển quản trị viên" />
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard title="Tổng sinh viên" value={students.length} icon={Users} iconClassName="bg-primary/10 text-primary" />
      <StatCard title="Sự kiện chờ duyệt" value={pendingEvents.length} icon={Clock} iconClassName="bg-warning/10 text-warning" />
      <StatCard title="Tổng ngày công" value={totalCredits} suffix="ngày" icon={Award} iconClassName="bg-secondary/10 text-secondary" />
      <StatCard title="Khiếu nại đang xử lý" value={pendingComplaints.length} icon={MessageSquareWarning} iconClassName="bg-destructive/10 text-destructive" />
    </div>
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2"><CardHeader><CardTitle className="text-base">Đăng ký theo khoa</CardTitle></CardHeader><CardContent>{regsByFaculty.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Chưa có dữ liệu</p> : <ResponsiveContainer width="100%" height={260}><BarChart data={regsByFaculty} layout="vertical" margin={{ top: 5, right: 10, left: 80, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" className="stroke-muted" /><XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} /><YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} /><Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 13 }} /><Bar dataKey="value" name="Đăng ký" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer>}</CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Sự kiện theo trạng thái</CardTitle></CardHeader><CardContent>{eventsByStatus.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Chưa có dữ liệu</p> : <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={eventsByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={(e) => e.name}>{eventsByStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}</Pie><Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 13 }} /><Legend wrapperStyle={{ fontSize: 11 }} /></PieChart></ResponsiveContainer>}</CardContent></Card>
    </div>
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h3 className="text-lg font-semibold text-foreground">Sự kiện chờ duyệt</h3>{pendingEvents.length > 0 && <Button asChild variant="outline" size="sm"><Link href="/admin/event-approvals">Xem tất cả <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>}</div>
      {pendingEvents.length === 0 ? <EmptyState icon={ShieldCheck} title="Không có sự kiện chờ duyệt" /> : <div className="space-y-2">{pendingEvents.slice(0, 4).map((e) => <Card key={e.id}><CardContent className="flex items-center justify-between p-4"><div><p className="font-medium text-foreground">{e.name}</p><p className="text-sm text-muted-foreground">{formatDate(e.date)} • {e.organizerName}</p></div><StatusBadge label={EVENT_STATUS_LABELS[e.status]} variant={EVENT_STATUS_VARIANTS[e.status]} /></CardContent></Card>)}</div>}
    </div>
    <Card><CardHeader><CardTitle className="text-base">Hoạt động gần đây</CardTitle></CardHeader><CardContent className="space-y-2">{recentLogs.map((log) => <div key={log.id} className="flex items-center justify-between border-b pb-2 text-sm last:border-0 last:pb-0"><div><span className="font-medium text-foreground">{log.userName}</span><span className="text-muted-foreground"> • {log.action}</span></div><span className="text-xs text-muted-foreground">{log.affectedItem}</span></div>)}</CardContent></Card>
  </div>;
}
