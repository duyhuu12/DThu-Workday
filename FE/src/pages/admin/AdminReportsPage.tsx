'use client';

import { useEffect, useMemo, useState } from 'react';
import { Award, CalendarDays, Download, Loader2, MessageSquareWarning, Users } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/common/DataTable';
import { EVENT_STATUS_LABELS } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import {
  exportAdminStudentReport,
  getAdminReportSummary,
  type AdminReportSummary,
} from '@/services/reportApi';

const PIE_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  '#f59e0b',
  'hsl(var(--success))',
  '#64748b',
  '#ef4444',
];

type TopStudent = AdminReportSummary['topStudents'][number];

export default function AdminReportsPage() {
  const { toast } = useToast();
  const [report, setReport] = useState<AdminReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let active = true;
    getAdminReportSummary()
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

  const byFaculty = useMemo(
    () =>
      (report?.byFaculty ?? []).map((item) => ({
        name: item.name.length > 25 ? `${item.name.slice(0, 25)}...` : item.name,
        sinhViên: item.students,
        đăngKý: item.registrations,
        ngàyCông: item.credits,
      })),
    [report],
  );

  const eventsByStatus = useMemo(
    () =>
      (report?.eventsByStatus ?? []).map((item) => ({
        name: EVENT_STATUS_LABELS[item.status as keyof typeof EVENT_STATUS_LABELS] ?? item.status,
        value: item.value,
      })),
    [report],
  );

  const columns: Column<TopStudent>[] = [
    {
      key: 'studentCode',
      header: 'Mã SV',
      sortable: true,
      sortValue: (student) => student.studentCode,
      render: (student) => <span className="font-mono text-xs">{student.studentCode}</span>,
    },
    {
      key: 'fullName',
      header: 'Họ tên',
      sortable: true,
      sortValue: (student) => student.fullName,
      render: (student) => <span className="font-medium">{student.fullName}</span>,
    },
    { key: 'faculty', header: 'Khoa', render: (student) => <span className="text-muted-foreground">{student.facultyName}</span> },
    {
      key: 'accumulated',
      header: 'Tích lũy',
      sortable: true,
      sortValue: (student) => student.accumulatedWorkdays,
      render: (student) => <span className="font-medium text-secondary">{student.accumulatedWorkdays}</span>,
    },
    { key: 'required', header: 'Yêu cầu', render: (student) => <span>{student.requiredWorkdays}</span> },
    {
      key: 'pct',
      header: 'Hoàn thành',
      sortable: true,
      sortValue: (student) => Math.round((student.accumulatedWorkdays / Math.max(student.requiredWorkdays, 1)) * 100),
      render: (student) => {
        const percentage = Math.round((student.accumulatedWorkdays / Math.max(student.requiredWorkdays, 1)) * 100);
        return <span className={percentage >= 100 ? 'font-medium text-success' : ''}>{percentage}%</span>;
      },
    },
  ];

  async function handleExport() {
    setExporting(true);
    try {
      await exportAdminStudentReport();
      toast({ title: 'Đã xuất báo cáo ngày công sinh viên' });
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

  const totals = report?.totals ?? { events: 0, students: 0, credits: 0, complaints: 0, completionRate: 0 };

  return (
    <div className="space-y-6">
      <PageHeader title="Báo cáo" description="Thống kê tổng quan hệ thống từ MySQL">
        <Button onClick={handleExport} disabled={exporting || loading}>
          {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Xuất CSV
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Tổng sự kiện" value={totals.events} icon={CalendarDays} iconClassName="bg-primary/10 text-primary" />
        <StatCard title="Tổng sinh viên" value={totals.students} icon={Users} iconClassName="bg-info/10 text-info" />
        <StatCard title="Tổng ngày công" value={totals.credits} suffix="ngày" icon={Award} iconClassName="bg-secondary/10 text-secondary" />
        <StatCard title="Khiếu nại" value={totals.complaints} icon={MessageSquareWarning} iconClassName="bg-warning/10 text-warning" />
      </div>

      {loading ? (
        <Card><CardContent className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></CardContent></Card>
      ) : (
        <>
          <Card>
            <CardHeader><CardTitle className="text-base">Thống kê theo khoa</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={byFaculty} margin={{ top: 5, right: 10, left: -20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={70} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 13 }} />
                  <Bar dataKey="sinhViên" name="Sinh viên" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="đăngKý" name="Đăng ký" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Sự kiện theo trạng thái</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={eventsByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(entry) => entry.name}>
                      {eventsByStatus.map((_, index) => <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 13 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Top sinh viên ngày công</CardTitle></CardHeader>
              <CardContent><DataTable columns={columns} data={report?.topStudents ?? []} rowKey={(student) => student.id} pageSize={5} /></CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
