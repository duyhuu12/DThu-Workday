'use client';
import { useMemo } from 'react';
import { BarChart3, CalendarDays, Users, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useAppStore } from '@/hooks/useAppStore';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function OrganizerReportsPage() {
  const { events, registrations, currentUser } = useAppStore();
  const myEvents = useMemo(() => events.filter((e) => e.organizerId === currentUser?.id), [events, currentUser]);
  const myEventIds = myEvents.map((e) => e.id);
  const myRegs = registrations.filter((r) => myEventIds.includes(r.eventId));
  const totalCredits = myRegs.filter((r) => r.workdayResult !== undefined).reduce((s, r) => s + (r.workdayResult ?? 0), 0);
  const byEvent = useMemo(() => myEvents.map((e) => { const regs = myRegs.filter((r) => r.eventId === e.id); const present = regs.filter((r) => r.attendanceStatus === 'checked_out').length; return { name: e.name.length > 20 ? e.name.slice(0, 20) + '...' : e.name, đăngKý: regs.length, cóMặt: present, ngàyCông: regs.reduce((s, r) => s + (r.workdayResult ?? 0), 0) }; }), [myEvents, myRegs]);
  const byMonth = useMemo(() => { const map: Record<string, { events: number; regs: number }> = {}; for (const e of myEvents) { const m = e.date.slice(0, 7); (map[m] ??= { events: 0, regs: 0 }); map[m].events++; map[m].regs += myRegs.filter((r) => r.eventId === e.id).length; } return Object.entries(map).sort().map(([month, v]) => ({ month: month.replace('-', '/'), sựKiện: v.events, đăngKý: v.regs })); }, [myEvents, myRegs]);

  return <div className="space-y-6">
    <PageHeader title="Báo cáo" description="Thống kê sự kiện và ngày công" />
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard title="Tổng sự kiện" value={myEvents.length} icon={CalendarDays} iconClassName="bg-primary/10 text-primary" />
      <StatCard title="Tổng đăng ký" value={myRegs.length} icon={Users} iconClassName="bg-info/10 text-info" />
      <StatCard title="Tổng ngày công" value={totalCredits} suffix="ngày" icon={Award} iconClassName="bg-secondary/10 text-secondary" />
      <StatCard title="Sự kiện hoàn thành" value={myEvents.filter((e) => e.status === 'completed').length} icon={BarChart3} iconClassName="bg-success/10 text-success" />
    </div>
    <Card><CardHeader><CardTitle className="text-base">Thống kê theo sự kiện</CardTitle></CardHeader><CardContent>{byEvent.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Chưa có dữ liệu</p> : <ResponsiveContainer width="100%" height={300}><BarChart data={byEvent} margin={{ top: 5, right: 10, left: -20, bottom: 60 }}><CartesianGrid strokeDasharray="3 3" className="stroke-muted" /><XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={70} /><YAxis allowDecimals={false} tick={{ fontSize: 12 }} /><Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 13 }} /><Bar dataKey="đăngKý" name="Đăng ký" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} /><Bar dataKey="cóMặt" name="Có mặt" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>}</CardContent></Card>
    <Card><CardHeader><CardTitle className="text-base">Xu hướng theo tháng</CardTitle></CardHeader><CardContent>{byMonth.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Chưa có dữ liệu</p> : <ResponsiveContainer width="100%" height={260}><LineChart data={byMonth} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" className="stroke-muted" /><XAxis dataKey="month" tick={{ fontSize: 12 }} /><YAxis allowDecimals={false} tick={{ fontSize: 12 }} /><Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 13 }} /><Line type="monotone" dataKey="sựKiện" name="Sự kiện" stroke="hsl(var(--primary))" strokeWidth={2} /><Line type="monotone" dataKey="đăngKý" name="Đăng ký" stroke="hsl(var(--secondary))" strokeWidth={2} /></LineChart></ResponsiveContainer>}</CardContent></Card>
  </div>;
}
