'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Clock, MapPin, Users, Search, LayoutGrid, Table as TableIcon, X } from 'lucide-react';
import { useAppStore } from '@/hooks/useAppStore';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DataTable, type Column } from '@/components/common/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { WorkEvent } from '@/types';
import { EVENT_STATUS_LABELS, EVENT_STATUS_VARIANTS, SHIFT_LABELS } from '@/lib/constants';
import { formatDate, formatDateTime } from '@/lib/format';

export default function WorkEventsPage() {
  const { events, faculties } = useAppStore();
  const [search, setSearch] = useState(''); const [status, setStatus] = useState('all');
  const [faculty, setFaculty] = useState('all'); const [shift, setShift] = useState('all');
  const [avail, setAvail] = useState('all'); const [view, setView] = useState<'card' | 'table'>('card');
  const filtered = useMemo(() => events.filter((e) => {
    if (search) { const q = search.toLowerCase(); if (!e.name.toLowerCase().includes(q) && !e.location.toLowerCase().includes(q)) return false; }
    if (status !== 'all' && e.status !== status) return false;
    if (faculty !== 'all' && !e.eligibleFacultyIds.includes(faculty)) return false;
    if (shift !== 'all' && e.shift !== shift) return false;
    if (avail === 'available' && e.registeredCount >= e.maxCapacity) return false;
    if (avail === 'full' && e.registeredCount < e.maxCapacity) return false;
    return true;
  }), [events, search, status, faculty, shift, avail]);
  const hasFilters = search || status !== 'all' || faculty !== 'all' || shift !== 'all' || avail !== 'all';
  const clear = () => { setSearch(''); setStatus('all'); setFaculty('all'); setShift('all'); setAvail('all'); };
  const columns: Column<WorkEvent>[] = [
    { key: 'name', header: 'Sự kiện', sortable: true, sortValue: (e) => e.name, render: (e) => <Link href={`/student/work-events/${e.id}`} className="font-medium text-primary hover:underline">{e.name}</Link> },
    { key: 'date', header: 'Ngày', sortable: true, sortValue: (e) => e.date, render: (e) => <span>{formatDate(e.date)}</span> },
    { key: 'shift', header: 'Ca', render: (e) => <span>{SHIFT_LABELS[e.shift]}</span> },
    { key: 'location', header: 'Địa điểm', render: (e) => <span className="text-muted-foreground">{e.location}</span> },
    { key: 'capacity', header: 'Đăng ký', sortable: true, sortValue: (e) => e.registeredCount, render: (e) => <div className="w-28 space-y-1"><div className="text-xs">{e.registeredCount}/{e.maxCapacity}</div><Progress value={(e.registeredCount / e.maxCapacity) * 100} className="h-1.5" /></div> },
    { key: 'credit', header: 'Ngày công', render: (e) => <span className="font-medium text-secondary">{e.workdayCredit}</span> },
    { key: 'status', header: 'Trạng thái', render: (e) => <StatusBadge label={EVENT_STATUS_LABELS[e.status]} variant={EVENT_STATUS_VARIANTS[e.status]} /> },
    { key: 'action', header: '', render: (e) => <Button asChild size="sm" variant="outline"><Link href={`/student/work-events/${e.id}`}>Chi tiết</Link></Button> },
  ];
  return <div className="space-y-6">
    <PageHeader title="Sự kiện ngày công" description="Tìm kiếm và đăng ký các sự kiện" />
    <Card><CardContent className="space-y-4 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center"><div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Tìm theo tên sự kiện hoặc địa điểm..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div><div className="flex items-center gap-2"><div className="flex rounded-lg border p-0.5"><Button size="sm" variant={view === 'card' ? 'default' : 'ghost'} className="h-8 rounded-md" onClick={() => setView('card')}><LayoutGrid className="h-4 w-4" /></Button><Button size="sm" variant={view === 'table' ? 'default' : 'ghost'} className="h-8 rounded-md" onClick={() => setView('table')}><TableIcon className="h-4 w-4" /></Button></div>{hasFilters && <Button size="sm" variant="ghost" onClick={clear}><X className="mr-1 h-4 w-4" /> Xóa lọc</Button>}</div></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select value={status} onValueChange={setStatus}><SelectTrigger className="h-9"><SelectValue placeholder="Trạng thái" /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả trạng thái</SelectItem><SelectItem value="open">Đang đăng ký</SelectItem><SelectItem value="completed">Đã hoàn thành</SelectItem><SelectItem value="pending">Chờ duyệt</SelectItem></SelectContent></Select>
        <Select value={faculty} onValueChange={setFaculty}><SelectTrigger className="h-9"><SelectValue placeholder="Khoa" /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả khoa</SelectItem>{faculties.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent></Select>
        <Select value={shift} onValueChange={setShift}><SelectTrigger className="h-9"><SelectValue placeholder="Ca" /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả ca</SelectItem><SelectItem value="morning">Sáng</SelectItem><SelectItem value="afternoon">Chiều</SelectItem><SelectItem value="fullday">Cả ngày</SelectItem></SelectContent></Select>
        <Select value={avail} onValueChange={setAvail}><SelectTrigger className="h-9"><SelectValue placeholder="Chỗ trống" /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả</SelectItem><SelectItem value="available">Còn chỗ</SelectItem><SelectItem value="full">Đã đủ</SelectItem></SelectContent></Select>
      </div>
    </CardContent></Card>
    {filtered.length === 0 ? <EmptyState icon={CalendarDays} title="Không tìm thấy sự kiện" description="Thử thay đổi bộ lọc." action={hasFilters ? <Button variant="outline" onClick={clear}>Xóa bộ lọc</Button> : undefined} /> :
      view === 'card' ? <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{filtered.map((event) => { const pct = Math.round((event.registeredCount / event.maxCapacity) * 100); const full = event.registeredCount >= event.maxCapacity; return <Link key={event.id} href={`/student/work-events/${event.id}`}><Card className="h-full transition-all hover:border-primary/40 hover:shadow-md"><CardContent className="space-y-3 p-5"><div className="flex items-start justify-between gap-2"><h4 className="font-semibold leading-tight text-foreground">{event.name}</h4><StatusBadge label={EVENT_STATUS_LABELS[event.status]} variant={EVENT_STATUS_VARIANTS[event.status]} /></div><div className="space-y-1.5 text-sm text-muted-foreground"><p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 shrink-0" /> {formatDate(event.date)}</p><p className="flex items-center gap-2"><Clock className="h-4 w-4 shrink-0" /> {event.startTime} - {event.endTime}</p><p className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0" /> <span className="truncate">{event.location}</span></p><p className="flex items-center gap-2"><Users className="h-4 w-4 shrink-0" /> {event.registeredCount}/{event.maxCapacity}</p></div><div className="space-y-1"><Progress value={pct} className="h-1.5" /><div className="flex justify-between text-xs"><span className={full ? 'font-medium text-destructive' : 'text-muted-foreground'}>{full ? 'Đã đủ' : `${event.maxCapacity - event.registeredCount} chỗ trống`}</span><span className="font-medium text-secondary">{event.workdayCredit} ngày công</span></div></div><p className="text-xs text-muted-foreground">Hạn: {formatDateTime(event.registrationClose)}</p></CardContent></Card></Link>; })}</div> :
      <DataTable columns={columns} data={filtered} rowKey={(e) => e.id} pageSize={10} />}
    <p className="text-sm text-muted-foreground">Tìm thấy <span className="font-medium text-foreground">{filtered.length}</span> sự kiện</p>
  </div>;
}
