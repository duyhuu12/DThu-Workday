'use client';
import { useMemo, useState } from 'react';
import { Users, Search, Plus, Pencil } from 'lucide-react';
import { useAppStore } from '@/hooks/useAppStore';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { DataTable, type Column } from '@/components/common/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import type { Student } from '@/types';

export default function StudentManagementPage() {
  const { students, faculties, classes, addStudent, updateStudent } = useAppStore();
  const { toast } = useToast();
  const [search, setSearch] = useState(''); const [faculty, setFaculty] = useState('all'); const [status, setStatus] = useState('all');
  const [open, setOpen] = useState(false); const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState({ fullName: '', studentCode: '', email: '', phone: '', facultyId: '', classId: '', gender: 'male' as 'male' | 'female', schoolYear: '2024-2028' });

  const filtered = students.filter((s) => { if (faculty !== 'all' && s.facultyId !== faculty) return false; if (status !== 'all' && s.status !== status) return false; if (search) { const q = search.toLowerCase(); if (!s.fullName.toLowerCase().includes(q) && !s.studentCode.toLowerCase().includes(q) && !s.email.toLowerCase().includes(q)) return false; } return true; });

  const columns: Column<Student>[] = [
    { key: 'studentCode', header: 'Mã SV', sortable: true, sortValue: (s) => s.studentCode, render: (s) => <span className="font-mono text-xs">{s.studentCode}</span> },
    { key: 'fullName', header: 'Họ tên', sortable: true, sortValue: (s) => s.fullName, render: (s) => <span className="font-medium">{s.fullName}</span> },
    { key: 'email', header: 'Email', render: (s) => <span className="text-muted-foreground">{s.email}</span> },
    { key: 'className', header: 'Lớp', render: (s) => <span>{classes.find((c) => c.id === s.classId)?.name ?? '—'}</span> },
    { key: 'faculty', header: 'Khoa', render: (s) => <span className="text-muted-foreground">{faculties.find((f) => f.id === s.facultyId)?.name ?? '—'}</span> },
    { key: 'workdays', header: 'Ngày công', sortable: true, sortValue: (s) => s.accumulatedWorkdays, render: (s) => <span className="font-medium text-secondary">{s.accumulatedWorkdays}/{s.requiredWorkdays}</span> },
    { key: 'status', header: 'Trạng thái', render: (s) => <StatusBadge label={s.status === 'active' ? 'Hoạt động' : 'Khóa'} variant={s.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'} /> },
    { key: 'action', header: '', render: (s) => <Button size="sm" variant="ghost" onClick={() => { setEditing(s); setForm({ fullName: s.fullName, studentCode: s.studentCode, email: s.email, phone: s.phone ?? '', facultyId: s.facultyId, classId: s.classId, gender: s.gender, schoolYear: s.schoolYear }); setOpen(true); }}><Pencil className="h-4 w-4" /></Button> },
  ];

  function openAdd() { setEditing(null); setForm({ fullName: '', studentCode: '', email: '', phone: '', facultyId: faculties[0]?.id ?? '', classId: '', gender: 'male', schoolYear: '2024-2028' }); setOpen(true); }

  async function handleSave() {
    if (!form.fullName.trim() || !form.studentCode.trim()) { toast({ title: 'Vui lòng điền đầy đủ', variant: 'destructive' }); return; }
    if (editing) { await updateStudent(editing.id, { ...form }); toast({ title: 'Đã cập nhật sinh viên' }); }
    else { await addStudent({ ...form }); toast({ title: 'Đã thêm sinh viên' }); }
    setOpen(false);
  }

  return <div className="space-y-6">
    <PageHeader title="Quản lý sinh viên" description="Danh sách và thông tin sinh viên"><Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" /> Thêm sinh viên</Button></PageHeader>
    <Card><CardContent className="space-y-4 p-4">
      <div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Tìm theo tên, mã SV, email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div><Select value={faculty} onValueChange={setFaculty}><SelectTrigger className="h-9 sm:w-52"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả khoa</SelectItem>{faculties.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent></Select><Select value={status} onValueChange={setStatus}><SelectTrigger className="h-9 sm:w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả trạng thái</SelectItem><SelectItem value="active">Hoạt động</SelectItem><SelectItem value="locked">Khóa</SelectItem></SelectContent></Select></div>
      {filtered.length === 0 ? <EmptyState icon={Users} title="Không có sinh viên" /> : <DataTable columns={columns} data={filtered} rowKey={(s) => s.id} pageSize={10} />}
    </CardContent></Card>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{editing ? 'Sửa sinh viên' : 'Thêm sinh viên'}</DialogTitle></DialogHeader><div className="grid gap-4 py-2 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2"><Label>Họ tên *</Label><Input value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} /></div>
      <div className="space-y-2"><Label>Mã SV *</Label><Input value={form.studentCode} onChange={(e) => setForm((f) => ({ ...f, studentCode: e.target.value }))} disabled={!!editing} /></div>
      <div className="space-y-2"><Label>Email</Label><Input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></div>
      <div className="space-y-2"><Label>Điện thoại</Label><Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></div>
      <div className="space-y-2"><Label>Giới tính</Label><Select value={form.gender} onValueChange={(v) => setForm((f) => ({ ...f, gender: v as 'male' | 'female' }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="male">Nam</SelectItem><SelectItem value="female">Nữ</SelectItem></SelectContent></Select></div>
      <div className="space-y-2"><Label>Khoa</Label><Select value={form.facultyId} onValueChange={(v) => setForm((f) => ({ ...f, facultyId: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{faculties.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2"><Label>Lớp</Label><Select value={form.classId} onValueChange={(v) => setForm((f) => ({ ...f, classId: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="">Không chọn</SelectItem>{classes.filter((c) => c.facultyId === form.facultyId).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
    </div><DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button><Button onClick={handleSave}>{editing ? 'Lưu' : 'Thêm'}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
