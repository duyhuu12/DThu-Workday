'use client';

import { useEffect, useMemo, useState } from 'react';
import { Award, Download, Loader2, Users } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { DataTable, type Column } from '@/components/common/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useToast } from '@/hooks/use-toast';
import { exportClassWorkCredits, getClassStudents } from '@/services/classLeaderApi';
import type { ClassLeaderStudent } from '@/types';

export default function ClassReportsPage() {
  const { toast } = useToast();
  const [students, setStudents] = useState<ClassLeaderStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let active = true;
    getClassStudents()
      .then((data) => { if (active) setStudents(data); })
      .catch((error: unknown) => toast({
        title: 'Không thể tải báo cáo lớp',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
        variant: 'destructive',
      }))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [toast]);

  const summary = useMemo(() => ({
    total: students.length,
    sufficient: students.filter((student) => student.hasEnoughWorkdays).length,
    insufficient: students.filter((student) => !student.hasEnoughWorkdays).length,
    credits: students.reduce((sum, student) => sum + student.accumulatedWorkdays, 0),
  }), [students]);

  async function handleExport() {
    setExporting(true);
    try {
      await exportClassWorkCredits();
      toast({ title: 'Đã xuất danh sách ngày công của lớp' });
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

  const columns: Column<ClassLeaderStudent>[] = [
    { key: 'studentCode', header: 'Mã SV', sortable: true, sortValue: (student) => student.studentCode },
    { key: 'fullName', header: 'Họ tên', sortable: true, sortValue: (student) => student.fullName, render: (student) => <span className="font-medium">{student.fullName}</span> },
    { key: 'accumulated', header: 'Đã tích lũy', sortable: true, sortValue: (student) => student.accumulatedWorkdays, render: (student) => `${student.accumulatedWorkdays} ngày` },
    { key: 'required', header: 'Yêu cầu', render: (student) => `${student.requiredWorkdays} ngày` },
    { key: 'progress', header: 'Tiến độ', render: (student) => {
      const percent = student.requiredWorkdays > 0 ? Math.min(100, Math.round(student.accumulatedWorkdays / student.requiredWorkdays * 100)) : 0;
      return <div className="min-w-44 space-y-1"><Progress value={percent} className="h-2" /><p className="text-xs text-muted-foreground">{percent}%</p></div>;
    } },
    { key: 'status', header: 'Trạng thái', render: (student) => <StatusBadge label={student.hasEnoughWorkdays ? 'Đã đủ' : `Thiếu ${student.missingWorkdays}`} variant={student.hasEnoughWorkdays ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'} /> },
  ];

  return <div className="space-y-6">
    <PageHeader title="Báo cáo ngày công lớp" description="Dữ liệu chỉ đọc từ MySQL; cán bộ lớp không có quyền sửa ngày công">
      <Button onClick={handleExport} disabled={loading || exporting}>{exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}Xuất CSV</Button>
    </PageHeader>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard title="Tổng sinh viên" value={summary.total} icon={Users} />
      <StatCard title="Đã đủ ngày công" value={summary.sufficient} icon={Award} iconClassName="bg-emerald-100 text-emerald-700" />
      <StatCard title="Chưa đủ ngày công" value={summary.insufficient} icon={Award} iconClassName="bg-amber-100 text-amber-700" />
      <StatCard title="Tổng ngày công lớp" value={summary.credits} suffix="ngày" icon={Award} iconClassName="bg-blue-100 text-blue-700" />
    </div>
    <Card><CardContent className="p-4">{loading ? <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : <DataTable columns={columns} data={students} rowKey={(student) => student.id} pageSize={15} />}</CardContent></Card>
  </div>;
}
