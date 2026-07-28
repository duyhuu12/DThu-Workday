'use client';
import { useMemo, useState } from 'react';
import { Award, Search, Check, X } from 'lucide-react';
import { useAppStore } from '@/hooks/useAppStore';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { DataTable, type Column } from '@/components/common/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CREDIT_STATUS_LABELS, CREDIT_STATUS_VARIANTS } from '@/lib/constants';
import { formatDate } from '@/lib/format';
import type { WorkCredit, CreditStatus } from '@/types';

export default function AdminWorkCreditsPage() {
  const { credits, updateCredit, addActivityLog, currentUser } = useAppStore();
  const { toast } = useToast();
  const [search, setSearch] = useState(''); const [status, setStatus] = useState('all');
  const filtered = credits.filter((c) => { if (status !== 'all' && c.status !== status) return false; if (search) { const q = search.toLowerCase(); if (!c.studentName.toLowerCase().includes(q) && !c.studentCode.toLowerCase().includes(q) && !c.eventName.toLowerCase().includes(q)) return false; } return true; });
  async function updateStatus(credit: WorkCredit, newStatus: CreditStatus) { await updateCredit(credit.id, { status: newStatus, adjustedBy: currentUser?.name, adjustedAt: new Date().toISOString() }); addActivityLog({ action: 'Cập nhật ngày công', affectedItem: `${credit.studentName} - ${credit.eventName}`, oldValue: credit.status, newValue: newStatus }); toast({ title: 'Đã cập nhật trạng thái' }); }
  const columns: Column<WorkCredit>[] = [
    { key: 'studentCode', header: 'Mã SV', sortable: true, sortValue: (c) => c.studentCode, render: (c) => <span className="font-mono text-xs">{c.studentCode}</span> },
    { key: 'studentName', header: 'Sinh viên', sortable: true, sortValue: (c) => c.studentName, render: (c) => <span className="font-medium">{c.studentName}</span> },
    { key: 'eventName', header: 'Sự kiện', sortable: true, sortValue: (c) => c.eventName, render: (c) => <span>{c.eventName}</span> },
    { key: 'eventDate', header: 'Ngày', sortable: true, sortValue: (c) => c.eventDate, render: (c) => <span>{formatDate(c.eventDate)}</span> },
    { key: 'creditValue', header: 'Ngày công', sortable: true, sortValue: (c) => c.creditValue, render: (c) => <span className="font-medium text-secondary">{c.creditValue}</span> },
    { key: 'status', header: 'Trạng thái', render: (c) => <StatusBadge label={CREDIT_STATUS_LABELS[c.status]} variant={CREDIT_STATUS_VARIANTS[c.status]} /> },
    { key: 'action', header: '', render: (c) => <div className="flex gap-1">{c.status !== 'recorded' && <Button size="sm" variant="ghost" onClick={() => updateStatus(c, 'recorded')}><Check className="h-4 w-4 text-success" /></Button>}{c.status !== 'rejected' && <Button size="sm" variant="ghost" onClick={() => updateStatus(c, 'rejected')}><X className="h-4 w-4 text-destructive" /></Button>}</div> },
  ];
  return <div className="space-y-6">
    <PageHeader title="Ngày công" description="Quản lý ngày công sinh viên" />
    <Card><CardContent className="space-y-4 p-4">
      <div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Tìm sinh viên hoặc sự kiện..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div><Select value={status} onValueChange={setStatus}><SelectTrigger className="h-9 sm:w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả trạng thái</SelectItem>{Object.entries(CREDIT_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
      {filtered.length === 0 ? <EmptyState icon={Award} title="Không có ngày công" /> : <DataTable columns={columns} data={filtered} rowKey={(c) => c.id} pageSize={10} />}
    </CardContent></Card>
  </div>;
}
