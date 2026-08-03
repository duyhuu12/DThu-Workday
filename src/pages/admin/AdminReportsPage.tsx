'use client';
import { useMemo } from 'react';
import { BarChart3, CalendarDays, Users, Award, MessageSquareWarning } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useAppStore } from '@/hooks/useAppStore';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/common/DataTable';
import { EVENT_STATUS_LABELS } from '@/lib/constants';
import { formatDate } from '@/lib/format';
import type { WorkEvent } from '@/types';

const PIE_COLORS = ['#hsl(var(--primary))', '#hsl(var(--secondary))', '#f59e0b', '#hsl(var(--success))', '#64748b', '#ef4444'];

export default function AdminReportsPage() {
  const { events, students, registrations, complaints, credits, faculties } = useAppStore();
  const totalCredits = credits.filter((c) => c.status === 'recorded').reduce((s, c) => s + c.creditValue, 0);
  const completionRate = students.length > 0 ? Math.round((students.filter((s) => s.accumulatedWorkdays >= s.requiredWorkdays).length / students.length) * 100) : 0;
  const byFaculty = useMemo(() => faculties.map((f) => { const stu = students.filter((s) => s.facultyId === f.id); const regs = registrations.filter((r) => r.facultyId === f.id); const cr = credits.filter((c) => c.facultyId === f.id && c.status === 'recorded').reduce((s, c) => s + c.creditValue, 0); return { name: f.name.length > 25 ? f.name.slice(0, 25) + '...' : f.name, sinhViên: stu.length, đăngKý: regs.length, ngàyCông: cr }; }), [faculties, students, registrations, credits]);
  const eventsByStatus = useMemo(() => { const map: Record<string, number> = {}; for (const e of events) map[e.status] = (map[e.status] ?? 0) + 1; return Object.entries(map).map(([name, value]) => ({ name: EVENT_STATUS_LABELS[name as keyof typeof EVENT_STATUS_LABELS] ?? name, value })); }, [events]);
  const topStudents = useMemo(() => [...students].sort((a, b) => b.accumulatedWorkdays - a.accumulatedWorkdays).slice(0, 10), [students]);
  const columns: Column<typeof students[number]>[] = [
    { key: 'studentCode', header: 'Mã SV', sortable: true, sortValue: (s) => s.studentCode, render: (s) => <span className="font-mono text-xs">{s.studentCode}</span> },
    { key: 'fullName', header: 'Họ tên', sortable: true, sortValue: (s) => s.fullName, render: (s) => <span className="font-medium">{s.fullName}</span> },
    { key: 'faculty', header: 'Khoa', render: (s) => <span className="text-muted-foreground">{faculties.find((f) => f.id === s.facultyId)?.name ?? '—'}</span> },
    { key: 'accumulated', header: 'Tích lũy', sortable: true, sortValue: (s) => s.accumulatedWorkdays, render: (s) => <span className="font-medium text-secondary">{s.accumulatedWorkdays}</span> },
    { key: 'required', header: 'Yêu cầu', render: (s) => <span>{s.requiredWorkdays}</span> },
    { key: 'pct', header: 'Hoàn thành', sortable: true, sortValue: (s) => Math.round((s.accumulatedWorkdays / s.requiredWorkdays) * 100), render: (s) => <span className={s.accumulatedWorkdays >= s.requiredWorkdays ? 'font-medium text-success' : ''}>{Math.round((s.accumulatedWorkdays / s.requiredWorkdays) * 100)}%</span> },
  ];
  return <div className="space-y-6">
    <PageHeader title="Báo cáo" description="Thống kê tổng quan hệ thống" />
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard title="Tổng sự kiện" value={events.length} icon={CalendarDays} iconClassName="bg-primary/10 text-primary" />
      <StatCard title="Tổng sinh viên" value={students.length} icon={Users} iconClassName="bg-info/10 text-info" />
      <StatCard title="Tổng ngày công" value={totalCredits} suffix="ngày" icon={Award} iconClassName="bg-secondary/10 text-secondary" />
      <StatCard title="Khiếu nại" value={complaints.length} icon={MessageSquareWarning} iconClassName="bg-warning/10 text-warning" />
    </div>
    <Card><CardHeader><CardTitle className="text-base">Thống kê theo khoa</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><BarChart data={byFaculty} margin={{ top: 5, right: 10, left: -20, bottom: 60 }}><CartesianGrid strokeDasharray="3 3" className="stroke-muted" /><XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={70} /><YAxis allowDecimals={false} tick={{ fontSize: 12 }} /><Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 13 }} /><Bar dataKey="sinhViên" name="Sinh viên" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} /><Bar dataKey="đăngKý" name="Đăng ký" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></CardContent></Card>
    <div className="grid gap-6 lg:grid-cols-2">
      <Card><CardHeader><CardTitle className="text-base">Sự kiện theo trạng thái</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={260}><PieChart><Pie data={eventsByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e) => e.name}>{eventsByStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}</Pie><Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 13 }} /><Legend wrapperStyle={{ fontSize: 11 }} /></PieChart></ResponsiveContainer></CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Top sinh viên ngày công</CardTitle></CardHeader><CardContent><DataTable columns={columns} data={topStudents} rowKey={(s) => s.id} pageSize={5} /></CardContent></Card>
    </div>
  </div>;
}
