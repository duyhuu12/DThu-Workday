'use client';
import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { parseISO, isAfter } from 'date-fns';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ArrowLeft, CalendarDays, Clock, MapPin, Users, Award, Phone, User as UserIcon, CheckCircle2, XCircle, AlertTriangle, Shirt, Wrench, ListChecks, FileText, CalendarClock } from 'lucide-react';
import { useAppStore, useCurrentStudent } from '@/hooks/useAppStore';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { EVENT_STATUS_LABELS, EVENT_STATUS_VARIANTS, SHIFT_LABELS } from '@/lib/constants';
import { formatDate, formatDateTime } from '@/lib/format';
const initials = (name: string) => name.trim().split(' ').slice(-2).map((p) => p[0]).join('').toUpperCase();

export default function WorkEventDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { events, registrations, addRegistration, updateRegistration, addNotification, students, classes, faculties } = useAppStore();
  const student = useCurrentStudent();
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false); const [cancelOpen, setCancelOpen] = useState(false); const [registering, setRegistering] = useState(false);
  const event = events.find((e) => e.id === id);
  const myReg = useMemo(() => registrations.find((r) => r.eventId === id && r.studentId === student?.id), [registrations, id, student]);
  const overlap = useMemo(() => { if (!event || !student) return null; const approved = registrations.filter((r) => r.studentId === student.id && (r.status === 'approved' || r.status === 'pending') && r.eventId !== event.id); for (const r of approved) { const o = events.find((e) => e.id === r.eventId); if (o && o.date === event.date && event.startTime < o.endTime && o.startTime < event.endTime) return o; } return null; }, [event, student, registrations, events]);
  if (!event) return <div className="space-y-6"><Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" /> Quay lại</Button><EmptyState icon={CalendarDays} title="Không tìm thấy sự kiện" /></div>;
  const pct = Math.round((event.registeredCount / event.maxCapacity) * 100); const full = event.registeredCount >= event.maxCapacity;
  const canRegister = event.status === 'open' && !myReg && !full;
  const canCancel = myReg && (myReg.status === 'pending' || myReg.status === 'approved' || myReg.status === 'waitlist') && isAfter(parseISO(event.cancellationDeadline), new Date());
  const mockParticipants = students.slice(0, 5);
  async function handleRegister() { if (!event || !student) return; setRegistering(true); try { await addRegistration({ eventId: event.id, studentId: student.id, studentCode: student.studentCode, studentName: student.fullName, classId: student.classId, className: classes.find((c) => c.id === student.classId)?.name ?? '', facultyId: student.facultyId, facultyName: faculties.find((f) => f.id === student.facultyId)?.name ?? '', status: 'pending' }); addNotification({ userId: student.userId, type: 'registration', title: 'Đăng ký thành công', message: `Đã đăng ký "${event.name}".`, link: '/student/my-registrations' }); toast({ title: 'Đăng ký thành công', description: `Đã đăng ký "${event.name}"` }); setConfirmOpen(false); } finally { setRegistering(false); } }
  async function handleCancel() { if (!myReg || !event) return; await updateRegistration(myReg.id, { status: 'cancelled' }); addNotification({ userId: student?.userId ?? '', type: 'registration', title: 'Đã hủy đăng ký', message: `Đã hủy "${event.name}".`, link: '/student/my-registrations' }); toast({ title: 'Đã hủy đăng ký' }); setCancelOpen(false); }
  return <div className="space-y-6">
    <Button variant="ghost" size="sm" onClick={() => router.back()}><ArrowLeft className="mr-1 h-4 w-4" /> Quay lại</Button>
    <div className="relative flex h-44 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 sm:h-56"><CalendarDays className="mb-2 h-10 w-10 text-primary/40" /><div className="absolute left-4 top-4"><StatusBadge label={EVENT_STATUS_LABELS[event.status]} variant={EVENT_STATUS_VARIANTS[event.status]} /></div></div>
    <PageHeader title={event.name} description={`Mã: ${event.code}`}>{myReg && <StatusBadge label="Đã đăng ký" variant="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" />}</PageHeader>
    {overlap && !myReg && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Cảnh báo trùng lịch</AlertTitle><AlertDescription>Sự kiện này trùng giờ với "{overlap.name}" ({formatDate(overlap.date)}, {overlap.startTime}-{overlap.endTime}).</AlertDescription></Alert>}
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4 text-primary" /> Mô tả sự kiện</CardTitle></CardHeader><CardContent><p className="text-sm leading-relaxed text-foreground">{event.description}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><ListChecks className="h-4 w-4 text-primary" /> Nội dung công việc</CardTitle></CardHeader><CardContent><p className="text-sm leading-relaxed text-foreground">{event.workContent}</p></CardContent></Card>
        <div className="grid gap-6 sm:grid-cols-2"><Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Shirt className="h-4 w-4 text-primary" /> Trang phục</CardTitle></CardHeader><CardContent><p className="text-sm">{event.clothingRequirements}</p></CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Wrench className="h-4 w-4 text-primary" /> Trang thiết bị</CardTitle></CardHeader><CardContent><p className="text-sm">{event.equipmentRequirements}</p></CardContent></Card></div>
        <Card><CardHeader><CardTitle className="text-base">Một số người tham gia</CardTitle></CardHeader><CardContent><div className="flex flex-wrap gap-3">{mockParticipants.map((p) => <div key={p.id} className="flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2"><Avatar className="h-8 w-8"><AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{initials(p.fullName)}</AvatarFallback></Avatar><div className="text-xs"><p className="font-medium text-foreground">{p.fullName}</p><p className="text-muted-foreground">{p.studentCode}</p></div></div>)}</div></CardContent></Card>
      </div>
      <div className="space-y-6">
        <Card><CardHeader><CardTitle className="text-base">Thông tin sự kiện</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">
          <IRow icon={CalendarDays} label="Ngày" value={formatDate(event.date)} /><IRow icon={Clock} label="Giờ" value={`${event.startTime} - ${event.endTime}`} /><IRow icon={Clock} label="Ca" value={SHIFT_LABELS[event.shift]} /><IRow icon={MapPin} label="Địa điểm" value={event.location} /><IRow icon={UserIcon} label="Người phụ trách" value={event.organizerName} /><IRow icon={Phone} label="Liên hệ" value={event.contactPhone} /><Separator /><IRow icon={Users} label="Sức chứa" value={`${event.registeredCount} / ${event.maxCapacity}`} /><div className="space-y-1"><Progress value={pct} className="h-2" /><p className="text-xs text-muted-foreground">{pct}% đã đăng ký {full && '(Đã đủ)'}</p></div><Separator /><IRow icon={Award} label="Ngày công" value={`${event.workdayCredit} ngày`} /><IRow icon={CalendarClock} label="Hạn đăng ký" value={formatDateTime(event.registrationClose)} /><IRow icon={CalendarClock} label="Hạn hủy" value={formatDateTime(event.cancellationDeadline)} />
        </CardContent></Card>
        <Card><CardContent className="space-y-3 p-5">
          {myReg ? (myReg.status === 'completed' ? <div className="text-center"><CheckCircle2 className="mx-auto mb-2 h-12 w-12 text-success" /><p className="font-semibold">Đã hoàn thành</p></div> : myReg.status === 'cancelled' ? <div className="text-center"><XCircle className="mx-auto mb-2 h-12 w-12 text-muted-foreground" /><p className="font-semibold">Đã hủy</p></div> : <div className="space-y-3"><div className="flex items-center gap-2 rounded-lg bg-success/10 p-3 text-sm text-success"><CheckCircle2 className="h-5 w-5" /><span>Bạn đã đăng ký sự kiện này</span></div>{canCancel ? <Button variant="outline" className="w-full text-destructive" onClick={() => setCancelOpen(true)}><XCircle className="mr-2 h-4 w-4" /> Hủy đăng ký</Button> : <p className="text-center text-xs text-muted-foreground">Đã quá hạn hủy</p>}</div>) :
            full ? <div className="text-center"><Users className="mx-auto mb-2 h-12 w-12 text-warning" /><p className="font-semibold">Sự kiện đã đủ</p></div> :
            canRegister ? <Button className="w-full" onClick={() => setConfirmOpen(true)} disabled={registering}>{registering ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" /> : <><CheckCircle2 className="mr-2 h-4 w-4" /> Đăng ký ngay</>}</Button> : <p className="text-center text-sm text-muted-foreground">Sự kiện không mở đăng ký</p>}
        </CardContent></Card>
      </div>
    </div>
    <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} title="Xác nhận đăng ký" description={`Đăng ký sự kiện "${event.name}" vào ${formatDate(event.date)}?`} confirmLabel="Xác nhận" onConfirm={handleRegister} />
    <ConfirmDialog open={cancelOpen} onOpenChange={setCancelOpen} title="Xác nhận hủy đăng ký" description={`Hủy đăng ký "${event.name}"? Không thể hoàn tác.`} confirmLabel="Hủy đăng ký" destructive onConfirm={handleCancel} />
  </div>;
}

function IRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return <div className="flex items-start gap-3"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /><div className="min-w-0 flex-1"><p className="text-xs text-muted-foreground">{label}</p><p className="font-medium text-foreground">{value}</p></div></div>;
}
