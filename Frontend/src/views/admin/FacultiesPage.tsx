'use client';
import { useState } from 'react';
import { Building2, Plus, Pencil, Trash2 } from 'lucide-react';
import { useAppStore } from '@/hooks/useAppStore';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, type Column } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import type { Faculty } from '@/types';

export default function FacultiesPage() {
  const { faculties, classes, students, addFaculty, updateFaculty, deleteFaculty } = useAppStore();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Faculty | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Faculty | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', deanName: '' });

  function openAdd() { setEditing(null); setForm({ name: '', code: '', deanName: '' }); setOpen(true); }
  function openEdit(item: Faculty) { setEditing(item); setForm({ name: item.name, code: item.code, deanName: item.deanName ?? '' }); setOpen(true); }
  async function handleSave() {
    if (!form.name.trim() || !form.code.trim() || !form.deanName.trim()) { toast({ title: 'Vui lòng nhập đầy đủ tên khoa, mã khoa và tên trưởng khoa', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      if (editing) { await updateFaculty(editing.id, form); toast({ title: 'Đã cập nhật khoa trong database' }); }
      else { await addFaculty(form); toast({ title: 'Đã thêm khoa vào database' }); }
      setOpen(false);
    } catch (error) { toast({ title: 'Không thể lưu khoa', description: error instanceof Error ? error.message : 'Có lỗi xảy ra', variant: 'destructive' }); }
    finally { setSaving(false); }
  }
  async function handleDelete() {
    if (!deleteTarget) return;
    try { await deleteFaculty(deleteTarget.id); toast({ title: 'Đã xóa khoa khỏi database' }); setDeleteTarget(null); }
    catch (error) { toast({ title: 'Không thể xóa khoa', description: error instanceof Error ? error.message : 'Có lỗi xảy ra', variant: 'destructive' }); }
  }

  const columns: Column<Faculty>[] = [
    { key: 'code', header: 'Mã', sortable: true, sortValue: (f) => f.code, render: (f) => <span className="font-mono text-xs">{f.code}</span> },
    { key: 'name', header: 'Tên khoa', sortable: true, sortValue: (f) => f.name, render: (f) => <span className="font-medium">{f.name}</span> },
    { key: 'deanName', header: 'Trưởng khoa', sortable: true, sortValue: (f) => f.deanName ?? '', render: (f) => <span>{f.deanName || '—'}</span> },
    { key: 'classes', header: 'Số lớp', sortable: true, sortValue: (f) => classes.filter((c) => c.facultyId === f.id).length, render: (f) => <span>{classes.filter((c) => c.facultyId === f.id).length}</span> },
    { key: 'students', header: 'Số sinh viên', sortable: true, sortValue: (f) => students.filter((s) => s.facultyId === f.id).length, render: (f) => <span>{students.filter((s) => s.facultyId === f.id).length}</span> },
    { key: 'action', header: '', render: (f) => <div className="flex gap-1"><Button size="sm" variant="ghost" onClick={() => openEdit(f)}><Pencil className="h-4 w-4" /></Button><Button size="sm" variant="ghost" onClick={() => setDeleteTarget(f)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div> },
  ];

  return <div className="space-y-6">
    <PageHeader title="Khoa" description="Danh sách khoa"><Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" /> Thêm khoa</Button></PageHeader>
    <Card><CardContent className="p-4">{faculties.length === 0 ? <div className="flex flex-col items-center py-10 text-muted-foreground"><Building2 className="mb-2 h-8 w-8" /><p>Không có khoa</p></div> : <DataTable columns={columns} data={faculties} rowKey={(f) => f.id} pageSize={10} />}</CardContent></Card>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{editing ? 'Sửa khoa' : 'Thêm khoa'}</DialogTitle></DialogHeader><div className="grid gap-4 py-2"><div className="space-y-2"><Label>Tên khoa *</Label><Input value={form.name} onChange={(e) => setForm((value) => ({ ...value, name: e.target.value }))} /></div><div className="space-y-2"><Label>Mã khoa *</Label><Input value={form.code} onChange={(e) => setForm((value) => ({ ...value, code: e.target.value }))} /></div><div className="space-y-2"><Label>Tên trưởng khoa *</Label><Input value={form.deanName} onChange={(e) => setForm((value) => ({ ...value, deanName: e.target.value }))} placeholder="Nhập họ và tên trưởng khoa" maxLength={150} /></div></div><DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button><Button onClick={handleSave} disabled={saving}>{saving ? 'Đang lưu...' : editing ? 'Lưu' : 'Thêm'}</Button></DialogFooter></DialogContent></Dialog>
    <ConfirmDialog open={!!deleteTarget} onOpenChange={(value) => !value && setDeleteTarget(null)} title="Xóa khoa" description={`Xóa khoa "${deleteTarget?.name}"? Chỉ có thể xóa khoa chưa có lớp và sinh viên.`} confirmLabel="Xóa" destructive onConfirm={handleDelete} />
  </div>;
}
