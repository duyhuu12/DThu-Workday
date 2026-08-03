'use client';
import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, Clock, MapPin, Users, Award, Phone, CheckCircle2, XCircle, UserCheck, ClipboardList, BarChart3, Pencil } from 'lucide-react';
import { useAppStore } from '@/hooks/useAppStore';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { EVENT_STATUS_LABELS, EVENT_STATUS_VARIANTS, REG_STATUS_LABELS, REG_STATUS_VARIANTS, SHIFT_LABELS } from '@/lib/constants';
import { formatDate, formatDateTime } from '@/lib/format';
import type { Registration } from '@/types';

export default function OrganizerEventDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { events, registrations, updateRegistration, addNotification, currentUser } = useAppStore();
  const { toast } = useToast();
  const [tab, setTab] = useState<'pending' | 'approved' | 'all'>('pending');
  const [actionTarget, setActionTarget] = useState<{ reg: Registration; action: 'approve' | 'reject' } | null>(null);
  const event = events.find((e) => e.id === id);
  const eventRegs = useMemo(() => registrations.filter((r) => r.eventId === id), [registrations, id]);
  const filtered = eventRegs.filter((r) => { if (tab === 'all') return true; return r.status === tab; });

  if (!event) return <div className="space-y-6"><Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" /> Quay lại</Button><EmptyState icon={CalendarDays} title="Không tìm thấy sự kiện" /></div>;
  const pct = Math.round((event.registeredCount / event.maxCapacity) * 100);
  const pendingCount = eventRegs.filter((r) => r.status === 'pending').length;

  async function handleAction() {
    if (!actionTarget || !event) return;
    const { reg, action } = actionTarget;
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    await updateRegistration(reg.id, { status: newStatus === 'rejected' ? 'cancelled' : 'approved', approvedAt: new Date().toISOString(), approvedBy: currentUser?.name ?? '', rejectionReason: action === 'reject' ? 'Không đáp ứng yêu cầu' : undefined });
    addNotification({ userId: reg.studentId, type: 'registration', title: action === 'approve' ? 'Đăng ký được duyệt' : 'Đăng ký bị từ chối', message: `${action === 'approve' ? 'Đã duyệt' : 'Đã từ chối'} đăng ký "${event.name}".`, link: '/student/my-registrations' });
    toast({ title: action === 'approve' ? 'Đã duyệt đăng ký' : 'Đã từ chối đăng ký' });
    setActionTarget(null);
  }

  return <div className="space-y-6">
    <Button variant="ghost" size="sm" onClick={() => router.back()}><ArrowLeft className="mr-1 h-4 w-4" /> Quay lại</Button>
    <PageHeader title={event.name} description={`Mã: ${event.code}`} />
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2"><CardContent className="space-y-4 p-5">
        <div className="flex items-center gap-2"><StatusBadge label={EVENT_STATUS_LABELS[event.status]} variant={EVENT_STATUS_VARIANTS[event.status]} /></div>
        <div><h3 className="mb-1 font-semibold">Mô tả</h3><p className="text-sm text-muted-foreground">{event.description}</p></div>
        <div><h3 className="mb-1 font-semibold">Nội dung công việc</h3><p className="text-sm text-muted-foreground">{event.workContent}</p></div>
        <div className="grid gap-4 sm:grid-cols-2"><div><h3 className="mb-1 font-semibold">Trang phục</h3><p className="text-sm text-muted-foreground">{event.clothingRequirements}</p></div><div><h3 className="mb-1 font-semibold">Thiết bị</h3><p className="text-sm text-muted-foreground">{event.equipmentRequirements}</p></div></div>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button asChild variant="outline" size="sm"><Link href={`/organizer/events/${event.id}/edit`}><Pencil className="mr-1 h-4 w-4" /> Chỉnh sửa</Link></Button>
          <Button asChild variant="outline" size="sm"><Link href={`/organizer/events/${event.id}/attendance`}><UserCheck className="mr-1 h-4 w-4" /> Điểm danh</Link></Button>
          <Button asChild variant="outline" size="sm"><Link href={`/organizer/events/${event.id}/results`}><BarChart3 className="mr-1 h-4 w-4" /> Kết quả</Link></Button>
        </div>
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Thông tin</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">
        <IRow icon={CalendarDays} label="Ngày" value={formatDate(event.date)} />
        <IRow icon={Clock} label="Giờ" value={`${event.startTime} - ${event.endTime} (${SHIFT_LABELS[event.shift]})`} />
        <IRow icon={MapPin} label="Địa điểm" value={event.location} />
        <Separator />
        <IRow icon={Users} label="Đăng ký" value={`${event.registeredCount}/${event.maxCapacity}`} />
        <Progress value={pct} className="h-2" />
        <Separator />
        <IRow icon={Award} label="Ngày công" value={`${event.workdayCredit} ngày`} />
        <IRow icon={Phone} label="Liên hệ" value={event.contactPhone} />
        <IRow icon={CalendarDays} label="Hạn đăng ký" value={formatDateTime(event.registrationClose)} />
      </CardContent></Card>
    </div>
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h3 className="text-lg font-semibold">Quản lý đăng ký</h3>{pendingCount > 0 && <span className="rounded-full bg-warning/15 px-3 py-1 text-sm font-medium text-warning">{pendingCount} chờ duyệt</span>}</div>
      <Tabs value={tab} onValueChange={(v) => setTab(v as 'pending' | 'approved' | 'all')}><TabsList><TabsTrigger value="pending">Chờ duyệt ({eventRegs.filter((r) => r.status === 'pending').length})</TabsTrigger><TabsTrigger value="approved">Đã duyệt ({eventRegs.filter((r) => r.status === 'approved').length})</TabsTrigger><TabsTrigger value="all">Tất cả ({eventRegs.length})</TabsTrigger></TabsList></Tabs>
      {filtered.length === 0 ? <EmptyState icon={ClipboardList} title="Không có đăng ký" /> : <div className="space-y-2">{filtered.map((reg) => <Card key={reg.id}><CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium text-foreground">{reg.studentName}</p><p className="text-sm text-muted-foreground">{reg.studentCode} • {reg.className}</p><p className="text-xs text-muted-foreground">Đăng ký: {formatDateTime(reg.registeredAt)}</p></div><div className="flex items-center gap-2"><StatusBadge label={REG_STATUS_LABELS[reg.status]} variant={REG_STATUS_VARIANTS[reg.status]} />{reg.status === 'pending' && <><Button size="sm" onClick={() => setActionTarget({ reg, action: 'approve' })}><CheckCircle2 className="mr-1 h-4 w-4" /> Duyệt</Button><Button size="sm" variant="outline" className="text-destructive" onClick={() => setActionTarget({ reg, action: 'reject' })}><XCircle className="mr-1 h-4 w-4" /> Từ chối</Button></>}</div></CardContent></Card>)}</div>}
    </div>
    <ConfirmDialog open={!!actionTarget} onOpenChange={(o) => !o && setActionTarget(null)} title={actionTarget?.action === 'approve' ? 'Duyệt đăng ký' : 'Từ chối đăng ký'} description={actionTarget?.action === 'approve' ? `Duyệt đăng ký của ${actionTarget?.reg.studentName}?` : `Từ chối đăng ký của ${actionTarget?.reg.studentName}?`} confirmLabel={actionTarget?.action === 'approve' ? 'Duyệt' : 'Từ chối'} destructive={actionTarget?.action === 'reject'} onConfirm={handleAction} />
  </div>;
}

function IRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return <div className="flex items-start gap-3"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /><div className="min-w-0 flex-1"><p className="text-xs text-muted-foreground">{label}</p><p className="font-medium text-foreground">{value}</p></div></div>;
}
