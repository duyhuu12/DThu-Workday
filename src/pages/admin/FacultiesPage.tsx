'use client';
import { Building2 } from 'lucide-react';
import { useAppStore } from '@/hooks/useAppStore';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, type Column } from '@/components/common/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import type { Faculty } from '@/types';

export default function FacultiesPage() {
  const { faculties, classes, students } = useAppStore();
  const columns: Column<Faculty>[] = [
    { key: 'code', header: 'Mã', sortable: true, sortValue: (f) => f.code, render: (f) => <span className="font-mono text-xs">{f.code}</span> },
    { key: 'name', header: 'Tên khoa', sortable: true, sortValue: (f) => f.name, render: (f) => <span className="font-medium">{f.name}</span> },
    { key: 'classes', header: 'Số lớp', sortable: true, sortValue: (f) => classes.filter((c) => c.facultyId === f.id).length, render: (f) => <span>{classes.filter((c) => c.facultyId === f.id).length}</span> },
    { key: 'students', header: 'Số sinh viên', sortable: true, sortValue: (f) => students.filter((s) => s.facultyId === f.id).length, render: (f) => <span>{students.filter((s) => s.facultyId === f.id).length}</span> },
  ];
  return <div className="space-y-6">
    <PageHeader title="Khoa" description="Danh sách khoa" />
    <Card><CardContent className="p-4"><DataTable columns={columns} data={faculties} rowKey={(f) => f.id} pageSize={10} /></CardContent></Card>
  </div>;
}
