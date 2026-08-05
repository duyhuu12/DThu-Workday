'use client';
import { useMemo, useState, useEffect } from 'react';
import { MessageSquareWarning, Plus, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useAppStore, useCurrentStudent } from '@/hooks/useAppStore';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { COMPLAINT_STATUS_LABELS, COMPLAINT_STATUS_VARIANTS, COMPLAINT_TYPE_LABELS, COMPLAINT_PRIORITY_LABELS, COMPLAINT_PRIORITY_VARIANTS } from '@/lib/constants';
import { formatDateTime } from '@/lib/format';
import type { Complaint, ComplaintType, ComplaintPriority } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

const TYPE_OPTIONS = Object.keys(COMPLAINT_TYPE_LABELS) as ComplaintType[];

export default function ComplaintsPage() {
  const { complaints, addComplaint, events, registrations, classes, faculties, fetchComplaints, fetchRegistrations } = useAppStore();
  const student = useCurrentStudent();
  const { toast } = useToast();
  const [loading, setLoading] = useState(complaints.length === 0);
  const [open, setOpen] = useState(false); const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchComplaints(),
      fetchRegistrations()
    ]).finally(() => setLoading(false));
  }, [fetchComplaints, fetchRegistrations]);
  const [form, setForm] = useState({ title: '', type: 'attendance' as ComplaintType, priority: 'medium' as ComplaintPriority, eventId: '', content: '' });
  const myComplaints = useMemo(() => complaints.filter((c) => c.studentId === student?.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [complaints, student]);
  const myEvents = useMemo(() => registrations.filter((r) => r.studentId === student?.id).map((r) => events.find((e) => e.id === r.eventId)).filter(Boolean), [registrations, events, student]);

  async function handleSubmit() {
    if (!student || !form.title.trim() || !form.content.trim()) { toast({ title: 'Vui lòng điền đầy đủ', variant: 'destructive' }); return; }
    setSubmitting(true);
    try { const ev = events.find((e) => e.id === form.eventId); await addComplaint({ studentId: student.id, studentName: student.fullName, studentCode: student.studentCode, classId: student.classId, className: classes.find((c) => c.id === student.classId)?.name ?? '', facultyId: student.facultyId, facultyName: faculties.find((f) => f.id === student.facultyId)?.name ?? '', eventId: form.eventId === 'none' ? '' : form.eventId, eventName: ev?.name, title: form.title.trim(), type: form.type, priority: form.priority, description: form.content.trim(), status: 'submitted' }); toast({ title: 'Đã gửi khiếu nại', description: 'Khiếu nại sẽ được xem xét' }); setOpen(false); setForm({ title: '', type: 'attendance', priority: 'medium', eventId: '', content: '' }); } finally { setSubmitting(false); }
  }
  if (loading) {
    return <div className="space-y-6">
      <PageHeader title="Khiếu nại của tôi" description="Gửi và theo dõi khiếu nại"><Button disabled><Plus className="mr-2 h-4 w-4" /> Gửi khiếu nại</Button></PageHeader>
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}><CardContent className="p-5 space-y-3"><Skeleton className="h-6 w-1/3" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" /></CardContent></Card>
        ))}
      </div>
    </div>;
  }

  return <div className="space-y-6">
    <PageHeader title="Khiếu nại của tôi" description="Gửi và theo dõi khiếu nại"><Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> Gửi khiếu nại</Button></PageHeader>
    {myComplaints.length === 0 ? <EmptyState icon={MessageSquareWarning} title="Chưa có khiếu nại" description="Gửi khiếu nại khi có vấn đề." action={<Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> Gửi khiếu nại</Button>} /> :
      <div className="space-y-4">{myComplaints.map((c) => <ComplaintCard key={c.id} complaint={c} />)}</div>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Gửi khiếu nại</DialogTitle></DialogHeader><div className="space-y-4 py-2">
      <div className="space-y-2"><Label>Tiêu đề *</Label><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Mô tả ngắn gọn vấn đề" /></div>
      <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Loại</Label><Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as ComplaintType }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TYPE_OPTIONS.map((t) => <SelectItem key={t} value={t}>{COMPLAINT_TYPE_LABELS[t]}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Mức độ</Label><Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v as ComplaintPriority }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(COMPLAINT_PRIORITY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div></div>
      <div className="space-y-2"><Label>Sự kiện liên quan</Label><Select value={form.eventId} onValueChange={(v) => setForm((f) => ({ ...f, eventId: v }))}><SelectTrigger><SelectValue placeholder="Không chọn" /></SelectTrigger><SelectContent><SelectItem value="none">Không liên quan sự kiện</SelectItem>{myEvents.map((ev) => <SelectItem key={ev!.id} value={ev!.id}>{ev!.name}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2"><Label>Nội dung *</Label><Textarea rows={4} value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} placeholder="Mô tả chi tiết..." /></div>
    </div><DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button><Button onClick={handleSubmit} disabled={submitting}>{submitting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" /> : 'Gửi khiếu nại'}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}

function ComplaintCard({ complaint }: { complaint: Complaint }) {
  const icon = complaint.status === 'resolved' ? CheckCircle2 : complaint.status === 'rejected' ? XCircle : complaint.status === 'processing' ? Clock : AlertCircle;
  const Icon = icon;
  return <Card className="transition-shadow hover:shadow-md"><CardContent className="p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="space-y-2"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-foreground">{complaint.title}</h3><StatusBadge label={COMPLAINT_STATUS_LABELS[complaint.status]} variant={COMPLAINT_STATUS_VARIANTS[complaint.status]} /><StatusBadge label={COMPLAINT_PRIORITY_LABELS[complaint.priority]} variant={COMPLAINT_PRIORITY_VARIANTS[complaint.priority]} /></div><div className="flex flex-wrap gap-3 text-xs text-muted-foreground"><span>Loại: {COMPLAINT_TYPE_LABELS[complaint.type]}</span>{complaint.eventName && <span>Sự kiện: {complaint.eventName}</span>}<span>Gửi: {formatDateTime(complaint.createdAt)}</span></div><p className="text-sm text-foreground">{complaint.description}</p></div><Icon className={`h-5 w-5 shrink-0 ${complaint.status === 'resolved' ? 'text-success' : complaint.status === 'rejected' ? 'text-destructive' : 'text-muted-foreground'}`} /></div>{complaint.timeline && complaint.timeline.length > 0 && <div className="mt-4 border-t pt-4"><div className="space-y-3">{complaint.timeline.map((r, i) => <div key={r.id ?? i} className="rounded-lg bg-muted/40 p-3 text-sm"><div className="mb-1 flex items-center justify-between"><span className="font-medium text-foreground">{r.actor}</span><span className="text-xs text-muted-foreground">{formatDateTime(r.timestamp)}</span></div><p className="text-foreground">{r.note}</p></div>)}</div></div>}</CardContent></Card>;
}
