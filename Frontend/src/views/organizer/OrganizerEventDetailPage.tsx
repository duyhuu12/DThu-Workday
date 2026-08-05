'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Award,
  BarChart3,
  CalendarDays,
  Clock,
  ClipboardList,
  MapPin,
  PackageCheck,
  Pencil,
  Phone,
  Search,
  Shirt,
  UserCheck,
  UserRound,
  Users,
} from 'lucide-react';
import { useAppStore } from '@/hooks/useAppStore';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { EVENT_STATUS_LABELS, EVENT_STATUS_VARIANTS, REG_STATUS_LABELS, REG_STATUS_VARIANTS, SHIFT_LABELS } from '@/lib/constants';
import { formatDate, formatDateTime } from '@/lib/format';

export default function OrganizerEventDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { events, registrations, fetchEvents, fetchRegistrations } = useAppStore();
  const [search, setSearch] = useState('');
  const event = events.find((item) => item.id === id);

  const eventRegs = useMemo(
    () => registrations.filter((registration) => registration.eventId === id && registration.status !== 'cancelled'),
    [registrations, id],
  );
  const filteredRegs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return eventRegs;
    return eventRegs.filter((registration) =>
      registration.studentName.toLowerCase().includes(query)
      || registration.studentCode.toLowerCase().includes(query)
      || registration.className.toLowerCase().includes(query),
    );
  }, [eventRegs, search]);

  useEffect(() => {
    void Promise.all([fetchEvents(), fetchRegistrations()]);
  }, [fetchEvents, fetchRegistrations]);

  if (!event) {
    return <div className="space-y-6"><Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" /> Quay lại</Button><EmptyState icon={CalendarDays} title="Không tìm thấy sự kiện" /></div>;
  }

  const percentage = event.maxCapacity > 0 ? Math.min(100, Math.round((eventRegs.length / event.maxCapacity) * 100)) : 0;

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => router.back()}><ArrowLeft className="mr-1.5 h-4 w-4" /> Quay lại danh sách</Button>
      <PageHeader title={event.name} description={`Mã sự kiện: ${event.code}`}>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm"><Link href={`/organizer/events/${event.id}/edit`}><Pencil className="mr-1.5 h-4 w-4" /> Chỉnh sửa</Link></Button>
          <Button asChild variant="outline" size="sm"><Link href={`/organizer/events/${event.id}/attendance`}><UserCheck className="mr-1.5 h-4 w-4" /> Điểm danh</Link></Button>
          <Button asChild size="sm"><Link href={`/organizer/events/${event.id}/results`}><BarChart3 className="mr-1.5 h-4 w-4" /> Kết quả</Link></Button>
        </div>
      </PageHeader>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="space-y-4 border-b pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base"><Users className="h-5 w-5 text-primary" /> Danh sách sinh viên</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">{eventRegs.length} sinh viên đăng ký · Sức chứa {event.maxCapacity}</p>
              </div>
              <div className="w-full sm:w-48">
                <div className="mb-1.5 flex justify-between text-[11px] text-muted-foreground"><span>Mức đăng ký</span><span>{percentage}%</span></div>
                <Progress value={percentage} className="h-2" />
              </div>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(input) => setSearch(input.target.value)} placeholder="Tìm theo tên, mã sinh viên hoặc lớp..." className="pl-9" />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filteredRegs.length === 0 ? (
              <div className="p-6"><EmptyState icon={ClipboardList} title={eventRegs.length === 0 ? 'Chưa có sinh viên đăng ký' : 'Không tìm thấy sinh viên phù hợp'} /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[780px] text-sm">
                  <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Sinh viên</th>
                      <th className="px-4 py-3 font-medium">Lớp</th>
                      <th className="px-4 py-3 font-medium">Lịch tham gia</th>
                      <th className="px-4 py-3 font-medium">Đăng ký lúc</th>
                      <th className="px-4 py-3 text-right font-medium">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredRegs.map((registration) => {
                      const selectedDate = registration.selectedDate || event.date;
                      const selectedStart = registration.selectedStartTime || event.startTime;
                      const selectedEnd = registration.selectedEndTime || event.endTime;
                      const selectedShift = registration.selectedShift || event.shift;
                      return (
                        <tr key={registration.id} className="transition-colors hover:bg-muted/25">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><UserRound className="h-4 w-4" /></span>
                              <div><p className="font-medium text-foreground">{registration.studentName}</p><p className="text-xs text-muted-foreground">{registration.studentCode}</p></div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5"><p className="font-medium">{registration.className || '—'}</p><p className="text-xs text-muted-foreground">{registration.facultyName || 'Chưa có khoa'}</p></td>
                          <td className="px-4 py-3.5"><p className="font-medium">{formatDate(selectedDate)}</p><p className="mt-0.5 text-xs text-muted-foreground">{selectedStart} – {selectedEnd} · {SHIFT_LABELS[selectedShift]}</p></td>
                          <td className="px-4 py-3.5 text-xs text-muted-foreground">{formatDateTime(registration.registeredAt)}</td>
                          <td className="px-4 py-3.5 text-right"><StatusBadge label={REG_STATUS_LABELS[registration.status]} variant={REG_STATUS_VARIANTS[registration.status]} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <aside className="space-y-4 xl:sticky xl:top-20">
          <Card>
            <CardHeader className="border-b pb-4">
              <div className="flex items-center justify-between gap-3"><CardTitle className="text-base">Thông tin sự kiện</CardTitle><StatusBadge label={EVENT_STATUS_LABELS[event.status]} variant={EVENT_STATUS_VARIANTS[event.status]} /></div>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <InfoBlock title="Mô tả" value={event.description} />
              <InfoBlock title="Nội dung công việc" value={event.workContent} />
              <Separator />
              <div className="space-y-3">
                <InfoRow icon={CalendarDays} label="Ngày tổ chức" value={formatDate(event.date)} />
                <InfoRow icon={Clock} label="Thời gian" value={`${event.startTime} – ${event.endTime} · ${SHIFT_LABELS[event.shift]}`} />
                <InfoRow icon={MapPin} label="Địa điểm" value={event.location} />
                <InfoRow icon={Award} label="Ngày công" value={`${event.workdayCredit} ngày`} />
                <InfoRow icon={Users} label="Đã đăng ký" value={`${eventRegs.length}/${event.maxCapacity} sinh viên`} />
                <InfoRow icon={CalendarDays} label="Hạn đăng ký" value={formatDateTime(event.registrationClose)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b pb-4"><CardTitle className="text-base">Yêu cầu và liên hệ</CardTitle></CardHeader>
            <CardContent className="space-y-4 p-5">
              <InfoRow icon={Shirt} label="Trang phục" value={event.clothingRequirements || 'Không có yêu cầu'} />
              <InfoRow icon={PackageCheck} label="Thiết bị cần mang" value={event.equipmentRequirements || 'Không có yêu cầu'} />
              <Separator />
              <InfoRow icon={UserRound} label="Người phụ trách" value={event.contactPerson || event.organizerName} />
              <InfoRow icon={Phone} label="Số điện thoại" value={event.contactPhone || 'Chưa cập nhật'} />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function InfoBlock({ title, value }: { title: string; value: string }) {
  return <div><h3 className="mb-1.5 text-sm font-semibold text-foreground">{title}</h3><p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">{value || 'Chưa cập nhật'}</p></div>;
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return <div className="flex items-start gap-3"><span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Icon className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-0.5 break-words text-sm font-medium text-foreground">{value}</p></div></div>;
}
