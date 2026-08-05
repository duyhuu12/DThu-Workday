'use client';
import { useState } from 'react';
import { Users, Search, Plus, Pencil, Trash2, Award } from 'lucide-react';
import { useAppStore } from '@/hooks/useAppStore';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { DataTable, type Column } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import type { Student } from '@/types';

const emptyForm = { fullName: '', studentCode: '', email: '', phone: '', facultyId: '', classId: '', gender: 'male' as 'male' | 'female', schoolYear: '2024-2028' };

export default function StudentManagementPage() {
  const { students, faculties, classes, addStudent, updateStudent, deleteStudent, adjustStudentWorkdays } = useAppStore();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [faculty, setFaculty] = useState('all');
  const [status, setStatus] = useState('all');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [saving, setSaving] = useState(false);
  const [adjustingWorkdays, setAdjustingWorkdays] = useState(false);
  const [workdayAdjustment, setWorkdayAdjustment] = useState({ value: '', reason: '' });
  const [form, setForm] = useState(emptyForm);

  const filtered = students.filter((student) => {
    if (faculty !== 'all' && student.facultyId !== faculty) return false;
    if (status !== 'all' && student.status !== status) return false;
    if (search) {
      const query = search.toLowerCase();
      if (!student.fullName.toLowerCase().includes(query) && !student.studentCode.toLowerCase().includes(query) && !student.email.toLowerCase().includes(query)) return false;
    }
    return true;
  });

  function openAdd() {
    const facultyId = faculties[0]?.id ?? '';
    setEditing(null);
    setWorkdayAdjustment({ value: '', reason: '' });
    setForm({ ...emptyForm, facultyId, classId: classes.find((item) => item.facultyId === facultyId)?.id ?? '' });
    setOpen(true);
  }

  function openEdit(student: Student) {
    setEditing(student);
    setWorkdayAdjustment({ value: '', reason: '' });
    setForm({
      fullName: student.fullName, studentCode: student.studentCode, email: student.email,
      phone: student.phone ?? '', facultyId: student.facultyId, classId: student.classId,
      gender: student.gender, schoolYear: student.schoolYear,
    });
    setOpen(true);
  }

  async function handleSave() {
    if (!form.fullName.trim() || !form.studentCode.trim() || !form.facultyId || !form.classId) {
      toast({ title: 'Vui lòng nhập đầy đủ họ tên, mã sinh viên, khoa và lớp', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateStudent(editing.id, form);
        toast({ title: 'Đã cập nhật sinh viên trong database' });
      } else {
        await addStudent(form);
        toast({ title: 'Đã thêm sinh viên vào database' });
      }
      setOpen(false);
    } catch (error) {
      toast({ title: 'Không thể lưu sinh viên', description: error instanceof Error ? error.message : 'Có lỗi xảy ra', variant: 'destructive' });
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteStudent(deleteTarget.id);
      toast({ title: 'Đã xóa sinh viên khỏi database' });
      setDeleteTarget(null);
    } catch (error) {
      toast({ title: 'Không thể xóa sinh viên', description: error instanceof Error ? error.message : 'Có lỗi xảy ra', variant: 'destructive' });
    }
  }

  async function handleWorkdayAdjustment() {
    if (!editing) return;
    const creditValue = Number(workdayAdjustment.value);
    const reason = workdayAdjustment.reason.trim();
    if (!Number.isFinite(creditValue) || creditValue === 0) {
      toast({ title: 'Số ngày công phải khác 0', description: 'Nhập số dương để cộng hoặc số âm để thu hồi.', variant: 'destructive' });
      return;
    }
    if (reason.length < 5) {
      toast({ title: 'Vui lòng nhập lý do ít nhất 5 ký tự', variant: 'destructive' });
      return;
    }

    setAdjustingWorkdays(true);
    try {
      await adjustStudentWorkdays(editing.id, creditValue, reason);
      const nextWorkdays = editing.accumulatedWorkdays + creditValue;
      setEditing({ ...editing, accumulatedWorkdays: nextWorkdays, completedWorkdays: nextWorkdays });
      setWorkdayAdjustment({ value: '', reason: '' });
      toast({
        title: creditValue > 0 ? `Đã cộng ${creditValue} ngày công` : `Đã thu hồi ${Math.abs(creditValue)} ngày công`,
        description: `Sinh viên: ${editing.fullName}`,
      });
    } catch (error) {
      toast({ title: 'Không thể điều chỉnh ngày công', description: error instanceof Error ? error.message : 'Có lỗi xảy ra', variant: 'destructive' });
    } finally {
      setAdjustingWorkdays(false);
    }
  }

  const columns: Column<Student>[] = [
    { key: 'studentCode', header: 'Mã SV', sortable: true, sortValue: (s) => s.studentCode, render: (s) => <span className="font-mono text-xs">{s.studentCode}</span> },
    { key: 'fullName', header: 'Họ tên', sortable: true, sortValue: (s) => s.fullName, render: (s) => <span className="font-medium">{s.fullName}</span> },
    { key: 'email', header: 'Email', render: (s) => <span className="text-muted-foreground">{s.email}</span> },
    { key: 'className', header: 'Lớp', render: (s) => <span>{classes.find((c) => c.id === s.classId)?.name ?? '—'}</span> },
    { key: 'faculty', header: 'Khoa', render: (s) => <span className="text-muted-foreground">{faculties.find((f) => f.id === s.facultyId)?.name ?? '—'}</span> },
    { key: 'workdays', header: 'Ngày công', sortable: true, sortValue: (s) => s.accumulatedWorkdays, render: (s) => <span className="font-medium text-secondary">{s.accumulatedWorkdays}/{s.requiredWorkdays}</span> },
    { key: 'status', header: 'Trạng thái', render: (s) => <StatusBadge label={s.status === 'active' ? 'Hoạt động' : 'Khóa'} variant={s.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'} /> },
    { key: 'action', header: '', render: (s) => <div className="flex gap-1"><Button size="sm" variant="ghost" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button><Button size="sm" variant="ghost" onClick={() => setDeleteTarget(s)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div> },
  ];

  return <div className="space-y-6">
    <PageHeader title="Quản lý sinh viên" description="Danh sách và thông tin sinh viên"><Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" /> Thêm sinh viên</Button></PageHeader>
    <Card><CardContent className="space-y-4 p-4">
      <div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Tìm theo tên, mã SV, email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div><Select value={faculty} onValueChange={setFaculty}><SelectTrigger className="h-9 sm:w-52"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả khoa</SelectItem>{faculties.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent></Select><Select value={status} onValueChange={setStatus}><SelectTrigger className="h-9 sm:w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả trạng thái</SelectItem><SelectItem value="active">Hoạt động</SelectItem><SelectItem value="locked">Khóa</SelectItem></SelectContent></Select></div>
      {filtered.length === 0 ? <EmptyState icon={Users} title="Không có sinh viên" /> : <DataTable columns={columns} data={filtered} rowKey={(s) => s.id} pageSize={10} />}
    </CardContent></Card>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>{editing ? 'Sửa sinh viên' : 'Thêm sinh viên'}</DialogTitle></DialogHeader><div className="grid gap-4 py-2 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2"><Label>Họ tên *</Label><Input value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} /></div>
      <div className="space-y-2"><Label>Mã SV *</Label><Input value={form.studentCode} onChange={(e) => setForm((f) => ({ ...f, studentCode: e.target.value }))} disabled={!!editing} /></div>
      <div className="space-y-2"><Label>Email</Label><Input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></div>
      <div className="space-y-2"><Label>Điện thoại</Label><Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></div>
      <div className="space-y-2"><Label>Giới tính</Label><Select value={form.gender} onValueChange={(value) => setForm((f) => ({ ...f, gender: value as 'male' | 'female' }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="male">Nam</SelectItem><SelectItem value="female">Nữ</SelectItem></SelectContent></Select></div>
      <div className="space-y-2"><Label>Khoa *</Label><Select value={form.facultyId} onValueChange={(value) => setForm((f) => ({ ...f, facultyId: value, classId: classes.find((item) => item.facultyId === value)?.id ?? '' }))}><SelectTrigger><SelectValue placeholder="Chọn khoa" /></SelectTrigger><SelectContent>{faculties.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2"><Label>Lớp *</Label><Select value={form.classId} onValueChange={(value) => setForm((f) => ({ ...f, classId: value }))}><SelectTrigger><SelectValue placeholder="Chọn lớp" /></SelectTrigger><SelectContent>{classes.filter((c) => c.facultyId === form.facultyId).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2"><Label>Khóa</Label><Input value={form.schoolYear} onChange={(e) => setForm((f) => ({ ...f, schoolYear: e.target.value }))} /></div>
      {editing && <section className="space-y-4 rounded-xl border border-blue-200 bg-blue-50/60 p-4 sm:col-span-2 dark:border-blue-900 dark:bg-blue-950/20">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white"><Award className="h-5 w-5" /></span>
            <div><h3 className="font-semibold">Điều chỉnh ngày công</h3><p className="mt-0.5 text-sm text-muted-foreground">Tạo một phát sinh có lý do và lưu đầy đủ trong lịch sử.</p></div>
          </div>
          <div className="shrink-0 text-right"><p className="text-xs text-muted-foreground">Hiện có</p><p className="text-lg font-bold text-blue-700 dark:text-blue-300">{editing.accumulatedWorkdays}/{editing.requiredWorkdays} ngày</p></div>
        </div>
        <div className="grid gap-3 sm:grid-cols-[170px_1fr]">
          <div className="space-y-2"><Label htmlFor="workday-value">Số ngày cộng/trừ *</Label><Input id="workday-value" type="number" step="0.5" min="-100" max="100" placeholder="Ví dụ: 1 hoặc -0.5" value={workdayAdjustment.value} onChange={(e) => setWorkdayAdjustment((current) => ({ ...current, value: e.target.value }))} /></div>
          <div className="space-y-2"><Label htmlFor="workday-reason">Lý do điều chỉnh *</Label><Input id="workday-reason" maxLength={500} placeholder="Ví dụ: Bổ sung ngày công theo quyết định..." value={workdayAdjustment.reason} onChange={(e) => setWorkdayAdjustment((current) => ({ ...current, reason: e.target.value }))} /></div>
        </div>
        <div className="flex flex-col gap-3 border-t border-blue-200 pt-3 sm:flex-row sm:items-center sm:justify-between dark:border-blue-900">
          <p className="text-xs text-muted-foreground">Số dương để cộng, số âm để thu hồi. Tổng ngày công không thể nhỏ hơn 0.</p>
          <Button type="button" size="sm" onClick={handleWorkdayAdjustment} disabled={adjustingWorkdays || !workdayAdjustment.value || workdayAdjustment.reason.trim().length < 5}>{adjustingWorkdays ? 'Đang cập nhật...' : 'Xác nhận điều chỉnh'}</Button>
        </div>
      </section>}
    </div><DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button><Button onClick={handleSave} disabled={saving}>{saving ? 'Đang lưu...' : editing ? 'Lưu' : 'Thêm'}</Button></DialogFooter></DialogContent></Dialog>
    <ConfirmDialog open={!!deleteTarget} onOpenChange={(value) => !value && setDeleteTarget(null)} title="Xóa sinh viên" description={`Xóa sinh viên "${deleteTarget?.fullName}"? Các đăng ký, điểm danh, ngày công và khiếu nại liên quan cũng sẽ bị xóa.`} confirmLabel="Xóa" destructive onConfirm={handleDelete} />
  </div>;
}
