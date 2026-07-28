'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import { useAppStore, useCurrentStudent } from '@/hooks/useAppStore';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { REG_STATUS_LABELS, REG_STATUS_VARIANTS, SHIFT_LABELS } from '@/lib/constants';
import type { Registration, WorkEvent } from '@/types';

type ViewMode = 'month' | 'week';
type ScheduleItem = { reg: Registration; event: WorkEvent; date: string; startTime: string; endTime: string };

export default function SchedulePageClient() {
  const { registrations, events, fetchRegistrations, fetchEvents, fetchCurrentStudent } = useAppStore();
  const student = useCurrentStudent();
  const [mode, setMode] = useState<ViewMode>('month');
  const [cursor, setCursor] = useState(new Date());

  useEffect(() => {
    void Promise.all([fetchCurrentStudent(), fetchRegistrations(), fetchEvents()]);
  }, [fetchCurrentStudent, fetchRegistrations, fetchEvents]);

  const items = useMemo<ScheduleItem[]>(() => {
    return registrations
      .filter(
        (registration) =>
          registration.studentId === student?.id &&
          !['cancelled', 'absent'].includes(registration.status),
      )
      .map((registration) => {
        const event = events.find((item) => item.id === registration.eventId);
        if (!event) return null;
        return {
          reg: registration,
          event,
          date: registration.selectedDate || event.date,
          startTime: registration.selectedStartTime || event.startTime,
          endTime: registration.selectedEndTime || event.endTime,
        };
      })
      .filter((item): item is ScheduleItem => Boolean(item));
  }, [registrations, events, student]);

  const dayEvents = useMemo(() => {
    const map: Record<string, ScheduleItem[]> = {};
    for (const item of items) {
      (map[item.date] ??= []).push(item);
    }
    return map;
  }, [items]);

  const periodStart = mode === 'month'
    ? startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 })
    : startOfWeek(cursor, { weekStartsOn: 1 });
  const periodEnd = mode === 'month'
    ? endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 })
    : endOfWeek(cursor, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: periodStart, end: periodEnd });

  const upcoming = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return items
      .filter((item) => item.date >= today)
      .sort((left, right) => `${left.date}${left.startTime}`.localeCompare(`${right.date}${right.startTime}`))
      .slice(0, 5);
  }, [items]);

  return (
    <div className="space-y-6">
      <PageHeader title="Lịch của tôi" description="Lịch sự kiện ngày công đã đăng ký">
        <div className="flex rounded-lg border p-0.5">
          <Button size="sm" variant={mode === 'month' ? 'default' : 'ghost'} className="h-8 rounded-md" onClick={() => setMode('month')}>Tháng</Button>
          <Button size="sm" variant={mode === 'week' ? 'default' : 'ghost'} className="h-8 rounded-md" onClick={() => setMode('week')}>Tuần</Button>
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => setCursor((date) => addDays(date, mode === 'month' ? -30 : -7))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="font-semibold capitalize">
                {mode === 'month'
                  ? format(cursor, 'MMMM yyyy', { locale: vi })
                  : `Tuần ${format(periodStart, 'dd/MM')} - ${format(periodEnd, 'dd/MM/yyyy')}`}
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setCursor((date) => addDays(date, mode === 'month' ? 30 : 7))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
              {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => <div key={day} className="py-2">{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((day) => {
                const date = format(day, 'yyyy-MM-dd');
                const dateItems = dayEvents[date] ?? [];
                const inMonth = mode === 'week' || isSameMonth(day, cursor);
                const today = isSameDay(day, new Date());
                return (
                  <div
                    key={date}
                    className={`min-h-[70px] rounded-lg border p-1.5 text-xs transition-colors sm:min-h-[90px] ${
                      inMonth ? 'bg-card' : 'bg-muted/30 text-muted-foreground'
                    } ${today ? 'border-primary ring-1 ring-primary/30' : 'border-border'}`}
                  >
                    <div className={`mb-1 text-right font-medium ${today ? 'text-primary' : ''}`}>{format(day, 'd')}</div>
                    <div className="space-y-1">
                      {dateItems.slice(0, 2).map(({ reg, event }) => (
                        <div key={reg.id} className="truncate rounded bg-primary/10 px-1 py-0.5 text-[10px] font-medium text-primary" title={event.name}>
                          {event.name}
                        </div>
                      ))}
                      {dateItems.length > 2 && <div className="text-[10px] text-muted-foreground">+{dateItems.length - 2} nữa</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <h3 className="mb-3 font-semibold">Sắp tới</h3>
              {upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">Không có sự kiện sắp tới</p>
              ) : (
                <div className="space-y-3">
                  {upcoming.map(({ reg, event, date, startTime, endTime }) => (
                    <div key={reg.id} className="rounded-lg border p-3">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-foreground">{event.name}</span>
                        <StatusBadge label={REG_STATUS_LABELS[reg.status]} variant={REG_STATUS_VARIANTS[reg.status]} />
                      </div>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> {format(parseISO(date), 'EEEE, dd/MM/yyyy', { locale: vi })}</p>
                        <p className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {startTime} - {endTime} ({SHIFT_LABELS[reg.selectedShift || event.shift]})</p>
                        <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {event.location}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h3 className="mb-2 font-semibold">Chú thích</h3>
              <div className="flex items-center gap-2 text-sm"><div className="h-3 w-3 rounded bg-primary/20" /><span className="text-muted-foreground">Có sự kiện</span></div>
              <div className="mt-1 flex items-center gap-2 text-sm"><div className="h-3 w-3 rounded border-2 border-primary" /><span className="text-muted-foreground">Hôm nay</span></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
