'use client';
import { useMemo, useState } from 'react';
import { ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import { useAppStore } from '@/hooks/useAppStore';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { EVENT_STATUS_LABELS, EVENT_STATUS_VARIANTS, SHIFT_LABELS } from '@/lib/constants';
import { formatDate, formatDateTime } from '@/lib/format';
import type { WorkEvent } from '@/types';

export default function EventApprovalsPage() {
  const { events, updateEvent, addNotification, addActivityLog, currentUser } = useAppStore();
  const { toast } = useToast();
  const [target, setTarget] = useState<{ event: WorkEvent; action: 'approve' | 'reject' } | null>(null);
  const [reason, setReason] = useState('');
  const pending = useMemo(() => events.filter((e) => e.status === 'pending'), [events]);

  async function handleAction() {
    if (!target) return;
    const newStatus = target.action === 'approve' ? 'approved' : 'rejected';
    await updateEvent(target.event.id, { status: newStatus });
    addActivityLog({ action: target.action === 'approve' ? 'Duyệt sự kiện' : 'Từ chối sự kiện', affectedItem: target.event.name, oldValue: 'pending', newValue: newStatus });
    addNotification({ userId: target.event.organizerId, type: 'event', title: target.action === 'approve' ? 'Sự kiện được duyệt' : 'Sự kiện bị từ chối', message: `"${target.event.name}" ${target.action === 'approve' ? 'đã được duyệt' : 'bị từ chối'}.`, link: '/organizer/events' });
    toast({ title: target.action === 'approve' ? 'Đã duyệt sự kiện' : 'Đã từ chối sự kiện' });
    setTarget(null); setReason('');
  }

  return <div className="space-y-6">
    <PageHeader title="Duyệt sự kiện" description="Phê duyệt sự kiện chờ duyệt" />
    {pending.length === 0 ? <EmptyState icon={ShieldCheck} title="Không có sự kiện chờ duyệt" description="Tất cả sự kiện đã được xử lý." /> : <div className="space-y-3">{pending.map((e) => <Card key={e.id}><CardContent className="p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="space-y-2"><div className="flex items-center gap-2"><h3 className="font-semibold text-foreground">{e.name}</h3><StatusBadge label={EVENT_STATUS_LABELS[e.status]} variant={EVENT_STATUS_VARIANTS[e.status]} /></div><div className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2"><span>Ngày: {formatDate(e.date)} • {SHIFT_LABELS[e.shift]}</span><span>Địa điểm: {e.location}</span><span>Người tổ chức: {e.organizerName}</span><span>Sức chứa: {e.maxCapacity} • Ngày công: {e.workdayCredit}</span></div><p className="text-sm text-muted-foreground">Tạo lúc: {formatDateTime(e.createdAt)}</p></div><div className="flex gap-2"><Button size="sm" onClick={() => setTarget({ event: e, action: 'approve' })}><CheckCircle2 className="mr-1 h-4 w-4" /> Duyệt</Button><Button size="sm" variant="outline" className="text-destructive" onClick={() => setTarget({ event: e, action: 'reject' })}><XCircle className="mr-1 h-4 w-4" /> Từ chối</Button></div></div></CardContent></Card>)}</div>}
    <Dialog open={!!target} onOpenChange={(o) => { if (!o) { setTarget(null); setReason(''); } }}><DialogContent><DialogHeader><DialogTitle>{target?.action === 'approve' ? 'Duyệt sự kiện' : 'Từ chối sự kiện'}</DialogTitle></DialogHeader><div className="space-y-4 py-2"><p className="text-sm text-muted-foreground">{target?.event.name}</p>{target?.action === 'reject' && <div className="space-y-2"><Label>Lý do từ chối</Label><Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Nhập lý do..." /></div>}</div><DialogFooter><Button variant="outline" onClick={() => { setTarget(null); setReason(''); }}>Hủy</Button><Button onClick={handleAction} variant={target?.action === 'reject' ? 'destructive' : 'default'}>{target?.action === 'approve' ? 'Duyệt' : 'Từ chối'}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
