'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Award, CalendarDays, Clock, History, MapPin, MessageSquareWarning, Search } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getStudentParticipationHistory } from '@/services/studentApi';
import type { StudentParticipationHistory } from '@/types';
import {
  ATT_STATUS_LABELS,
  ATT_STATUS_VARIANTS,
  REG_STATUS_LABELS,
  REG_STATUS_VARIANTS,
  SHIFT_LABELS,
} from '@/lib/constants';
import { formatDate, formatDateTime } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';

export default function ParticipationHistoryPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<StudentParticipationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getStudentParticipationHistory()
      .then(setItems)
      .catch((error) => {
        toast({
          title: 'Không thể tải lịch sử tham gia',
          description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
          variant: 'destructive',
        });
      })
      .finally(() => setLoading(false));
  }, [toast]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) =>
      [item.eventName, item.eventCode, item.location]
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [items, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lịch sử tham gia"
        description="Toàn bộ đăng ký, điểm danh và ngày công của bạn"
      />

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Tìm theo tên, mã hoặc địa điểm..."
          className="pl-9"
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Đang tải lịch sử...</p>
      ) : filtered.length === 0 ? (
        <EmptyState icon={History} title="Chưa có lịch sử tham gia" />
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <Card key={item.id}>
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <Link
                      href={`/student/work-events/${item.eventId}`}
                      className="font-semibold text-primary hover:underline"
                    >
                      {item.eventName}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {item.eventCode} · Đăng ký {formatDateTime(item.registeredAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge
                      label={REG_STATUS_LABELS[item.registrationStatus]}
                      variant={REG_STATUS_VARIANTS[item.registrationStatus]}
                    />
                    <StatusBadge
                      label={ATT_STATUS_LABELS[item.attendanceStatus]}
                      variant={ATT_STATUS_VARIANTS[item.attendanceStatus]}
                    />
                  </div>
                </div>

                <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                  <span className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    {formatDate(item.selectedDate)}
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {item.selectedStartTime} - {item.selectedEndTime} ({SHIFT_LABELS[item.selectedShift]})
                  </span>
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {item.location}
                  </span>
                  <span className="flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    {item.creditValue !== undefined ? `${item.creditValue} ngày công` : 'Chưa ghi nhận'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
                  <span>
                    Check-in: {item.checkInTime || '—'} · Check-out: {item.checkOutTime || '—'}
                  </span>
                  {['absent', 'not_checked'].includes(item.attendanceStatus) && (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/student/complaints?eventId=${item.eventId}&type=attendance`}>
                        <MessageSquareWarning className="mr-2 h-4 w-4" />
                        Khiếu nại
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
