'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { FolderKanban, Search, Plus, CalendarDays, Users } from 'lucide-react';
import { useAppStore } from '@/hooks/useAppStore';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { DataTable, type Column } from '@/components/common/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EVENT_STATUS_LABELS, EVENT_STATUS_VARIANTS } from '@/lib/constants';
import { formatDate } from '@/lib/format';
import type { WorkEvent } from '@/types';

export default function OrganizerEventsPage() {
  const { events, registrations, currentUser } = useAppStore();
  const [search, setSearch] = useState(''); const [status, setStatus] = useState('all');
  const myEvents = useMemo(() => events.filter((e) => e.organizerId === currentUser?.id), [events, currentUser]);
  const filtered = myEvents.filter((e) => { if (status !== 'all' && e.status !== status) return false; if (search) { const q = search.toLowerCase(); if (!e.name.toLowerCase().includes(q) && !e.code.toLowerCase().includes(q)) return false; } return true; });
  const pendingCount = (eventId: string) => registrations.filter((r) => r.eventId === eventId && r.status === 'pending').length;
  const columns: Column<WorkEvent>[] = [
    { key: 'code', header: 'Mã', sortable: true, sortValue: (e) => e.code, render: (e) => <span className="font-mono text-xs text-muted-foreground">{e.code}</span> },
    { key: 'name', header: 'Sự kiện', sortable: true, sortValue: (e) => e.name, render: (e) => <Link href={`/organizer/events/${e.id}`} className="font-medium text-primary hover:underline">{e.name}</Link> },
    { key: 'date', header: 'Ngày', sortable: true, sortValue: (e) => e.date, render: (e) => <span>{formatDate(e.date)}</span> },
    { key: 'location', header: 'Địa điểm', render: (e) => <span className="text-muted-foreground">{e.location}</span> },
    { key: 'capacity', header: 'Đăng ký', sortable: true, sortValue: (e) => e.registeredCount, render: (e) => <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5 text-muted-foreground" />{e.registeredCount}/{e.maxCapacity}</span> },
    { key: 'pending', header: 'Chờ duyệt', render: (e) => { const c = pendingCount(e.id); return c > 0 ? <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">{c}</span> : <span className="text-muted-foreground">—</span>; } },
    { key: 'status', header: 'Trạng thái', render: (e) => <StatusBadge label={EVENT_STATUS_LABELS[e.status]} variant={EVENT_STATUS_VARIANTS[e.status]} /> },
    { key: 'action', header: '', render: (e) => <Button asChild size="sm" variant="outline"><Link href={`/organizer/events/${e.id}`}>Chi tiết</Link></Button> },
  ];
  return <div className="space-y-6">
    <PageHeader title="Sự kiện" description="Quản lý sự kiện ngày công do bạn phụ trách"><Button asChild><Link href="/organizer/events/new"><Plus className="mr-2 h-4 w-4" /> Tạo sự kiện</Link></Button></PageHeader>
    <Card><CardContent className="space-y-4 p-4">
      <div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Tìm theo tên hoặc mã sự kiện..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div><Select value={status} onValueChange={setStatus}><SelectTrigger className="h-9 sm:w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả trạng thái</SelectItem>{Object.entries(EVENT_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
      {filtered.length === 0 ? <EmptyState icon={FolderKanban} title="Không có sự kiện" description="Tạo sự kiện mới để bắt đầu." action={<Button asChild><Link href="/organizer/events/new"><Plus className="mr-2 h-4 w-4" /> Tạo sự kiện</Link></Button>} /> : <DataTable columns={columns} data={filtered} rowKey={(e) => e.id} pageSize={10} />}
    </CardContent></Card>
  </div>;
}
