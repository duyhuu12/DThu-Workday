'use client';
import { useMemo, useState, useEffect } from 'react';
import { parseISO, isAfter } from 'date-fns';
import { ClipboardList, Search, XCircle, CalendarDays, Clock, MapPin, Award } from 'lucide-react';
import { useAppStore, useCurrentStudent } from '@/hooks/useAppStore';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { REG_STATUS_LABELS, REG_STATUS_VARIANTS, ATT_STATUS_LABELS, ATT_STATUS_VARIANTS, SHIFT_LABELS } from '@/lib/constants';
import { formatDate, formatDateTime } from '@/lib/format';
import type { Registration } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

const TABS = ['all', 'pending', 'approved', 'waitlist', 'completed', 'cancelled', 'absent'] as const;
type Tab = (typeof TABS)[number];
const TAB_LABELS: Record<Tab, string> = { all: 'Tất cả', pending: 'Chờ duyệt', approved: 'Đã duyệt', waitlist: 'Danh sách chờ', completed: 'Đã hoàn thành', cancelled: 'Đã hủy', absent: 'Vắng mặt' };

export default function MyRegistrationsPage() {
  const { registrations, events, updateRegistration, addNotification, fetchRegistrations, fetchEvents } = useAppStore();
  const student = useCurrentStudent();
  const { toast } = useToast();
  const [loading, setLoading] = useState(registrations.length === 0);

  useEffect(() => {
    Promise.all([
      fetchRegistrations(),
      fetchEvents()
    ]).finally(() => setLoading(false));
  }, [fetchRegistrations, fetchEvents]);
  const [tab, setTab] = useState<Tab>('all'); const [search, setSearch] = useState(''); const [statusFilter, setStatusFilter] = useState('all');
  const [cancelTarget, setCancelTarget] = useState<Registration | null>(null);
  const myRegs = useMemo(() => registrations.filter((r) => r.studentId === student?.id), [registrations, student]);
  const filtered = myRegs.filter((r) => { if (tab !== 'all' && r.status !== tab) return false; if (statusFilter !== 'all' && r.status !== statusFilter) return false; if (search) { const ev = events.find((e) => e.id === r.eventId); const q = search.toLowerCase(); if (!ev?.name.toLowerCase().includes(q)) return false; } return true; });
  const counts: Record<string, number> = { all: myRegs.length }; for (const t of TABS) if (t !== 'all') counts[t] = myRegs.filter((r) => r.status === t).length;
  const canCancel = (reg: Registration) => { if (['cancelled', 'completed', 'absent'].includes(reg.status)) return false; const ev = events.find((e) => e.id === reg.eventId); return ev ? isAfter(parseISO(ev.cancellationDeadline), new Date()) : false; };
  async function handleCancel() { if (!cancelTarget) return; const ev = events.find((e) => e.id === cancelTarget.eventId); await updateRegistration(cancelTarget.id, { status: 'cancelled' }); addNotification({ userId: student?.userId ?? '', type: 'registration', title: 'Đã hủy đăng ký', message: `Đã hủy "${ev?.name ?? 'sự kiện'}".`, link: '/student/my-registrations' }); toast({ title: 'Đã hủy đăng ký' }); setCancelTarget(null); }
  if (loading) {
    return <div className="space-y-6">
      <PageHeader title="Đăng ký của tôi" description="Theo dõi các đăng ký ngày công" />
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}><CardContent className="p-5 space-y-3"><Skeleton className="h-6 w-1/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-1/2" /></CardContent></Card>
        ))}
      </div>
    </div>;
  }
  return <div className="space-y-6">
    <PageHeader title="Đăng ký của tôi" description="Theo dõi các đăng ký ngày công" />
    <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
      <div className="overflow-x-auto pb-1"><TabsList className="flex w-max">{TABS.map((t) => <TabsTrigger key={t} value={t} className="gap-1.5">{TAB_LABELS[t]}{counts[t] !== undefined && counts[t] > 0 && <span className="rounded-full bg-primary/15 px-1.5 text-xs font-semibold text-primary">{counts[t]}</span>}</TabsTrigger>)}</TabsList></div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Tìm sự kiện..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="h-9 sm:w-48"><SelectValue placeholder="Trạng thái" /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả</SelectItem>{Object.entries(REG_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
      <div className="mt-4 space-y-3">{filtered.length === 0 ? <EmptyState icon={ClipboardList} title="Không có đăng ký" /> : filtered.map((reg) => { const ev = events.find((e) => e.id === reg.eventId); return <Card key={reg.id} className="transition-shadow hover:shadow-md"><CardContent className="p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="space-y-2"><div className="flex items-start gap-2"><h3 className="font-semibold text-foreground">{ev?.name ?? 'Sự kiện'}</h3><StatusBadge label={REG_STATUS_LABELS[reg.status]} variant={REG_STATUS_VARIANTS[reg.status]} /></div>{ev && <div className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2"><span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> {formatDate(ev.date)}</span><span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {ev.startTime}-{ev.endTime} ({SHIFT_LABELS[ev.shift]})</span><span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {ev.location}</span><span className="flex items-center gap-1.5"><Award className="h-3.5 w-3.5" /> {ev.workdayCredit} ngày công</span></div>}<div className="flex flex-wrap items-center gap-2 text-xs"><span className="text-muted-foreground">Đăng ký: {formatDateTime(reg.registeredAt)}</span>{reg.attendanceStatus && reg.attendanceStatus !== 'not_checked' && <StatusBadge label={ATT_STATUS_LABELS[reg.attendanceStatus]} variant={ATT_STATUS_VARIANTS[reg.attendanceStatus]} />}{reg.workdayResult !== undefined && <span className="rounded-md bg-secondary/10 px-2 py-0.5 font-medium text-secondary">Kết quả: {reg.workdayResult} ngày</span>}</div></div>{canCancel(reg) && <Button variant="outline" size="sm" className="text-destructive" onClick={() => setCancelTarget(reg)}><XCircle className="mr-1 h-4 w-4" /> Hủy đăng ký</Button>}</div></CardContent></Card>; })}</div>
    </Tabs>
    <ConfirmDialog open={!!cancelTarget} onOpenChange={(o) => !o && setCancelTarget(null)} title="Hủy đăng ký" description={`Hủy đăng ký "${events.find((e) => e.id === cancelTarget?.eventId)?.name ?? 'sự kiện'}"?`} confirmLabel="Hủy đăng ký" destructive onConfirm={handleCancel} />
  </div>;
}
