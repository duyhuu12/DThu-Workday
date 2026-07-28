'use client';

import { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { useAppStore } from '@/hooks/useAppStore';
import { apiRequest } from '@/services/api';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  EVENT_STATUS_LABELS,
  EVENT_STATUS_VARIANTS,
  SHIFT_LABELS,
} from '@/lib/constants';
import { formatDate, formatDateTime } from '@/lib/format';
import type { WorkEvent } from '@/types';

export default function AdminEventDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { events, fetchEvents } = useAppStore();
  const { toast } = useToast();

  const id = params?.id;
  const event = events.find((item) => item.id === id);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  async function handleOpenRegistration() {
    if (!event) return;

    setOpening(true);
    try {
      await apiRequest<WorkEvent>(
        `/events/${event.id}/open-registration`,
        { method: 'PATCH' },
      );

      await fetchEvents();
      setConfirmOpen(false);

      toast({
        title: 'Đã mở đăng ký',
        description: 'Sinh viên đủ điều kiện có thể đăng ký sự kiện.',
      });
    } catch (error) {
      toast({
        title: 'Không thể mở đăng ký',
        description:
          error instanceof Error
            ? error.message
            : 'Máy chủ không thể xử lý yêu cầu',
        variant: 'destructive',
      });
    } finally {
      setOpening(false);
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

  const canOpen = event.status === 'approved';

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="mr-1 h-4 w-4" />
        Quay lại
      </Button>

      <PageHeader
        title={event.name}
        description={`Mã: ${event.code}`}
      >
        {canOpen && (
          <Button onClick={() => setConfirmOpen(true)}>
            <PlayCircle className="mr-2 h-4 w-4" />
            Mở đăng ký
          </Button>
        )}
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-base">Thông tin sự kiện</CardTitle>
              <StatusBadge
                label={EVENT_STATUS_LABELS[event.status]}
                variant={EVENT_STATUS_VARIANTS[event.status]}
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <Section title="Mô tả" value={event.description} />
            <Section title="Nội dung công việc" value={event.workContent} />

            <div className="grid gap-4 sm:grid-cols-2">
              <Section
                title="Trang phục"
                value={event.clothingRequirements || 'Không yêu cầu'}
              />
              <Section
                title="Thiết bị"
                value={event.equipmentRequirements || 'Không yêu cầu'}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Chi tiết</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 text-sm">
            <InfoRow
              icon={CalendarDays}
              label="Ngày"
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
              value={event.contactPhone}
            />

            <Separator />

            <InfoRow
              icon={Users}
              label="Đăng ký"
              value={`${event.registeredCount}/${event.maxCapacity}`}
            />
            <InfoRow
              icon={Award}
              label="Ngày công"
              value={`${event.workdayCredit} ngày`}
            />

            <Separator />

            <InfoRow
              icon={CalendarDays}
              label="Mở đăng ký"
              value={formatDateTime(event.registrationOpen)}
            />
            <InfoRow
              icon={CalendarDays}
              label="Đóng đăng ký"
              value={formatDateTime(event.registrationClose)}
            />
          </CardContent>
        </Card>
      </div>

      {event.status === 'approved' && (
        <Card className="border-blue-200 bg-blue-50/60">
          <CardContent className="p-4 text-sm text-blue-900">
            Sự kiện đã được duyệt nhưng chưa mở đăng ký. Nhấn
            <strong> Mở đăng ký </strong>
            để chuyển trạng thái sang
            <strong> Đang đăng ký</strong>.
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Mở đăng ký sự kiện"
        description={`Cho phép sinh viên đăng ký sự kiện "${event.name}" ngay bây giờ?`}
        confirmLabel={opening ? 'Đang mở...' : 'Mở đăng ký'}
        onConfirm={handleOpenRegistration}
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
      <h3 className="mb-1 font-semibold">{title}</h3>
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
