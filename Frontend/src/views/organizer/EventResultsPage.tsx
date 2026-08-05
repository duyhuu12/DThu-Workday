'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Award, BarChart3, CheckCircle2, Download, Loader2 } from 'lucide-react';
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
import { completeAttendanceEvent } from '@/services/attendanceApi';
import { exportEventAttendance } from '@/services/reportApi';

export default function EventResultsPage() {
  const params = useParams<{ id: string }>();
  const eventId = params?.id;
  const router = useRouter();
  const { toast } = useToast();
  const {
    events,
    registrations,
    fetchEvents,
    fetchRegistrations,
    fetchCredits,
  } = useAppStore();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const event = events.find((item) => item.id === eventId);
  const eventRegistrations = useMemo(
    () => registrations.filter((registration) => registration.eventId === eventId),
    [registrations, eventId],
  );

  useEffect(() => {
    void Promise.all([fetchEvents(), fetchRegistrations(), fetchCredits()]);
  }, [fetchEvents, fetchRegistrations, fetchCredits]);

  if (!event) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
        </Button>
        <EmptyState icon={BarChart3} title="Không tìm thấy sự kiện" />
      </div>
    );
  }

  const present = eventRegistrations.filter((registration) =>
    ['checked_out', 'checked_in', 'late', 'early_leave'].includes(registration.attendanceStatus ?? ''),
  ).length;
  const absent = eventRegistrations.filter((registration) => registration.attendanceStatus === 'absent').length;
  const totalCredits = eventRegistrations.reduce(
    (sum, registration) => sum + (registration.workdayResult ?? 0),
    0,
  );
  const attendanceRate = eventRegistrations.length > 0
    ? Math.round((present / eventRegistrations.length) * 100)
    : 0;
  const sorted = [...eventRegistrations].sort(
    (left, right) => (right.workdayResult ?? 0) - (left.workdayResult ?? 0),
  );
  const isConfirmed =
    event.status === 'completed' &&
    eventRegistrations.every((registration) =>
      ['completed', 'absent', 'cancelled'].includes(registration.status),
    );

  async function handleConfirmResults() {
    if (!eventId) return;
    setSubmitting(true);
    try {
      await completeAttendanceEvent(eventId);
      await Promise.all([fetchEvents(), fetchRegistrations(), fetchCredits()]);
      toast({ title: 'Đã hoàn tất sự kiện và ghi nhận ngày công' });
    } catch (error) {
      toast({
        title: 'Xác nhận kết quả thất bại',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleExport() {
    if (!eventId) return;
    setExporting(true);
    try {
      await exportEventAttendance(eventId);
      toast({ title: 'Đã xuất danh sách điểm danh' });
    } catch (error) {
      toast({
        title: 'Xuất báo cáo thất bại',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="mr-1 h-4 w-4" /> Quay lại
      </Button>

      <PageHeader title="Kết quả sự kiện" description={event.name}>
        <Button variant="outline" onClick={handleExport} disabled={exporting}>
          {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Xuất CSV
        </Button>
        {!isConfirmed && (
          <Button onClick={() => setConfirmOpen(true)} disabled={submitting || event.status !== 'ongoing'}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Xác nhận kết quả
          </Button>
        )}
        {isConfirmed && <StatusBadge label="Đã xác nhận" variant="bg-success/15 text-success" />}
      </PageHeader>

      {!isConfirmed && event.status !== 'ongoing' && (
        <p className="text-sm text-muted-foreground">
          Chỉ có thể xác nhận kết quả khi sự kiện đang diễn ra; hệ thống vẫn kiểm tra phải qua giờ kết thúc.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Tổng đăng ký" value={eventRegistrations.length} icon={BarChart3} iconClassName="bg-primary/10 text-primary" />
        <StatCard title="Có mặt" value={present} icon={BarChart3} iconClassName="bg-success/10 text-success" />
        <StatCard title="Vắng mặt" value={absent} icon={BarChart3} iconClassName="bg-destructive/10 text-destructive" />
        <StatCard title="Tổng ngày công" value={totalCredits} suffix="ngày" icon={Award} iconClassName="bg-secondary/10 text-secondary" />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Tỷ lệ tham gia</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{present}/{eventRegistrations.length} sinh viên</span>
            <span className="font-semibold">{attendanceRate}%</span>
          </div>
          <Progress value={attendanceRate} className="h-3" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Chi tiết theo sinh viên</CardTitle></CardHeader>
        <CardContent>
          {sorted.length === 0 ? (
            <EmptyState icon={BarChart3} title="Không có dữ liệu" />
          ) : (
            <div className="space-y-2">
              {sorted.map((registration) => (
                <div key={registration.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{registration.studentName}</p>
                    <p className="text-sm text-muted-foreground">{registration.studentCode} • {registration.className}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-secondary">{registration.workdayResult ?? 0} ngày công</p>
                    <p className="text-xs text-muted-foreground">
                      {registration.attendanceStatus === 'absent'
                        ? 'Vắng mặt'
                        : ['checked_out', 'checked_in', 'late', 'early_leave'].includes(registration.attendanceStatus ?? '')
                          ? 'Có mặt'
                          : 'Chưa điểm danh'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Xác nhận kết quả"
        description={`Xác nhận kết quả cho "${event.name}"? Backend sẽ ghi ngày công cho sinh viên có mặt và đánh dấu vắng đối với sinh viên chưa điểm danh.`}
        confirmLabel="Xác nhận"
        onConfirm={handleConfirmResults}
      />
    </div>
  );
}
