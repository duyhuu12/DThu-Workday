'use client';

import { useEffect, useMemo, useState } from 'react';
import { Award, BarChart3, CalendarDays, Download, Loader2, Users } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  exportOrganizerEventReport,
  getOrganizerReportSummary,
  type OrganizerReportSummary,
} from '@/services/reportApi';

export default function OrganizerReportsPage() {
  const { toast } = useToast();
  const [report, setReport] = useState<OrganizerReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let active = true;
    getOrganizerReportSummary()
      .then((data) => {
        if (active) setReport(data);
      })
      .catch((error: unknown) => {
        toast({
          title: 'Không thể tải báo cáo',
          description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
          variant: 'destructive',
        });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [toast]);

  const byEvent = useMemo(
    () =>
      (report?.byEvent ?? []).map((event) => ({
        name: event.name.length > 20 ? `${event.name.slice(0, 20)}...` : event.name,
        đăngKý: event.registrations,
        cóMặt: event.present,
        ngàyCông: event.credits,
      })),
    [report],
  );

  const byMonth = useMemo(() => {
    const map: Record<string, { events: number; registrations: number }> = {};
    for (const event of report?.byEvent ?? []) {
      const month = event.date.slice(0, 7);
      map[month] ??= { events: 0, registrations: 0 };
      map[month].events += 1;
      map[month].registrations += event.registrations;
    }
    return Object.entries(map)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([month, values]) => ({
        month: month.replace('-', '/'),
        sựKiện: values.events,
        đăngKý: values.registrations,
      }));
  }, [report]);

  async function handleExport() {
    setExporting(true);
    try {
      await exportOrganizerEventReport();
      toast({ title: 'Đã xuất báo cáo sự kiện' });
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

  const totals = report?.totals ?? { events: 0, registrations: 0, completedEvents: 0, credits: 0 };

  return (
    <div className="space-y-6">
      <PageHeader title="Báo cáo" description="Thống kê sự kiện và ngày công từ MySQL">
        <Button onClick={handleExport} disabled={loading || exporting}>
          {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Xuất CSV
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Tổng sự kiện" value={totals.events} icon={CalendarDays} iconClassName="bg-primary/10 text-primary" />
        <StatCard title="Tổng đăng ký" value={totals.registrations} icon={Users} iconClassName="bg-info/10 text-info" />
        <StatCard title="Tổng ngày công" value={totals.credits} suffix="ngày" icon={Award} iconClassName="bg-secondary/10 text-secondary" />
        <StatCard title="Sự kiện hoàn thành" value={totals.completedEvents} icon={BarChart3} iconClassName="bg-success/10 text-success" />
      </div>

      {loading ? (
        <Card><CardContent className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></CardContent></Card>
      ) : (
        <>
          <Card>
            <CardHeader><CardTitle className="text-base">Thống kê theo sự kiện</CardTitle></CardHeader>
            <CardContent>
              {byEvent.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Chưa có dữ liệu</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={byEvent} margin={{ top: 5, right: 10, left: -20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={70} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 13 }} />
                    <Bar dataKey="đăngKý" name="Đăng ký" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="cóMặt" name="Có mặt" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Xu hướng theo tháng</CardTitle></CardHeader>
            <CardContent>
              {byMonth.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Chưa có dữ liệu</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={byMonth} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 13 }} />
                    <Line type="monotone" dataKey="sựKiện" name="Sự kiện" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Line type="monotone" dataKey="đăngKý" name="Đăng ký" stroke="hsl(var(--secondary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
