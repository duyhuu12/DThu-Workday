'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { isAfter, parseISO } from 'date-fns';
import {
  Award,
  CalendarDays,
  Clock,
  ClipboardList,
  History,
  MapPin,
  QrCode,
  Search,
  XCircle,
} from 'lucide-react';
import { useAppStore, useCurrentStudent } from '@/hooks/useAppStore';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  ATT_STATUS_LABELS,
  ATT_STATUS_VARIANTS,
  REG_STATUS_LABELS,
  REG_STATUS_VARIANTS,
  SHIFT_LABELS,
} from '@/lib/constants';
import { formatDate, formatDateTime } from '@/lib/format';
import type { Registration } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

const TABS = ['all', 'pending', 'approved', 'waitlist', 'completed', 'cancelled', 'absent'] as const;
type Tab = (typeof TABS)[number];
const TAB_LABELS: Record<Tab, string> = {
  all: 'Tất cả',
  pending: 'Đang xử lý',
  approved: 'Đã đăng ký',
  waitlist: 'Danh sách chờ',
  completed: 'Đã hoàn thành',
  cancelled: 'Đã hủy',
  absent: 'Vắng mặt',
};

export default function MyRegistrationsPage() {
  const {
    registrations,
    events,
    updateRegistration,
    fetchRegistrations,
    fetchEvents,
    fetchCurrentStudent,
  } = useAppStore();
  const student = useCurrentStudent();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cancelTarget, setCancelTarget] = useState<Registration | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    Promise.all([fetchCurrentStudent(), fetchRegistrations(), fetchEvents()])
      .finally(() => setLoading(false));
  }, [fetchCurrentStudent, fetchRegistrations, fetchEvents]);

  const myRegs = useMemo(
    () => registrations.filter((registration) => registration.studentId === student?.id),
    [registrations, student],
  );

  const filtered = myRegs.filter((registration) => {
    if (tab !== 'all' && registration.status !== tab) return false;
    if (statusFilter !== 'all' && registration.status !== statusFilter) return false;
    if (search) {
      const event = events.find((item) => item.id === registration.eventId);
      if (!event?.name.toLowerCase().includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const counts: Record<string, number> = { all: myRegs.length };
  for (const item of TABS) {
    if (item !== 'all') counts[item] = myRegs.filter((registration) => registration.status === item).length;
  }

  const canCancel = (registration: Registration) => {
    if (['cancelled', 'completed', 'absent'].includes(registration.status)) return false;
    const event = events.find((item) => item.id === registration.eventId);
    return event ? isAfter(parseISO(event.cancellationDeadline), new Date()) : false;
  };

  async function handleCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await updateRegistration(cancelTarget.id, { status: 'cancelled' });
      toast({ title: 'Đã hủy đăng ký', description: 'Số lượng đăng ký của sự kiện đã được cập nhật.' });
      setCancelTarget(null);
    } catch (error) {
      toast({
        title: 'Không thể hủy đăng ký',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
        variant: 'destructive',
      });
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Đăng ký của tôi" description="Theo dõi các đăng ký ngày công" />
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <Card key={item}>
              <CardContent className="space-y-3 p-5">
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Đăng ký của tôi" description="Theo dõi các đăng ký ngày công">
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/student/history"><History className="mr-2 h-4 w-4" /> Lịch sử</Link>
          </Button>
          <Button asChild>
            <Link href="/student/qr-attendance"><QrCode className="mr-2 h-4 w-4" /> Điểm danh QR</Link>
          </Button>
        </div>
      </PageHeader>

      <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
        <div className="overflow-x-auto pb-1">
          <TabsList className="flex w-max">
            {TABS.map((item) => (
              <TabsTrigger key={item} value={item} className="gap-1.5">
                {TAB_LABELS[item]}
                {counts[item] > 0 && (
                  <span className="rounded-full bg-primary/15 px-1.5 text-xs font-semibold text-primary">
                    {counts[item]}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Tìm sự kiện..." value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 sm:w-48"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {Object.entries(REG_STATUS_LABELS).map(([key, value]) => <SelectItem key={key} value={key}>{value}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 space-y-3">
          {filtered.length === 0 ? (
            <EmptyState icon={ClipboardList} title="Không có đăng ký" />
          ) : (
            filtered.map((registration) => {
              const event = events.find((item) => item.id === registration.eventId);
              const date = registration.selectedDate || event?.date;
              const startTime = registration.selectedStartTime || event?.startTime;
              const endTime = registration.selectedEndTime || event?.endTime;
              const shift = registration.selectedShift || event?.shift;

              return (
                <Card key={registration.id} className="transition-shadow hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-start gap-2">
                          {event ? (
                            <Link href={`/student/work-events/${event.id}`} className="font-semibold text-primary hover:underline">
                              {event.name}
                            </Link>
                          ) : (
                            <h3 className="font-semibold text-foreground">Sự kiện</h3>
                          )}
                          <StatusBadge label={REG_STATUS_LABELS[registration.status]} variant={REG_STATUS_VARIANTS[registration.status]} />
                        </div>

                        {event && (
                          <div className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
                            <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> {date ? formatDate(date) : '—'}</span>
                            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {startTime || '—'}-{endTime || '—'} {shift ? `(${SHIFT_LABELS[shift]})` : ''}</span>
                            <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {event.location}</span>
                            <span className="flex items-center gap-1.5"><Award className="h-3.5 w-3.5" /> {event.workdayCredit} ngày công</span>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="text-muted-foreground">Đăng ký: {formatDateTime(registration.registeredAt)}</span>
                          {registration.attendanceStatus && registration.attendanceStatus !== 'not_checked' && (
                            <StatusBadge label={ATT_STATUS_LABELS[registration.attendanceStatus]} variant={ATT_STATUS_VARIANTS[registration.attendanceStatus]} />
                          )}
                          {registration.workdayResult !== undefined && (
                            <span className="rounded-md bg-secondary/10 px-2 py-0.5 font-medium text-secondary">
                              Kết quả: {registration.workdayResult} ngày
                            </span>
                          )}
                        </div>
                      </div>

                      {canCancel(registration) && (
                        <Button variant="outline" size="sm" className="text-destructive" onClick={() => setCancelTarget(registration)}>
                          <XCircle className="mr-1 h-4 w-4" /> Hủy đăng ký
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </Tabs>

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        title="Hủy đăng ký"
        description={`Hủy đăng ký "${events.find((event) => event.id === cancelTarget?.eventId)?.name ?? 'sự kiện'}"?`}
        confirmLabel={cancelling ? 'Đang hủy...' : 'Hủy đăng ký'}
        destructive
        onConfirm={handleCancel}
      />
    </div>
  );
}
