'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Award,
  User,
  Phone,
  PlayCircle,
  CheckCircle2,
  XCircle,
  Building2,
  GraduationCap,
  Ban,
  Check,
  X,
} from 'lucide-react';
import { useAppStore } from '@/hooks/useAppStore';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  EVENT_STATUS_LABELS,
  EVENT_STATUS_VARIANTS,
  REG_STATUS_LABELS,
  REG_STATUS_VARIANTS,
  SHIFT_LABELS,
} from '@/lib/constants';
import { formatDate, formatDateTime } from '@/lib/format';
import type { EventStatus } from '@/types';

export default function AdminEventDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const {
    events,
    registrations,
    faculties,
    classes,
    fetchEvents,
    fetchRegistrations,
    updateEvent,
  } = useAppStore();
  const { toast } = useToast();

  const id = params?.id;
  const event = events.find((item) => item.id === id);

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: EventStatus;
  }>({
    open: false,
    title: '',
    description: '',
    action: 'open',
  });

  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    void fetchEvents();
    void fetchRegistrations();
  }, [fetchEvents, fetchRegistrations]);

  const eventRegistrations = useMemo(() => {
    return registrations.filter((r) => r.eventId === id);
  }, [registrations, id]);

  const eligibleFacultiesText = useMemo(() => {
    if (!event?.eligibleFacultyIds || event.eligibleFacultyIds.length === 0) return null;
    return event.eligibleFacultyIds
      .map((fId) => faculties.find((f) => f.id === fId)?.name || fId)
      .join(', ');
  }, [event, faculties]);

  const eligibleClassesText = useMemo(() => {
    if (!event?.eligibleClassIds || event.eligibleClassIds.length === 0) return null;
    return event.eligibleClassIds
      .map((cId) => classes.find((c) => c.id === cId)?.name || cId)
      .join(', ');
  }, [event, classes]);

  const eligibleYearsText = useMemo(() => {
    if (!event?.eligibleSchoolYears || event.eligibleSchoolYears.length === 0) return null;
    return event.eligibleSchoolYears.join(', ');
  }, [event]);

  const isAllStudents = !eligibleFacultiesText && !eligibleClassesText && !eligibleYearsText;

  async function handleUpdateStatus(newStatus: EventStatus) {
    if (!event) return;

    setUpdatingStatus(true);
    try {
      await updateEvent(event.id, { status: newStatus });
      await fetchEvents();
      setConfirmModal((prev) => ({ ...prev, open: false }));

      toast({
        title: 'Cập nhật trạng thái thành công',
        description: `Trạng thái sự kiện đã chuyển sang "${EVENT_STATUS_LABELS[newStatus]}".`,
      });
    } catch (error) {
      toast({
        title: 'Không thể cập nhật trạng thái',
        description:
          error instanceof Error
            ? error.message
            : 'Đã có lỗi xảy ra khi gọi API',
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatus(false);
    }
  }

  if (!event) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>

        <EmptyState
          icon={CalendarDays}
          title="Không tìm thấy sự kiện"
          description="Hãy tải lại trang hoặc kiểm tra ID sự kiện."
        />
      </div>
    );
  }

  const fillPercentage = event.maxCapacity > 0
    ? Math.min(100, Math.round((event.registeredCount / event.maxCapacity) * 100))
    : 0;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="mr-1 h-4 w-4" />
        Quay lại
      </Button>

      <PageHeader title={event.name} description={`Mã sự kiện: ${event.code}`}>
        <div className="flex flex-wrap gap-2">
          {event.status === 'pending' && (
            <>
              <Button
                variant="default"
                size="sm"
                className="bg-success text-success-foreground hover:bg-success/90"
                onClick={() =>
                  setConfirmModal({
                    open: true,
                    title: 'Duyệt sự kiện',
                    description: `Bạn có chắc muốn phê duyệt sự kiện "${event.name}"?`,
                    action: 'approved',
                  })
                }
              >
                <Check className="mr-1.5 h-4 w-4" /> Duyệt sự kiện
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() =>
                  setConfirmModal({
                    open: true,
                    title: 'Từ chối sự kiện',
                    description: `Từ chối duyệt sự kiện "${event.name}"?`,
                    action: 'rejected',
                  })
                }
              >
                <X className="mr-1.5 h-4 w-4" /> Từ chối
              </Button>
            </>
          )}

          {event.status === 'approved' && (
            <Button
              size="sm"
              onClick={() =>
                setConfirmModal({
                  open: true,
                  title: 'Mở đăng ký sự kiện',
                  description: `Cho phép sinh viên bắt đầu đăng ký sự kiện "${event.name}"?`,
                  action: 'open',
                })
              }
            >
              <PlayCircle className="mr-1.5 h-4 w-4" /> Mở đăng ký
            </Button>
          )}

          {['open', 'ongoing'].includes(event.status) && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="border-success text-success hover:bg-success/10"
                onClick={() =>
                  setConfirmModal({
                    open: true,
                    title: 'Hoàn thành sự kiện',
                    description: `Đánh dấu sự kiện "${event.name}" là đã hoàn thành?`,
                    action: 'completed',
                  })
                }
              >
                <CheckCircle2 className="mr-1.5 h-4 w-4" /> Hoàn thành
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="border-destructive text-destructive hover:bg-destructive/10"
                onClick={() =>
                  setConfirmModal({
                    open: true,
                    title: 'Hủy sự kiện',
                    description: `Bạn có chắc chắn muốn hủy sự kiện "${event.name}"? Hành động này sẽ hủy đăng ký của tất cả sinh viên.`,
                    action: 'cancelled',
                  })
                }
              >
                <Ban className="mr-1.5 h-4 w-4" /> Hủy sự kiện
              </Button>
            </>
          )}
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Main Info Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <CardTitle className="text-base font-bold">Thông tin sự kiện</CardTitle>
              <StatusBadge
                label={EVENT_STATUS_LABELS[event.status]}
                variant={EVENT_STATUS_VARIANTS[event.status]}
              />
            </CardHeader>

            <CardContent className="p-6 space-y-5">
              <Section title="Mô tả sự kiện" value={event.description} />
              <Section title="Nội dung công việc" value={event.workContent} />

              <div className="grid gap-4 sm:grid-cols-2 pt-2">
                <Section
                  title="Yêu cầu trang phục"
                  value={event.clothingRequirements || 'Không yêu cầu'}
                />
                <Section
                  title="Yêu cầu trang thiết bị"
                  value={event.equipmentRequirements || 'Không yêu cầu'}
                />
              </div>
            </CardContent>
          </Card>

          {/* Eligible Audience Card */}
          <Card>
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" /> Đối tượng được phép đăng ký
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-sm">
              {isAllStudents ? (
                <div className="rounded-lg bg-primary/5 p-4 border border-primary/10 text-primary font-medium">
                  🌐 Áp dụng cho toàn bộ sinh viên trong trường
                </div>
              ) : (
                <div className="space-y-3">
                  {eligibleFacultiesText && (
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-foreground shrink-0 w-28">Khoa áp dụng:</span>
                      <span className="text-muted-foreground">{eligibleFacultiesText}</span>
                    </div>
                  )}
                  {eligibleClassesText && (
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-foreground shrink-0 w-28">Lớp áp dụng:</span>
                      <span className="text-muted-foreground">{eligibleClassesText}</span>
                    </div>
                  )}
                  {eligibleYearsText && (
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-foreground shrink-0 w-28">Khoá học:</span>
                      <span className="text-muted-foreground">{eligibleYearsText}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Registered Students Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Danh sách sinh viên đăng ký ({eventRegistrations.length})
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0">
              {eventRegistrations.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Chưa có sinh viên nào đăng ký tham gia sự kiện này.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 text-xs font-semibold text-muted-foreground uppercase border-b">
                      <tr>
                        <th className="px-4 py-3">Mã SV</th>
                        <th className="px-4 py-3">Họ và tên</th>
                        <th className="px-4 py-3">Lớp</th>
                        <th className="px-4 py-3">Khoa</th>
                        <th className="px-4 py-3">Thời gian đăng ký</th>
                        <th className="px-4 py-3 text-right">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {eventRegistrations.map((reg) => (
                        <tr key={reg.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3 font-medium text-foreground">{reg.studentCode}</td>
                          <td className="px-4 py-3 font-semibold text-foreground">{reg.studentName}</td>
                          <td className="px-4 py-3 text-muted-foreground">{reg.className || '—'}</td>
                          <td className="px-4 py-3 text-muted-foreground truncate max-w-[150px]">{reg.facultyName || '—'}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {formatDateTime(reg.registeredAt)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <StatusBadge
                              label={REG_STATUS_LABELS[reg.status]}
                              variant={REG_STATUS_VARIANTS[reg.status]}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar column */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base font-bold">Chi tiết & Tiến độ</CardTitle>
            </CardHeader>

            <CardContent className="p-6 space-y-4 text-sm">
              <InfoRow
                icon={CalendarDays}
                label="Ngày diễn ra"
                value={formatDate(event.date)}
              />
              <InfoRow
                icon={Clock}
                label="Thời gian"
                value={`${event.startTime} - ${event.endTime} (${SHIFT_LABELS[event.shift]})`}
              />
              <InfoRow icon={MapPin} label="Địa điểm" value={event.location} />
              <InfoRow
                icon={User}
                label="Người tổ chức"
                value={event.organizerName}
              />
              <InfoRow
                icon={Phone}
                label="Liên hệ"
                value={event.contactPhone || '—'}
              />

              <Separator />

              {/* Progress indicator */}
              <div className="space-y-2 py-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">Tỉ lệ đăng ký</span>
                  <span className="text-primary">{event.registeredCount}/{event.maxCapacity} chỗ ({fillPercentage}%)</span>
                </div>
                <Progress value={fillPercentage} className="h-2" />
              </div>

              <InfoRow
                icon={Award}
                label="Ngày công tích lũy"
                value={`${event.workdayCredit} ngày`}
              />

              <Separator />

              <InfoRow
                icon={CalendarDays}
                label="Thời gian mở đăng ký"
                value={formatDateTime(event.registrationOpen)}
              />
              <InfoRow
                icon={CalendarDays}
                label="Thời gian đóng đăng ký"
                value={formatDateTime(event.registrationClose)}
              />
            </CardContent>
          </Card>

          {event.status === 'approved' && (
            <Card className="border-blue-200 bg-blue-50/60 dark:bg-blue-950/30 dark:border-blue-800">
              <CardContent className="p-4 text-sm text-blue-900 dark:text-blue-200 leading-relaxed">
                💡 Sự kiện đã được duyệt nhưng chưa mở đăng ký. Nhấn nút <strong>"Mở đăng ký"</strong> ở trên để cho phép sinh viên đăng ký.
              </CardContent>
            </Card>
          )}

          {event.status === 'pending' && (
            <Card className="border-amber-200 bg-amber-50/60 dark:bg-amber-950/30 dark:border-amber-800">
              <CardContent className="p-4 text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
                ⚠️ Sự kiện đang ở trạng thái <strong>Chờ duyệt</strong>. Hãy kiểm tra các thông tin và duyệt hoặc từ chối sự kiện này.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmModal.open}
        onOpenChange={(open) => setConfirmModal((prev) => ({ ...prev, open }))}
        title={confirmModal.title}
        description={confirmModal.description}
        confirmLabel={updatingStatus ? 'Đang xử lý...' : 'Xác nhận'}
        onConfirm={() => handleUpdateStatus(confirmModal.action)}
      />
    </div>
  );
}

function Section({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div>
      <h3 className="mb-1 text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {value || 'Chưa cập nhật'}
      </p>
    </div>
  );
}

function InfoRow({
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
