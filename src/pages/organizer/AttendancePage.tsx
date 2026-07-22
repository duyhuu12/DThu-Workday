'use client';
import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, UserCheck, Check, X, QrCode } from 'lucide-react';
import { useAppStore } from '@/hooks/useAppStore';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { ATT_STATUS_LABELS, ATT_STATUS_VARIANTS } from '@/lib/constants';
import type { AttendanceStatus, Registration } from '@/types';

const initials = (name: string) => name.trim().split(' ').slice(-2).map((p) => p[0]).join('').toUpperCase();
const STATUS_ORDER: AttendanceStatus[] = ['not_checked', 'checked_in', 'checked_out', 'late', 'early_leave', 'absent'];

export default function AttendancePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { events, registrations, updateRegistration, addNotification } = useAppStore();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const event = events.find((e) => e.id === id);
  const approvedRegs = useMemo(() => registrations.filter((r) => r.eventId === id && (r.status === 'approved' || r.status === 'completed' || r.status === 'absent')), [registrations, id]);
  const filtered = approvedRegs.filter((r) => { if (!search) return true; const q = search.toLowerCase(); return r.studentName.toLowerCase().includes(q) || r.studentCode.toLowerCase().includes(q); });

  if (!event) return <div className="space-y-6"><Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" /> Quay lại</Button><EmptyState icon={UserCheck} title="Không tìm thấy sự kiện" /></div>;

  async function setAttendance(reg: Registration, status: AttendanceStatus) {
    await updateRegistration(reg.id, { attendanceStatus: status, status: status === 'absent' ? 'absent' : status === 'checked_out' ? 'completed' : reg.status });
    addNotification({ userId: reg.studentId, type: 'event', title: 'Cập nhật điểm danh', message: `Điểm danh "${event?.name}" đã được cập nhật: ${ATT_STATUS_LABELS[status]}`, link: '/student/my-registrations' });
    toast({ title: 'Đã cập nhật điểm danh', description: `${reg.studentName}: ${ATT_STATUS_LABELS[status]}` });
  }

  const present = approvedRegs.filter((r) => r.attendanceStatus === 'checked_out' || r.attendanceStatus === 'checked_in').length;
  const absent = approvedRegs.filter((r) => r.attendanceStatus === 'absent').length;

  return <div className="space-y-6">
    <Button variant="ghost" size="sm" onClick={() => router.back()}><ArrowLeft className="mr-1 h-4 w-4" /> Quay lại</Button>
    <PageHeader title="Điểm danh" description={event.name} />
    <div className="grid gap-4 sm:grid-cols-3">
      <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-foreground">{approvedRegs.length}</p><p className="text-sm text-muted-foreground">Tổng số</p></CardContent></Card>
      <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-success">{present}</p><p className="text-sm text-muted-foreground">Có mặt</p></CardContent></Card>
      <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-destructive">{absent}</p><p className="text-sm text-muted-foreground">Vắng mặt</p></CardContent></Card>
    </div>
    <Card><CardContent className="flex flex-col items-center gap-3 p-6 sm:flex-row sm:gap-6">
      <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-primary/5">
        <QrCode className="h-20 w-20 text-primary/40" />
      </div>
      <div className="space-y-1 text-center sm:text-left">
        <h3 className="font-semibold text-foreground">Mã QR điểm danh</h3>
        <p className="text-sm text-muted-foreground">Sinh viên quét mã QR để xác nhận tham gia sự kiện. (Bản demo - chức năng quét sẽ được kích hoạt sau.)</p>
        <p className="font-mono text-xs text-muted-foreground">{event.code}-{event.date.replace(/-/g, '')}</p>
      </div>
    </CardContent></Card>
    {filtered.length === 0 ? <EmptyState icon={UserCheck} title="Không có sinh viên" /> : <div className="space-y-2">{filtered.map((reg) => <Card key={reg.id}><CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><Avatar className="h-10 w-10"><AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">{initials(reg.studentName)}</AvatarFallback></Avatar><div><p className="font-medium text-foreground">{reg.studentName}</p><p className="text-sm text-muted-foreground">{reg.studentCode} • {reg.className}</p></div></div><div className="flex items-center gap-2"><StatusBadge label={ATT_STATUS_LABELS[reg.attendanceStatus ?? 'not_checked']} variant={ATT_STATUS_VARIANTS[reg.attendanceStatus ?? 'not_checked']} /><div className="flex gap-1"><Button size="sm" variant={reg.attendanceStatus === 'checked_out' ? 'default' : 'outline'} onClick={() => setAttendance(reg, 'checked_out')}><Check className="h-4 w-4" /></Button><Button size="sm" variant={reg.attendanceStatus === 'absent' ? 'destructive' : 'outline'} onClick={() => setAttendance(reg, 'absent')}><X className="h-4 w-4" /></Button></div></div></CardContent></Card>)}</div>}
  </div>;
}
