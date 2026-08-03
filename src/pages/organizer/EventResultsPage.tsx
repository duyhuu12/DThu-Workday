'use client';
import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, BarChart3, Award, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '@/hooks/useAppStore';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export default function EventResultsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { toast } = useToast();
  const { events, registrations, updateEvent, updateRegistration, addActivityLog, addNotification } = useAppStore();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const event = events.find((e) => e.id === id);
  const eventRegs = useMemo(() => registrations.filter((r) => r.eventId === id), [registrations, id]);

  if (!event) return <div className="space-y-6"><Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" /> Quay lại</Button><EmptyState icon={BarChart3} title="Không tìm thấy sự kiện" /></div>;
  const present = eventRegs.filter((r) => r.attendanceStatus === 'checked_out' || r.attendanceStatus === 'checked_in').length;
  const absent = eventRegs.filter((r) => r.attendanceStatus === 'absent').length;
  const totalCredits = eventRegs.filter((r) => r.workdayResult !== undefined).reduce((s, r) => s + (r.workdayResult ?? 0), 0);
  const attendanceRate = eventRegs.length > 0 ? Math.round((present / eventRegs.length) * 100) : 0;
  const sorted = [...eventRegs].sort((a, b) => (b.workdayResult ?? 0) - (a.workdayResult ?? 0));
  const isConfirmed = event.status === 'completed';

  async function handleConfirmResults() {
    if (!event) return;
    for (const r of eventRegs) {
      if (r.attendanceStatus === 'checked_out' || r.attendanceStatus === 'checked_in') {
        const credit = r.workdayResult ?? event.workdayCredit;
        await updateRegistration(r.id, { status: 'completed', workdayResult: credit });
      } else if (r.attendanceStatus === 'absent') {
        await updateRegistration(r.id, { status: 'absent', workdayResult: 0 });
      }
    }
    await updateEvent(event.id, { status: 'completed' });
    addActivityLog({ action: 'Xác nhận kết quả sự kiện', affectedItem: event.name, oldValue: event.status, newValue: 'completed' });
    addNotification({ userId: event.organizerId, type: 'event', title: 'Kết quả đã xác nhận', message: `Kết quả "${event.name}" đã được xác nhận.`, link: '/organizer/events' });
    toast({ title: 'Đã xác nhận kết quả sự kiện' });
  }

  return <div className="space-y-6">
    <Button variant="ghost" size="sm" onClick={() => router.back()}><ArrowLeft className="mr-1 h-4 w-4" /> Quay lại</Button>
    <PageHeader title="Kết quả sự kiện" description={event.name}>{!isConfirmed && <Button onClick={() => setConfirmOpen(true)}><CheckCircle2 className="mr-2 h-4 w-4" /> Xác nhận kết quả</Button>}{isConfirmed && <StatusBadge label="Đã xác nhận" variant="bg-success/15 text-success" />}</PageHeader>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard title="Tổng đăng ký" value={eventRegs.length} icon={BarChart3} iconClassName="bg-primary/10 text-primary" />
      <StatCard title="Có mặt" value={present} icon={BarChart3} iconClassName="bg-success/10 text-success" />
      <StatCard title="Vắng mặt" value={absent} icon={BarChart3} iconClassName="bg-destructive/10 text-destructive" />
      <StatCard title="Tổng ngày công" value={totalCredits} suffix="ngày" icon={Award} iconClassName="bg-secondary/10 text-secondary" />
    </div>
    <Card><CardHeader><CardTitle className="text-base">Tỷ lệ tham gia</CardTitle></CardHeader><CardContent className="space-y-2"><div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">{present}/{eventRegs.length} sinh viên</span><span className="font-semibold text-foreground">{attendanceRate}%</span></div><Progress value={attendanceRate} className="h-3" /></CardContent></Card>
    <Card><CardHeader><CardTitle className="text-base">Chi tiết theo sinh viên</CardTitle></CardHeader><CardContent>{sorted.length === 0 ? <EmptyState icon={BarChart3} title="Không có dữ liệu" /> : <div className="space-y-2">{sorted.map((r) => <div key={r.id} className="flex items-center justify-between rounded-lg border p-3"><div><p className="font-medium text-foreground">{r.studentName}</p><p className="text-sm text-muted-foreground">{r.studentCode} • {r.className}</p></div><div className="text-right"><p className="font-semibold text-secondary">{r.workdayResult ?? 0} ngày công</p><p className="text-xs text-muted-foreground">{r.attendanceStatus === 'absent' ? 'Vắng mặt' : r.attendanceStatus === 'checked_out' ? 'Đã hoàn thành' : 'Chưa điểm danh'}</p></div></div>)}</div>}</CardContent></Card>
    <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} title="Xác nhận kết quả" description={`Xác nhận kết quả cho "${event.name}"? Hành động này sẽ ghi nhận ngày công cho sinh viên có mặt và không thể hoàn tác.`} confirmLabel="Xác nhận" onConfirm={handleConfirmResults} />
  </div>;
}
