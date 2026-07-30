'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Search, Users } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, type Column } from '@/components/common/DataTable';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { getClassStudents } from '@/services/classLeaderApi';
import type { ClassLeaderStudent } from '@/types';

export default function ClassStudentsPage() {
  const { toast } = useToast();
  const [students, setStudents] = useState<ClassLeaderStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    getClassStudents()
      .then((data) => { if (active) setStudents(data); })
      .catch((error: unknown) => toast({
        title: 'Không thể tải danh sách sinh viên',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
        variant: 'destructive',
      }))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [toast]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return students;
    return students.filter((student) =>
      student.fullName.toLowerCase().includes(query) ||
      student.studentCode.toLowerCase().includes(query) ||
      student.email.toLowerCase().includes(query),
    );
  }, [search, students]);

  const columns: Column<ClassLeaderStudent>[] = [
    { key: 'studentCode', header: 'Mã sinh viên', sortable: true, sortValue: (student) => student.studentCode, render: (student) => <span className="font-mono text-xs">{student.studentCode}</span> },
    { key: 'fullName', header: 'Họ tên', sortable: true, sortValue: (student) => student.fullName, render: (student) => <div><p className="font-medium">{student.fullName}</p><p className="text-xs text-muted-foreground">{student.email}</p></div> },
    { key: 'phone', header: 'Điện thoại', render: (student) => student.phone || '—' },
    { key: 'workdays', header: 'Ngày công', sortable: true, sortValue: (student) => student.accumulatedWorkdays, render: (student) => {
      const percent = student.requiredWorkdays > 0 ? Math.min(100, Math.round(student.accumulatedWorkdays / student.requiredWorkdays * 100)) : 0;
      return <div className="min-w-48 space-y-1"><div className="flex justify-between text-xs"><span>{student.accumulatedWorkdays}/{student.requiredWorkdays}</span><span>{percent}%</span></div><Progress value={percent} className="h-2" /></div>;
    } },
    { key: 'status', header: 'Tiến độ', sortable: true, sortValue: (student) => student.missingWorkdays, render: (student) => <StatusBadge label={student.hasEnoughWorkdays ? 'Đã đủ' : `Thiếu ${student.missingWorkdays} ngày`} variant={student.hasEnoughWorkdays ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'} /> },
  ];

  return <div className="space-y-6">
    <PageHeader title="Sinh viên trong lớp" description="Chỉ xem dữ liệu của lớp được phân công; cán bộ lớp không thể sửa ngày công" />
    <Card><CardContent className="space-y-4 p-4">
      <div className="relative max-w-xl"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo mã, họ tên hoặc email..." className="pl-9" /></div>
      {loading ? <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : filtered.length === 0 ? <EmptyState icon={Users} title="Không có sinh viên phù hợp" /> : <DataTable columns={columns} data={filtered} rowKey={(student) => student.id} pageSize={12} />}
    </CardContent></Card>
  </div>;
}
