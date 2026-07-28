'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { CalendarDays, Users, ClipboardList, CheckCircle2, Clock, ArrowRight, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useAppStore } from '@/hooks/useAppStore';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EVENT_STATUS_LABELS, EVENT_STATUS_VARIANTS, REG_STATUS_LABELS, REG_STATUS_VARIANTS } from '@/lib/constants';
import { formatDate } from '@/lib/format';

const PIE_COLORS = ['#hsl(var(--primary))', '#hsl(var(--secondary))', '#f59e0b', '#hsl(var(--success))', '#64748b', '#ef4444'];

export default function OrganizerDashboard() {
  const { events, registrations, currentUser } = useAppStore();
  const myEvents = useMemo(() => events.filter((e) => e.organizerId === currentUser?.id), [events, currentUser]);
  const myEventIds = myEvents.map((e) => e.id);
  const myRegs = registrations.filter((r) => myEventIds.includes(r.eventId));
  const pending = myRegs.filter((r) => r.status === 'pending');
  const approved = myRegs.filter((r) => r.status === 'approved');
  const completed = myRegs.filter((r) => r.status === 'completed');
  const openEvents = myEvents.filter((e) => e.status === 'open');
  const regByStatus = useMemo(() => { const map: Record<string, number> = {}; for (const r of myRegs) map[r.status] = (map[r.status] ?? 0) + 1; return Object.entries(map).map(([name, value]) => ({ name: REG_STATUS_LABELS[name as keyof typeof REG_STATUS_LABELS] ?? name, value })); }, [myRegs]);
  const eventsByMonth = useMemo(() => { const map: Record<string, number> = {}; for (const e of myEvents) { const m = e.date.slice(0, 7); map[m] = (map[m] ?? 0) + 1; } return Object.entries(map).sort().map(([month, count]) => ({ month: month.replace('-', '/'), count })); }, [myEvents]);

  return <div className="space-y-6">
    <PageHeader title="Tổng quan" description={`Xin chào, ${currentUser?.name}`} />
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard title="Sự kiện quản lý" value={myEvents.length} icon={CalendarDays} iconClassName="bg-primary/10 text-primary" />
      <StatCard title="Đăng ký chờ duyệt" value={pending.length} icon={Clock} iconClassName="bg-warning/10 text-warning" />
      <StatCard title="Đã duyệt" value={approved.length} icon={CheckCircle2} iconClassName="bg-success/10 text-success" />
      <StatCard title="Đã hoàn thành" value={completed.length} icon={Users} iconClassName="bg-secondary/10 text-secondary" />
    </div>
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2"><CardHeader><CardTitle className="text-base">Sự kiện theo tháng</CardTitle></CardHeader><CardContent>{eventsByMonth.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Chưa có dữ liệu</p> : <ResponsiveContainer width="100%" height={260}><BarChart data={eventsByMonth} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" className="stroke-muted" /><XAxis dataKey="month" tick={{ fontSize: 12 }} /><YAxis allowDecimals={false} tick={{ fontSize: 12 }} /><Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 13 }} /><Bar dataKey="count" name="Sự kiện" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>}</CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Đăng ký theo trạng thái</CardTitle></CardHeader><CardContent>{regByStatus.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Chưa có dữ liệu</p> : <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={regByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e) => e.name}>{regByStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}</Pie><Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 13 }} /><Legend wrapperStyle={{ fontSize: 12 }} /></PieChart></ResponsiveContainer>}</CardContent></Card>
    </div>
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h3 className="text-lg font-semibold text-foreground">Đăng ký chờ duyệt</h3>{pending.length > 0 && <Button asChild variant="outline" size="sm"><Link href="/organizer/events">Xem tất cả <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>}</div>
      {pending.length === 0 ? <EmptyState icon={ClipboardList} title="Không có đăng ký chờ duyệt" /> : <div className="space-y-2">{pending.slice(0, 5).map((r) => { const ev = events.find((e) => e.id === r.eventId); return <Card key={r.id}><CardContent className="flex items-center justify-between p-4"><div><p className="font-medium text-foreground">{r.studentName}</p><p className="text-sm text-muted-foreground">{r.studentCode} • {ev?.name}</p></div><StatusBadge label={REG_STATUS_LABELS[r.status]} variant={REG_STATUS_VARIANTS[r.status]} /></CardContent></Card>; })}</div>}
    </div>
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h3 className="text-lg font-semibold text-foreground">Sự kiện đang mở</h3><Button asChild size="sm"><Link href="/organizer/events/new"><Plus className="mr-1 h-4 w-4" /> Tạo sự kiện</Link></Button></div>
      {openEvents.length === 0 ? <EmptyState icon={CalendarDays} title="Không có sự kiện đang mở" /> : <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{openEvents.map((e) => <Link key={e.id} href={`/organizer/events/${e.id}`}><Card className="h-full transition-all hover:border-primary/40 hover:shadow-md"><CardContent className="space-y-2 p-5"><div className="flex items-start justify-between gap-2"><h4 className="font-semibold text-foreground">{e.name}</h4><StatusBadge label={EVENT_STATUS_LABELS[e.status]} variant={EVENT_STATUS_VARIANTS[e.status]} /></div><p className="text-sm text-muted-foreground">{formatDate(e.date)}</p><p className="text-sm text-muted-foreground">{e.registeredCount}/{e.maxCapacity} đăng ký</p></CardContent></Card></Link>)}</div>}
    </div>
  </div>;
}
