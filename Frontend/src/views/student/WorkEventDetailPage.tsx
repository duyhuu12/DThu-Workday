'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { isAfter, parseISO } from 'date-fns';
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  ListChecks,
  MapPin,
  Phone,
  Shirt,
  User as UserIcon,
  Users,
  Wrench,
  XCircle,
} from 'lucide-react';
import { useAppStore, useCurrentStudent } from '@/hooks/useAppStore';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { EVENT_STATUS_LABELS, SHIFT_LABELS } from '@/lib/constants';
import { formatDate, formatDateTime } from '@/lib/format';
import type { RegistrationStatus } from '@/types';

const REGISTRATION_LABELS: Record<RegistrationStatus, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã được duyệt',
  waitlist: 'Danh sách chờ',
  completed: 'Đã hoàn thành',
  cancelled: 'Đã hủy',
  absent: 'Vắng mặt',
};

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
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedShift, setSelectedShift] = useState('');

  const event = events.find((item) => item.id === id);

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
          registration.eventId === id && registration.studentId === student?.id,
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
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-8 w-36 animate-pulse rounded-full bg-muted" />
        <div className="h-72 animate-pulse rounded-2xl bg-muted" />
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="h-80 animate-pulse rounded-2xl bg-muted" />
          <div className="h-96 animate-pulse rounded-2xl bg-muted" />
        </div>
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
  const pct = event.maxCapacity > 0
    ? Math.round((event.registeredCount / event.maxCapacity) * 100)
    : 0;
  const [startHour, startMinute] = event.startTime.split(':').map(Number);
  const [endHour, endMinute] = event.endTime.split(':').map(Number);
  const durationHours = Math.max(
    0,
    ((endHour * 60 + endMinute) - (startHour * 60 + startMinute)) / 60,
  );
  const eventId = event.id;
  const eventShift = event.shift;
  const eventStartTime = event.startTime;
  const eventEndTime = event.endTime;

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
        eventId,
        studentId: student.id,
        selectedDate,
        selectedShift: selectedShift as typeof eventShift,
        selectedStartTime: eventStartTime,
        selectedEndTime: eventEndTime,
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
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <button
        type="button"
        onClick={() => router.back()}
        className="group inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full border bg-background transition-colors group-hover:border-primary/30 group-hover:text-primary">
          <ArrowLeft className="h-4 w-4" />
        </span>
        Danh sách sự kiện
      </button>

      <section className="relative overflow-hidden rounded-2xl bg-primary px-6 py-7 text-primary-foreground shadow-lg shadow-primary/10 sm:px-9 sm:py-9 lg:px-12 lg:py-11">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border-[48px] border-white/5" />
        <div className="pointer-events-none absolute -bottom-24 right-40 h-52 w-52 rounded-full bg-white/[0.035]" />

        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_190px] lg:items-end">
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <StatusBadge label={EVENT_STATUS_LABELS[event.status]} variant="bg-white text-primary shadow-sm" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/65">{event.code}</span>
              {myReg && myReg.status !== 'cancelled' && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-100 ring-1 ring-inset ring-emerald-300/25">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Đã đăng ký
                </span>
              )}
            </div>
            <h1 className="max-w-4xl text-2xl font-bold leading-tight tracking-tight sm:text-3xl lg:text-[2.5rem] lg:leading-[1.15]">
              {event.name}
            </h1>
            <div className="mt-7 flex flex-wrap gap-x-7 gap-y-3 border-t border-white/15 pt-5 text-sm text-primary-foreground/85">
              <Meta icon={CalendarDays}>{formatDate(event.date)}</Meta>
              <Meta icon={Clock}>{event.startTime} – {event.endTime}</Meta>
              <Meta icon={MapPin}>{event.location}</Meta>
            </div>
          </div>

          <div className="flex items-end justify-between gap-5 border-white/15 lg:block lg:border-l lg:pl-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-foreground/60">Quy đổi</p>
              <p className="mt-1 text-4xl font-bold tracking-tight">{event.workdayCredit}</p>
              <p className="text-sm text-primary-foreground/70">ngày công</p>
            </div>
            <div className="text-right lg:mt-6 lg:text-left">
              <p className="text-xs text-primary-foreground/60">Thời lượng</p>
              <p className="mt-1 font-semibold">{durationHours} giờ · {SHIFT_LABELS[event.shift]}</p>
            </div>
          </div>
        </div>
      </section>

      {overlap && !myReg && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Cảnh báo trùng lịch</AlertTitle>
          <AlertDescription>
            Thời gian sự kiện trùng với &quot;{overlap.name}&quot;. Bạn cần xử lý lịch hiện tại trước khi đăng ký.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_360px] xl:gap-10">
        <main className="min-w-0 space-y-7">
          <Card className="overflow-hidden rounded-2xl shadow-none">
            <CardContent className="p-6 sm:p-8">
              <SectionLabel icon={FileText}>Giới thiệu sự kiện</SectionLabel>
              <p className="mt-5 text-base leading-7 text-foreground/85 sm:text-lg sm:leading-8">{event.description}</p>
              <div className="my-7 border-t" />
              <SectionLabel icon={ListChecks}>Nội dung công việc</SectionLabel>
              <p className="mt-5 whitespace-pre-line text-sm leading-7 text-muted-foreground sm:text-base">{event.workContent}</p>
            </CardContent>
          </Card>

          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Chuẩn bị trước khi tham gia</p>
            <h2 className="mb-4 mt-1 text-xl font-bold tracking-tight">Bạn cần mang theo gì?</h2>
            <div className="overflow-hidden rounded-2xl border bg-card">
              <RequirementRow icon={Shirt} title="Trang phục" value={event.clothingRequirements || 'Không có yêu cầu riêng'} />
              <RequirementRow icon={Wrench} title="Dụng cụ & thiết bị" value={event.equipmentRequirements || 'Ban tổ chức sẽ chuẩn bị'} last />
            </div>
          </section>

          <section className="rounded-2xl border bg-muted/30 p-6 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Hỗ trợ tại sự kiện</p>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <Contact icon={UserIcon} label="Người phụ trách" value={event.contactPerson || event.organizerName} />
              <Contact icon={Phone} label="Số điện thoại" value={event.contactPhone || 'Chưa cập nhật'} phone={Boolean(event.contactPhone)} />
            </div>
          </section>
        </main>

        <aside className="space-y-5 lg:sticky lg:top-24">
          <Card className="overflow-hidden rounded-2xl border-primary/20 shadow-lg shadow-primary/5">
            <div className="border-b bg-muted/35 px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <Stat label="Đã đăng ký" value={`${event.registeredCount}/${event.maxCapacity}`} />
                <Stat label="Còn trống" value={`${Math.max(0, event.maxCapacity - event.registeredCount)} chỗ`} right accent />
              </div>
              <Progress value={pct} className="mt-3 h-2" />
            </div>

            <CardContent className="space-y-5 p-5">
              {(!myReg || myReg.status === 'cancelled') && (
                <div className="space-y-3">
                  <SelectField label="Ngày tham gia">
                    <Select value={selectedDate} onValueChange={setSelectedDate}>
                      <SelectTrigger className="h-11"><SelectValue placeholder="Chọn ngày" /></SelectTrigger>
                      <SelectContent><SelectItem value={event.date}>{formatDate(event.date)}</SelectItem></SelectContent>
                    </Select>
                  </SelectField>
                  <SelectField label="Ca lao động">
                    <Select value={selectedShift} onValueChange={setSelectedShift}>
                      <SelectTrigger className="h-11"><SelectValue placeholder="Chọn ca" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={event.shift}>{SHIFT_LABELS[event.shift]} ({event.startTime} - {event.endTime})</SelectItem>
                      </SelectContent>
                    </Select>
                  </SelectField>
                </div>
              )}

              <RegistrationAction
                registrationStatus={myReg?.status}
                canRegister={canRegister}
                canCancel={Boolean(canCancel)}
                unavailableReason={unavailableReason}
                registering={registering}
                onRegister={() => setConfirmOpen(true)}
                onCancel={() => setCancelOpen(true)}
              />

              <div className="space-y-2.5 border-t pt-4 text-xs text-muted-foreground">
                <Deadline icon={CalendarClock} label="Hạn đăng ký" value={formatDateTime(event.registrationClose)} />
                <Deadline icon={XCircle} label="Hạn hủy" value={formatDateTime(event.cancellationDeadline)} />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-none">
            <CardHeader className="p-5 pb-3"><CardTitle className="text-base">Thông tin nhanh</CardTitle></CardHeader>
            <CardContent className="space-y-4 p-5 pt-1 text-sm">
              <InfoRow icon={CalendarDays} label="Ngày tổ chức" value={formatDate(event.date)} />
              <InfoRow icon={Clock} label="Thời gian" value={`${event.startTime} – ${event.endTime}`} />
              <InfoRow icon={MapPin} label="Địa điểm" value={event.location} />
              <InfoRow icon={Users} label="Quy mô" value={`${event.maxCapacity} sinh viên`} />
              <InfoRow icon={Award} label="Đơn vị tổ chức" value={event.organizerName} />
            </CardContent>
          </Card>
        </aside>
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

function Meta({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return <span className="inline-flex min-w-0 items-center gap-2"><Icon className="h-4 w-4 shrink-0 text-primary-foreground/60" /><span className="truncate">{children}</span></span>;
}

function SectionLabel({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.16em] text-primary"><Icon className="h-4 w-4" />{children}</div>;
}

function RequirementRow({ icon: Icon, title, value, last = false }: { icon: React.ElementType; title: string; value: string; last?: boolean }) {
  return <div className={`grid gap-3 p-5 sm:grid-cols-[44px_150px_1fr] sm:items-center sm:p-6 ${last ? '' : 'border-b'}`}><span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span><p className="text-sm font-semibold">{title}</p><p className="text-sm leading-6 text-muted-foreground">{value}</p></div>;
}

function Contact({ icon: Icon, label, value, phone = false }: { icon: React.ElementType; label: string; value: string; phone?: boolean }) {
  const content = <><p className="text-xs text-muted-foreground">{label}</p><p className="mt-0.5 text-sm font-semibold">{value}</p></>;
  return <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-background text-primary shadow-sm ring-1 ring-border"><Icon className="h-4 w-4" /></span><div>{phone ? <a href={`tel:${value}`} className="hover:text-primary">{content}</a> : content}</div></div>;
}

function Stat({ label, value, right = false, accent = false }: { label: string; value: string; right?: boolean; accent?: boolean }) {
  return <div className={right ? 'text-right' : ''}><p className="text-xs font-medium text-muted-foreground">{label}</p><p className={`mt-1 text-lg font-bold ${accent ? 'text-primary' : ''}`}>{value}</p></div>;
}

function SelectField({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1.5 block text-xs font-semibold text-foreground">{label}</label>{children}</div>;
}

function Deadline({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return <p className="flex items-start gap-2"><Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />{label}<span className="ml-auto text-right font-medium text-foreground">{value}</span></p>;
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return <div className="flex items-start gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground"><Icon className="h-4 w-4" /></span><div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-0.5 font-medium leading-5 text-foreground">{value}</p></div></div>;
}

function RegistrationAction({
  registrationStatus,
  canRegister,
  canCancel,
  unavailableReason,
  registering,
  onRegister,
  onCancel,
}: {
  registrationStatus?: RegistrationStatus;
  canRegister: boolean;
  canCancel: boolean;
  unavailableReason: string;
  registering: boolean;
  onRegister: () => void;
  onCancel: () => void;
}) {
  if (registrationStatus === 'completed') {
    return <div className="rounded-xl bg-success/10 p-4 text-center text-success"><CheckCircle2 className="mx-auto mb-2 h-8 w-8" /><p className="font-semibold">Đã hoàn thành</p></div>;
  }

  if (registrationStatus && registrationStatus !== 'cancelled') {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-xl bg-success/10 p-4 text-sm text-success"><CheckCircle2 className="h-5 w-5" /><div><p className="text-xs opacity-75">Trạng thái đăng ký</p><p className="font-semibold">{REGISTRATION_LABELS[registrationStatus]}</p></div></div>
        {canCancel ? <Button variant="outline" className="w-full text-destructive" onClick={onCancel}>Hủy đăng ký</Button> : <p className="text-center text-xs leading-5 text-muted-foreground">Đã quá hạn hủy hoặc đăng ký đã kết thúc</p>}
      </div>
    );
  }

  if (canRegister) {
    return <Button size="lg" className="w-full font-semibold" onClick={onRegister} disabled={registering}>{registrationStatus === 'cancelled' ? 'Đăng ký lại' : 'Đăng ký tham gia'}<ChevronRight className="ml-1 h-4 w-4" /></Button>;
  }

  return <div className="rounded-xl bg-muted p-4 text-center"><p className="text-sm font-medium">Chưa thể đăng ký</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{unavailableReason}</p></div>;
}
