'use client';
import { useMemo, useState } from 'react';
import { MessageSquareWarning, Search } from 'lucide-react';
import { useAppStore } from '@/hooks/useAppStore';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { COMPLAINT_STATUS_LABELS, COMPLAINT_STATUS_VARIANTS, COMPLAINT_TYPE_LABELS, COMPLAINT_PRIORITY_LABELS, COMPLAINT_PRIORITY_VARIANTS } from '@/lib/constants';
import { formatDateTime } from '@/lib/format';
import type { Complaint, ComplaintStatus } from '@/types';

export default function AdminComplaintsPage() {
  const { complaints, updateComplaint, addNotification, currentUser } = useAppStore();
  const { toast } = useToast();
  const [search, setSearch] = useState(''); const [status, setStatus] = useState('all');
  const [target, setTarget] = useState<Complaint | null>(null);
  const [response, setResponse] = useState(''); const [newStatus, setNewStatus] = useState<ComplaintStatus>('resolved');
  const filtered = useMemo(() => complaints.filter((c) => { if (status !== 'all' && c.status !== status) return false; if (search) { const q = search.toLowerCase(); if (!c.title.toLowerCase().includes(q) && !c.studentName.toLowerCase().includes(q) && !c.code.toLowerCase().includes(q)) return false; } return true; }).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [complaints, search, status]);

  function open(c: Complaint, s: ComplaintStatus) { setTarget(c); setResponse(''); setNewStatus(s); }
  async function handleRespond() {
    if (!target) return;
    const timeline = [...target.timeline, { id: `t-${Date.now()}`, status: newStatus, note: response, actor: currentUser?.name ?? '', timestamp: new Date().toISOString() }];
    await updateComplaint(target.id, { status: newStatus, response, timeline });
    addNotification({ userId: target.studentId, type: 'complaint', title: 'Cập nhật khiếu nại', message: `Khiếu nại ${target.code}: ${COMPLAINT_STATUS_LABELS[newStatus]}`, link: '/student/complaints' });
    toast({ title: 'Đã cập nhật khiếu nại' }); setTarget(null);
  }

  return <div className="space-y-6">
    <PageHeader title="Khiếu nại" description="Xử lý khiếu nại sinh viên" />
    <Card><CardContent className="space-y-4 p-4">
      <div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Tìm khiếu nại..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div><Select value={status} onValueChange={setStatus}><SelectTrigger className="h-9 sm:w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả trạng thái</SelectItem>{Object.entries(COMPLAINT_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
      {filtered.length === 0 ? <EmptyState icon={MessageSquareWarning} title="Không có khiếu nại" /> : <div className="space-y-3">{filtered.map((c) => <Card key={c.id}><CardContent className="p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="space-y-2"><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs text-muted-foreground">{c.code}</span><h3 className="font-semibold text-foreground">{c.title}</h3><StatusBadge label={COMPLAINT_STATUS_LABELS[c.status]} variant={COMPLAINT_STATUS_VARIANTS[c.status]} /><StatusBadge label={COMPLAINT_PRIORITY_LABELS[c.priority]} variant={COMPLAINT_PRIORITY_VARIANTS[c.priority]} /></div><p className="text-sm text-muted-foreground">{c.studentName} • {c.studentCode}</p><p className="text-sm text-foreground">{c.description}</p><div className="flex flex-wrap gap-3 text-xs text-muted-foreground"><span>Loại: {COMPLAINT_TYPE_LABELS[c.type]}</span>{c.eventName && <span>Sự kiện: {c.eventName}</span>}<span>Gửi: {formatDateTime(c.createdAt)}</span></div></div>{(c.status === 'submitted' || c.status === 'processing') && <div className="flex gap-2"><Button size="sm" onClick={() => open(c, 'resolved')}>Giải quyết</Button><Button size="sm" variant="outline" className="text-destructive" onClick={() => open(c, 'rejected')}>Từ chối</Button></div>}</div>{c.response && <div className="mt-3 border-t pt-3"><p className="text-sm"><span className="font-medium">Phản hồi: </span>{c.response}</p></div>}</CardContent></Card>)}</div>}
    </CardContent></Card>
    <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}><DialogContent><DialogHeader><DialogTitle>{newStatus === 'resolved' ? 'Giải quyết khiếu nại' : 'Từ chối khiếu nại'}</DialogTitle></DialogHeader><div className="space-y-4 py-2"><p className="text-sm text-muted-foreground">{target?.title}</p><div className="space-y-2"><Label>Phản hồi</Label><Textarea rows={4} value={response} onChange={(e) => setResponse(e.target.value)} placeholder="Nhập phản hồi..." /></div></div><DialogFooter><Button variant="outline" onClick={() => setTarget(null)}>Hủy</Button><Button onClick={handleRespond} variant={newStatus === 'rejected' ? 'destructive' : 'default'}>{newStatus === 'resolved' ? 'Giải quyết' : 'Từ chối'}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
