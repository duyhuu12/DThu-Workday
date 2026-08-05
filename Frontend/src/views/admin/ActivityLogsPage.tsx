'use client';
import { useEffect, useMemo, useState } from 'react';
import { History, Search } from 'lucide-react';
import { useAppStore } from '@/hooks/useAppStore';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { DataTable, type Column } from '@/components/common/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ROLE_LABELS } from '@/lib/constants';
import { formatDateTime } from '@/lib/format';
import type { ActivityLog } from '@/types';

export default function ActivityLogsPage() {
  const { activityLogs, fetchActivityLogs } = useAppStore();
  const [search, setSearch] = useState(''); const [role, setRole] = useState('all');

  useEffect(() => {
    void fetchActivityLogs().catch((error) => console.error('Không thể tải nhật ký hoạt động:', error));
  }, [fetchActivityLogs]);

  const filtered = useMemo(() => activityLogs.filter((l) => { if (role !== 'all' && l.userRole !== role) return false; if (search) { const q = search.toLowerCase(); if (!l.userName.toLowerCase().includes(q) && !l.action.toLowerCase().includes(q) && !l.affectedItem.toLowerCase().includes(q)) return false; } return true; }), [activityLogs, search, role]);
  const columns: Column<ActivityLog>[] = [
    { key: 'timestamp', header: 'Thời gian', sortable: true, sortValue: (l) => l.timestamp, render: (l) => <span className="text-muted-foreground">{formatDateTime(l.timestamp)}</span> },
    { key: 'userName', header: 'Người dùng', sortable: true, sortValue: (l) => l.userName, render: (l) => <span className="font-medium">{l.userName}</span> },
    { key: 'userRole', header: 'Vai trò', render: (l) => <span className="text-muted-foreground">{ROLE_LABELS[l.userRole]}</span> },
    { key: 'action', header: 'Hành động', sortable: true, sortValue: (l) => l.action, render: (l) => <span>{l.action}</span> },
    { key: 'affectedItem', header: 'Đối tượng', render: (l) => <span className="text-muted-foreground">{l.affectedItem}</span> },
    { key: 'changes', header: 'Thay đổi', render: (l) => <span className="text-xs">{l.oldValue ?? '—'} → {l.newValue ?? '—'}</span> },
    { key: 'ip', header: 'IP', render: (l) => <span className="font-mono text-xs text-muted-foreground">{l.ipAddress ?? '—'}</span> },
  ];
  return <div className="space-y-6">
    <PageHeader title="Nhật ký hoạt động" description="Lịch sử thao tác trong hệ thống" />
    <Card><CardContent className="space-y-4 p-4">
      <div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Tìm theo người dùng, hành động..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div><Select value={role} onValueChange={setRole}><SelectTrigger className="h-9 sm:w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả vai trò</SelectItem>{Object.entries(ROLE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
      {filtered.length === 0 ? <EmptyState icon={History} title="Không có nhật ký" /> : <DataTable columns={columns} data={filtered} rowKey={(l) => l.id} pageSize={15} initialSort={{ key: 'timestamp', direction: 'desc' }} />}
    </CardContent></Card>
  </div>;
}
