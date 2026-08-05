'use client';
import { GraduationCap, Plus, Pencil, Trash2 } from 'lucide-react';
import { useAppStore } from '@/hooks/useAppStore';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, type Column } from '@/components/common/DataTable';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import type { Class } from '@/types';

export default function ClassesPage() {
  const { classes, faculties, students, addClass, updateClass, deleteClass } = useAppStore();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Class | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Class | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', facultyId: '', schoolYear: '2024-2028' });

  function openAdd() { setEditing(null); setForm({ name: '', code: '', facultyId: faculties[0]?.id ?? '', schoolYear: '2024-2028' }); setOpen(true); }
  function openEdit(item: Class) { setEditing(item); setForm({ name: item.name, code: item.code, facultyId: item.facultyId, schoolYear: item.schoolYear }); setOpen(true); }
  async function handleSave() {
    if (!form.name.trim() || !form.code.trim() || !form.facultyId) {
      toast({ title: 'Vui lòng điền tên, mã lớp và khoa', variant: 'destructive' });
      return;
    }

    const isCodeDuplicate = classes.some(
      (c) => c.code.trim().toLowerCase() === form.code.trim().toLowerCase() && c.id !== editing?.id
    );
    if (isCodeDuplicate) {
      toast({
        title: 'Mã lớp đã tồn tại',
        description: `Mã lớp "${form.code.trim()}" đã có trong hệ thống. Vui lòng chọn mã khác.`,
        variant: 'destructive',
      });
      return;
    }

    const isNameDuplicate = classes.some(
      (c) => c.name.trim().toLowerCase() === form.name.trim().toLowerCase() && c.id !== editing?.id
    );
    if (isNameDuplicate) {
      toast({
        title: 'Tên lớp đã tồn tại',
        description: `Tên lớp "${form.name.trim()}" đã có trong hệ thống. Vui lòng chọn tên khác.`,
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await updateClass(editing.id, form);
        toast({ title: 'Đã cập nhật lớp thành công' });
      } else {
        await addClass(form);
        toast({ title: 'Đã thêm lớp thành công' });
      }
      setOpen(false);
    } catch (error) {
      toast({
        title: 'Không thể lưu lớp',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }
  async function handleDelete() {
    if (!deleteTarget) return;
    try { await deleteClass(deleteTarget.id); toast({ title: 'Đã xóa lớp khỏi database' }); setDeleteTarget(null); }
    catch (error) { toast({ title: 'Không thể xóa lớp', description: error instanceof Error ? error.message : 'Có lỗi xảy ra', variant: 'destructive' }); }
  }

  const columns: Column<Class>[] = [
    { key: 'code', header: 'Mã', sortable: true, sortValue: (c) => c.code, render: (c) => <span className="font-mono text-xs">{c.code}</span> },
    { key: 'name', header: 'Tên lớp', sortable: true, sortValue: (c) => c.name, render: (c) => <span className="font-medium">{c.name}</span> },
    { key: 'faculty', header: 'Khoa', render: (c) => <span className="text-muted-foreground">{faculties.find((f) => f.id === c.facultyId)?.name ?? '—'}</span> },
    { key: 'schoolYear', header: 'Khóa', sortable: true, sortValue: (c) => c.schoolYear, render: (c) => <span>{c.schoolYear}</span> },
    { key: 'students', header: 'Sĩ số', sortable: true, sortValue: (c) => students.filter((s) => s.classId === c.id).length, render: (c) => <span>{students.filter((s) => s.classId === c.id).length}</span> },
    { key: 'action', header: '', render: (c) => <div className="flex gap-1"><Button size="sm" variant="ghost" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button><Button size="sm" variant="ghost" onClick={() => setDeleteTarget(c)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div> },
  ];

  return <div className="space-y-6">
    <PageHeader title="Lớp học" description="Danh sách lớp sinh hoạt"><Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" /> Thêm lớp</Button></PageHeader>
    <Card><CardContent className="p-4">{classes.length === 0 ? <EmptyState icon={GraduationCap} title="Không có lớp" /> : <DataTable columns={columns} data={classes} rowKey={(c) => c.id} pageSize={10} />}</CardContent></Card>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{editing ? 'Sửa lớp' : 'Thêm lớp'}</DialogTitle></DialogHeader><div className="grid gap-4 py-2">
      <div className="space-y-2"><Label>Tên lớp *</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
      <div className="space-y-2"><Label>Mã lớp *</Label><Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} /></div>
      <div className="space-y-2"><Label>Khoa *</Label><Select value={form.facultyId} onValueChange={(value) => setForm((f) => ({ ...f, facultyId: value }))}><SelectTrigger><SelectValue placeholder="Chọn khoa" /></SelectTrigger><SelectContent>{faculties.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2"><Label>Khóa</Label><Input value={form.schoolYear} onChange={(e) => setForm((f) => ({ ...f, schoolYear: e.target.value }))} /></div>
    </div><DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button><Button onClick={handleSave} disabled={saving}>{saving ? 'Đang lưu...' : editing ? 'Lưu' : 'Thêm'}</Button></DialogFooter></DialogContent></Dialog>
    <ConfirmDialog open={!!deleteTarget} onOpenChange={(value) => !value && setDeleteTarget(null)} title="Xóa lớp" description={`Xóa lớp "${deleteTarget?.name}"? Chỉ có thể xóa lớp chưa có sinh viên.`} confirmLabel="Xóa" destructive onConfirm={handleDelete} />
  </div>;
}
