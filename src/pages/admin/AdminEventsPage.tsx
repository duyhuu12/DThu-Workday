'use client';
import { useMemo, useState } from 'react';
import { FolderKanban, Search } from 'lucide-react';
import Link from 'next/link';
import { useAppStore } from '@/hooks/useAppStore';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { DataTable, type Column } from '@/components/common/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EVENT_STATUS_LABELS, EVENT_STATUS_VARIANTS } from '@/lib/constants';
import { formatDate } from '@/lib/format';
import type { WorkEvent } from '@/types';

export default function AdminEventsPage() {
  const { events } = useAppStore();
  const [search, setSearch] = useState(''); const [status, setStatus] = useState('all');
  const filtered = events.filter((e) => { if (status !== 'all' && e.status !== status) return false; if (search) { const q = search.toLowerCase(); if (!e.name.toLowerCase().includes(q) && !e.code.toLowerCase().includes(q) && !e.organizerName.toLowerCase().includes(q)) return false; } return true; });
  const columns: Column<WorkEvent>[] = [
    { key: 'code', header: 'Mã', sortable: true, sortValue: (e) => e.code, render: (e) => <span className="font-mono text-xs text-muted-foreground">{e.code}</span> },
    { key: 'name', header: 'Sự kiện', sortable: true, sortValue: (e) => e.name, render: (e) => <Link href={`/admin/events/${e.id}`} className="font-medium text-primary hover:underline">{e.name}</Link> },
    { key: 'date', header: 'Ngày', sortable: true, sortValue: (e) => e.date, render: (e) => <span>{formatDate(e.date)}</span> },
    { key: 'organizer', header: 'Người tổ chức', sortable: true, sortValue: (e) => e.organizerName, render: (e) => <span>{e.organizerName}</span> },
    { key: 'capacity', header: 'Đăng ký', sortable: true, sortValue: (e) => e.registeredCount, render: (e) => <span>{e.registeredCount}/{e.maxCapacity}</span> },
    { key: 'status', header: 'Trạng thái', render: (e) => <StatusBadge label={EVENT_STATUS_LABELS[e.status]} variant={EVENT_STATUS_VARIANTS[e.status]} /> },
  ];
  return <div className="space-y-6">
    <PageHeader title="Sự kiện" description="Tất cả sự kiện trong hệ thống" />
    <Card><CardContent className="space-y-4 p-4">
      <div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Tìm sự kiện..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div><Select value={status} onValueChange={setStatus}><SelectTrigger className="h-9 sm:w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả trạng thái</SelectItem>{Object.entries(EVENT_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
      {filtered.length === 0 ? <EmptyState icon={FolderKanban} title="Không có sự kiện" /> : <DataTable columns={columns} data={filtered} rowKey={(e) => e.id} pageSize={10} />}
    </CardContent></Card>
  </div>;
}
