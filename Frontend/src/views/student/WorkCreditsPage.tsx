'use client';
import { useMemo, useState, useEffect } from 'react';
import { Award, Search, TrendingUp, CheckCircle2 } from 'lucide-react';
import { useAppStore, useCurrentStudent } from '@/hooks/useAppStore';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { DataTable, type Column } from '@/components/common/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CREDIT_STATUS_LABELS, CREDIT_STATUS_VARIANTS } from '@/lib/constants';
import { formatDate } from '@/lib/format';
import type { WorkCredit } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function WorkCreditsPage() {
  const { credits, settings, semesterConfigs, fetchCredits, fetchCurrentStudent } = useAppStore();
  const student = useCurrentStudent();
  const [loading, setLoading] = useState(credits.length === 0);

  useEffect(() => {
    Promise.all([fetchCredits(), fetchCurrentStudent()]).finally(() => setLoading(false));
  }, [fetchCredits, fetchCurrentStudent]);

  const [search, setSearch] = useState(''); const [status, setStatus] = useState('all'); const [semester, setSemester] = useState('all');
  const myCredits = useMemo(() => credits.filter((c) => c.studentId === student?.id), [credits, student]);
  const semesterOptions = useMemo(
    () => Array.from(new Set([...semesterConfigs.map((item) => item.name), ...myCredits.map((item) => item.semester)])),
    [semesterConfigs, myCredits],
  );
  const filtered = myCredits.filter((c) => { if (status !== 'all' && c.status !== status) return false; if (semester !== 'all' && c.semester !== semester) return false; if (search) { const q = search.toLowerCase(); if (!c.eventName.toLowerCase().includes(q) && !c.studentName.toLowerCase().includes(q)) return false; } return true; });
  const totalEarned = myCredits.filter((c) => ['recorded', 'adjusted'].includes(c.status)).reduce((s, c) => s + c.creditValue, 0);
  const totalPending = myCredits.filter((c) => c.status === 'pending').reduce((s, c) => s + c.creditValue, 0);
  const required = Math.max(1, settings.defaultRequiredWorkdays); const pct = Math.min(100, Math.round((totalEarned / required) * 100));
  const columns: Column<WorkCredit>[] = [
    { key: 'eventName', header: 'Sự kiện', sortable: true, sortValue: (c) => c.eventName, render: (c) => <span className="font-medium">{c.eventName}</span> },
    { key: 'eventDate', header: 'Ngày', sortable: true, sortValue: (c) => c.eventDate, render: (c) => <span>{formatDate(c.eventDate)}</span> },
    { key: 'status', header: 'Trạng thái', render: (c) => <StatusBadge label={CREDIT_STATUS_LABELS[c.status]} variant={CREDIT_STATUS_VARIANTS[c.status]} /> },
    { key: 'creditValue', header: 'Ngày công', sortable: true, sortValue: (c) => c.creditValue, render: (c) => <span className="font-medium text-secondary">{c.creditValue}</span> },
    { key: 'adjustedAt', header: 'Duyệt lúc', render: (c) => <span className="text-muted-foreground">{c.adjustedAt ? formatDate(c.adjustedAt) : '—'}</span> },
  ];
  if (loading) {
    return <div className="space-y-6">
      <PageHeader title="Ngày công của tôi" description="Tổng hợp ngày công lao động" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map(i => (
          <Card key={i}><CardContent className="p-6 flex items-center justify-between"><div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-12" /></div><Skeleton className="h-10 w-10 rounded-full" /></CardContent></Card>
        ))}
      </div>
      <Card><CardContent className="p-5 space-y-3"><Skeleton className="h-5 w-32" /><Skeleton className="h-3 w-full" /><Skeleton className="h-2 w-full" /></CardContent></Card>
    </div>;
  }
  return <div className="space-y-6">
    <PageHeader title="Ngày công của tôi" description="Tổng hợp ngày công lao động" />
    <div className="grid gap-4 sm:grid-cols-3"><StatCard title="Đã được duyệt" value={totalEarned} suffix="ngày" icon={CheckCircle2} iconClassName="bg-success/10 text-success" /><StatCard title="Chờ duyệt" value={totalPending} suffix="ngày" icon={Award} iconClassName="bg-warning/10 text-warning" /><StatCard title="Yêu cầu học kỳ" value={required} suffix="ngày" icon={TrendingUp} iconClassName="bg-primary/10 text-primary" /></div>
    <Card><CardContent className="p-5"><div className="mb-2 flex items-center justify-between"><h3 className="font-semibold">Tiến độ hoàn thành</h3><span className="text-sm font-medium text-primary">{totalEarned}/{required} ngày ({pct}%)</span></div><Progress value={pct} className="h-3" /><p className="mt-2 text-sm text-muted-foreground">{pct >= 100 ? 'Đã hoàn thành yêu cầu học kỳ!' : `Còn ${Math.max(0, required - totalEarned)} ngày để hoàn thành`}</p></CardContent></Card>
    <Card><CardContent className="space-y-4 p-4">
      <div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Tìm sự kiện..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div><Select value={status} onValueChange={setStatus}><SelectTrigger className="h-9 sm:w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả trạng thái</SelectItem>{Object.entries(CREDIT_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select><Select value={semester} onValueChange={setSemester}><SelectTrigger className="h-9 sm:w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả học kỳ</SelectItem>{semesterOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
      {filtered.length === 0 ? <EmptyState icon={Award} title="Không có ngày công" /> : <DataTable columns={columns} data={filtered} rowKey={(c) => c.id} pageSize={10} />}
    </CardContent></Card>
  </div>;
}
