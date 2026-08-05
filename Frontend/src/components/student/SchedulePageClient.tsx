'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  addWeeks,
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  parseISO,
  startOfWeek,
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin, Printer } from 'lucide-react';
import { useAppStore, useCurrentStudent } from '@/hooks/useAppStore';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { REG_STATUS_LABELS, REG_STATUS_VARIANTS, SHIFT_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Registration, WorkEvent, WorkShift } from '@/types';

type ScheduleItem = {
  reg: Registration;
  event: WorkEvent;
  date: string;
  startTime: string;
  endTime: string;
  shift: WorkShift;
};

const PERIODS: Array<{ key: 'morning' | 'afternoon' | 'evening'; label: string; time: string }> = [
  { key: 'morning', label: 'Sáng', time: '06:00 – 11:59' },
  { key: 'afternoon', label: 'Chiều', time: '12:00 – 17:59' },
  { key: 'evening', label: 'Tối', time: '18:00 – 22:00' },
];

function getPeriod(shift: WorkShift, startTime: string): 'morning' | 'afternoon' | 'evening' {
  if (shift === 'morning') return 'morning';
  if (shift === 'afternoon') return 'afternoon';
  if (shift === 'evening') return 'evening';
  const hour = Number(startTime.split(':')[0]);
  if (hour >= 18) return 'evening';
  if (hour >= 12) return 'afternoon';
  return 'morning';
}

export default function SchedulePageClient() {
  const { registrations, events, fetchRegistrations, fetchEvents, fetchCurrentStudent } = useAppStore();
  const student = useCurrentStudent();
  const [cursor, setCursor] = useState(new Date());

  useEffect(() => {
    void Promise.all([fetchCurrentStudent(), fetchRegistrations(), fetchEvents()]);
  }, [fetchCurrentStudent, fetchRegistrations, fetchEvents]);

  const weekStart = startOfWeek(cursor, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(cursor, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const items = useMemo<ScheduleItem[]>(() => registrations
    .filter((registration) => registration.studentId === student?.id && !['cancelled', 'absent'].includes(registration.status))
    .map((registration) => {
      const event = events.find((item) => item.id === registration.eventId);
      if (!event) return null;
      return {
        reg: registration,
        event,
        date: registration.selectedDate || event.date,
        startTime: registration.selectedStartTime || event.startTime,
        endTime: registration.selectedEndTime || event.endTime,
        shift: registration.selectedShift || event.shift,
      };
    })
    .filter((item): item is ScheduleItem => Boolean(item)), [registrations, events, student]);

  const cells = useMemo(() => {
    const result = new Map<string, ScheduleItem[]>();
    for (const item of items) {
      const key = `${item.date}-${getPeriod(item.shift, item.startTime)}`;
      const current = result.get(key) ?? [];
      current.push(item);
      current.sort((left, right) => left.startTime.localeCompare(right.startTime));
      result.set(key, current);
    }
    return result;
  }, [items]);

  function selectDate(value: string) {
    if (value) setCursor(parseISO(value));
  }

  return (
    <div className="space-y-5 print:space-y-3">
      <PageHeader title="Lịch làm việc" description="Theo dõi sự kiện ngày công theo từng ca trong tuần" />

      <section className="overflow-hidden rounded-xl border bg-card shadow-sm print:border-0 print:shadow-none">
        <div className="flex flex-col gap-3 border-b px-4 py-3 lg:flex-row lg:items-center lg:justify-between print:px-0">
          <div>
            <h2 className="text-base font-semibold">Lịch sự kiện theo tuần</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {format(weekStart, 'dd/MM/yyyy')} – {format(weekEnd, 'dd/MM/yyyy')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <Input
              type="date"
              aria-label="Chọn ngày trong tuần"
              value={format(cursor, 'yyyy-MM-dd')}
              onChange={(event) => selectDate(event.target.value)}
              className="h-9 w-[155px]"
            />
            <Button size="sm" variant="outline" className="h-9" onClick={() => setCursor(new Date())}>
              <CalendarDays className="mr-1.5 h-4 w-4" /> Hiện tại
            </Button>
            <Button size="sm" variant="outline" className="h-9" onClick={() => window.print()}>
              <Printer className="mr-1.5 h-4 w-4" /> In lịch
            </Button>
            <div className="flex overflow-hidden rounded-md border">
              <Button size="sm" variant="ghost" className="h-9 rounded-none border-r px-3" onClick={() => setCursor((date) => addWeeks(date, -1))}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Trở về
              </Button>
              <Button size="sm" variant="ghost" className="h-9 rounded-none px-3" onClick={() => setCursor((date) => addWeeks(date, 1))}>
                Tiếp <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[980px]">
            <div className="grid grid-cols-[92px_repeat(7,minmax(126px,1fr))] border-b bg-muted/30">
              <div className="flex items-center justify-center border-r px-2 py-3 text-xs font-semibold text-muted-foreground">Ca làm việc</div>
              {days.map((day, index) => {
                const today = isSameDay(day, new Date());
                return (
                  <div key={day.toISOString()} className={cn('border-r px-2 py-2.5 text-center last:border-r-0', today && 'bg-primary/10')}>
                    <p className={cn('text-xs font-semibold uppercase', today ? 'text-primary' : 'text-muted-foreground')}>
                      {index === 6 ? 'Chủ nhật' : `Thứ ${index + 2}`}
                    </p>
                    <p className={cn('mt-0.5 text-sm font-bold', today && 'text-primary')}>{format(day, 'dd/MM/yyyy')}</p>
                  </div>
                );
              })}
            </div>

            {PERIODS.map((period) => (
              <div key={period.key} className="grid grid-cols-[92px_repeat(7,minmax(126px,1fr))] border-b last:border-b-0">
                <div className="flex min-h-[154px] flex-col items-center justify-center border-r bg-amber-50 px-2 text-center dark:bg-amber-950/20">
                  <span className="text-sm font-semibold text-foreground">{period.label}</span>
                  <span className="mt-1 text-[10px] text-muted-foreground">{period.time}</span>
                </div>
                {days.map((day) => {
                  const date = format(day, 'yyyy-MM-dd');
                  const dateItems = cells.get(`${date}-${period.key}`) ?? [];
                  const today = isSameDay(day, new Date());
                  return (
                    <div key={`${date}-${period.key}`} className={cn('min-h-[154px] space-y-2 border-r p-2 last:border-r-0', today && 'bg-primary/[0.025]')}>
                      {dateItems.map(({ reg, event, startTime, endTime, shift }) => (
                        <Link key={reg.id} href={`/student/work-events/${event.id}`} className="block rounded-lg border border-primary/20 bg-primary/[0.07] p-2.5 transition-colors hover:border-primary/40 hover:bg-primary/10">
                          <div className="mb-1.5 flex items-start justify-between gap-2">
                            <p className="line-clamp-2 text-xs font-semibold leading-4 text-foreground">{event.name}</p>
                            <StatusBadge label={REG_STATUS_LABELS[reg.status]} variant={REG_STATUS_VARIANTS[reg.status]} />
                          </div>
                          <div className="space-y-1 text-[11px] text-muted-foreground">
                            <p className="flex items-center gap-1"><Clock className="h-3 w-3 shrink-0" />{startTime} – {endTime} · {SHIFT_LABELS[shift]}</p>
                            <p className="flex items-center gap-1"><MapPin className="h-3 w-3 shrink-0" /><span className="truncate">{event.location}</span></p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground print:hidden">
          <span className="font-medium text-foreground">Chú thích:</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-primary/20 ring-1 ring-primary/30" /> Sự kiện đã đăng ký</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-primary/10" /> Ngày hiện tại</span>
          <span>{items.filter((item) => item.date >= format(weekStart, 'yyyy-MM-dd') && item.date <= format(weekEnd, 'yyyy-MM-dd')).length} sự kiện trong tuần</span>
        </div>
      </section>
    </div>
  );
}
