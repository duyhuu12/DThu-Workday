'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { parseISO, isAfter } from 'date-fns';
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Award,
  Phone,
  User as UserIcon,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shirt,
  Wrench,
  ListChecks,
  FileText,
  CalendarClock,
} from 'lucide-react';
import { useAppStore, useCurrentStudent } from '@/hooks/useAppStore';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  EVENT_STATUS_LABELS,
  EVENT_STATUS_VARIANTS,
  SHIFT_LABELS,
} from '@/lib/constants';
import { formatDate, formatDateTime } from '@/lib/format';

export default function WorkEventDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const {
    events,
    registrations,
    addRegistration,
    updateRegistration,
    fetchEvents,
    fetchRegistrations,
    fetchCurrentStudent,
  } = useAppStore();
  const student = useCurrentStudent();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [registering, setRegistering] = useState(false);

  const event = events.find((item) => item.id === id);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedShift, setSelectedShift] = useState('');

  useEffect(() => {
    Promise.all([fetchCurrentStudent(), fetchEvents(), fetchRegistrations()]).finally(() =>
      setLoading(false),
    );
  }, [fetchCurrentStudent, fetchEvents, fetchRegistrations]);

  useEffect(() => {
    if (event) {
      setSelectedDate(event.date);
      setSelectedShift(event.shift);
    }
  }, [event]);

  const myReg = useMemo(
    () =>
      registrations.find(
        (registration) =>
          registration.eventId === id &&
          registration.studentId === student?.id,
      ),
    [registrations, id, student],
  );

  const overlap = useMemo(() => {
    if (!event || !student) return null;

    const active = registrations.filter(
      (registration) =>
        registration.studentId === student.id &&
        ['approved', 'pending', 'waitlist'].includes(registration.status) &&
        registration.eventId !== event.id,
    );

    for (const registration of active) {
      const other = events.find((item) => item.id === registration.eventId);
      if (!other) continue;

      const otherDate = registration.selectedDate || other.date;
      const otherStart = registration.selectedStartTime || other.startTime;
      const otherEnd = registration.selectedEndTime || other.endTime;

      if (
        otherDate === selectedDate &&
        event.startTime < otherEnd &&
        otherStart < event.endTime
      ) {
        return other;
      }
    }

    return null;
  }, [event, student, registrations, events, selectedDate]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
        </Button>
        <p className="text-sm text-muted-foreground">Đang tải sự kiện...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
        </Button>
        <EmptyState icon={CalendarDays} title="Không tìm thấy sự kiện" />
      </div>
    );
  }

  const now = new Date();
  const registrationOpened =
    !isAfter(parseISO(event.registrationOpen), now) &&
    isAfter(parseISO(event.registrationClose), now);
  const full = event.registeredCount >= event.maxCapacity;
  const pct =
    event.maxCapacity > 0
      ? Math.round((event.registeredCount / event.maxCapacity) * 100)
      : 0;
  const [startHour, startMinute] = event.startTime.split(':').map(Number);
  const [endHour, endMinute] = event.endTime.split(':').map(Number);
  const durationHours = Math.max(
    0,
    ((endHour * 60 + endMinute) - (startHour * 60 + startMinute)) / 60,
  );

  const canRegister =
    event.status === 'open' &&
    registrationOpened &&
    (!myReg || myReg.status === 'cancelled') &&
    !full &&
    !overlap &&
    Boolean(student);

  const canCancel =
    myReg &&
    ['pending', 'approved', 'waitlist'].includes(myReg.status) &&
    isAfter(parseISO(event.cancellationDeadline), now);

  let unavailableReason = 'Sự kiện không mở đăng ký';
  if (event.status !== 'open') unavailableReason = 'Sự kiện chưa được mở đăng ký';
  else if (!registrationOpened) unavailableReason = 'Chưa đến hoặc đã hết thời gian đăng ký';
  else if (full) unavailableReason = 'Sự kiện đã đủ số lượng';
  else if (overlap) unavailableReason = `Trùng lịch với "${overlap.name}"`;
  else if (!student) unavailableReason = 'Không tìm thấy hồ sơ sinh viên';

  async function handleRegister() {
    if (!student) return;

    setRegistering(true);
    try {
      await addRegistration({
        eventId: event.id,
        studentId: student.id,
        selectedDate,
        selectedShift: selectedShift as typeof event.shift,
        selectedStartTime: event.startTime,
        selectedEndTime: event.endTime,
      });

      await fetchRegistrations();
      toast({
        title: 'Đăng ký thành công',
        description: 'Đăng ký đang chờ người phụ trách duyệt',
      });
      setConfirmOpen(false);
    } catch (error) {
      toast({
        title: 'Đăng ký thất bại',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
        variant: 'destructive',
      });
    } finally {
      setRegistering(false);
    }
  }

  async function handleCancel() {
    if (!myReg) return;

    try {
      await updateRegistration(myReg.id, { status: 'cancelled' });
      await fetchRegistrations();
      toast({ title: 'Đã hủy đăng ký' });
      setCancelOpen(false);
    } catch (error) {
      toast({
        title: 'Không thể hủy đăng ký',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="mr-1 h-4 w-4" /> Quay lại
      </Button>

      <div className="relative flex h-44 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 sm:h-56">
        <CalendarDays className="h-10 w-10 text-primary/40" />
        <div className="absolute left-4 top-4">
          <StatusBadge
            label={EVENT_STATUS_LABELS[event.status]}
            variant={EVENT_STATUS_VARIANTS[event.status]}
          />
        </div>
      </div>

      <PageHeader title={event.name} description={`Mã: ${event.code}`}>
        {myReg && (
          <StatusBadge
            label="Đã đăng ký"
            variant="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
          />
        )}
      </PageHeader>

      {overlap && !myReg && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Cảnh báo trùng lịch</AlertTitle>
          <AlertDescription>
            Sự kiện trùng giờ với &quot;{overlap.name}&quot;.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-primary" /> Mô tả sự kiện
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{event.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ListChecks className="h-4 w-4 text-primary" /> Nội dung công việc
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{event.workContent}</p>
            </CardContent>
          </Card>

          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shirt className="h-4 w-4 text-primary" /> Trang phục
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{event.clothingRequirements || 'Không yêu cầu'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wrench className="h-4 w-4 text-primary" /> Trang thiết bị
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{event.equipmentRequirements || 'Không yêu cầu'}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thông tin sự kiện</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <IRow icon={CalendarDays} label="Ngày" value={formatDate(event.date)} />
              <IRow icon={Clock} label="Giờ" value={`${event.startTime} - ${event.endTime}`} />
              <IRow icon={Clock} label="Ca" value={SHIFT_LABELS[event.shift]} />
              <IRow icon={MapPin} label="Địa điểm" value={event.location} />
              <IRow icon={UserIcon} label="Người phụ trách" value={event.contactPerson || event.organizerName} />
              <IRow icon={Phone} label="Liên hệ" value={event.contactPhone} />
              <Separator />
              <IRow icon={Users} label="Số lượng" value={`${event.registeredCount} / ${event.maxCapacity}`} />
              <Progress value={pct} className="h-2" />
              <Separator />
              <IRow icon={Award} label="Quy đổi" value={`${event.workdayCredit} ngày công`} />
              <IRow icon={Clock} label="Thời lượng" value={`${durationHours} giờ`} />
              <IRow icon={CalendarClock} label="Hạn đăng ký" value={formatDateTime(event.registrationClose)} />
              <IRow icon={CalendarClock} label="Hạn hủy" value={formatDateTime(event.cancellationDeadline)} />
            </CardContent>
          </Card>

          {(!myReg || myReg.status === 'cancelled') && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Chọn ngày và ca lao động</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select value={selectedDate} onValueChange={setSelectedDate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn ngày" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={event.date}>{formatDate(event.date)}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedShift} onValueChange={setSelectedShift}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn ca" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={event.shift}>
                      {SHIFT_LABELS[event.shift]} ({event.startTime} - {event.endTime})
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Sự kiện hiện được cấu hình một ngày và một ca. Lựa chọn của bạn vẫn được lưu trong đăng ký.
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="space-y-3 p-5">
              {myReg ? (
                myReg.status === 'completed' ? (
                  <div className="text-center">
                    <CheckCircle2 className="mx-auto mb-2 h-12 w-12 text-success" />
                    <p className="font-semibold">Đã hoàn thành</p>
                  </div>
                ) : myReg.status === 'cancelled' ? (
                  canRegister ? (
                    <div className="space-y-3 text-center">
                      <p className="text-sm text-muted-foreground">Đăng ký trước đã được hủy.</p>
                      <Button className="w-full" onClick={() => setConfirmOpen(true)} disabled={registering}>
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Đăng ký lại
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <XCircle className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
                      <p className="font-semibold">Đã hủy</p>
                      <p className="mt-1 text-xs text-muted-foreground">{unavailableReason}</p>
                    </div>
                  )
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 rounded-lg bg-success/10 p-3 text-sm text-success">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>Trạng thái: {myReg.status}</span>
                    </div>
                    {canCancel ? (
                      <Button
                        variant="outline"
                        className="w-full text-destructive"
                        onClick={() => setCancelOpen(true)}
                      >
                        <XCircle className="mr-2 h-4 w-4" /> Hủy đăng ký
                      </Button>
                    ) : (
                      <p className="text-center text-xs text-muted-foreground">
                        Đã quá hạn hủy hoặc đăng ký đã kết thúc
                      </p>
                    )}
                  </div>
                )
              ) : canRegister ? (
                <Button
                  className="w-full"
                  onClick={() => setConfirmOpen(true)}
                  disabled={registering}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Đăng ký ngay
                </Button>
              ) : (
                <p className="text-center text-sm text-muted-foreground">
                  {unavailableReason}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Xác nhận đăng ký"
        description={`Đăng ký "${event.name}" ngày ${formatDate(selectedDate)}, ca ${SHIFT_LABELS[selectedShift as keyof typeof SHIFT_LABELS]}?`}
        confirmLabel="Xác nhận"
        onConfirm={handleRegister}
      />

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Xác nhận hủy đăng ký"
        description={`Hủy đăng ký "${event.name}"?`}
        confirmLabel="Hủy đăng ký"
        destructive
        onConfirm={handleCancel}
      />
    </div>
  );
}

function IRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}
