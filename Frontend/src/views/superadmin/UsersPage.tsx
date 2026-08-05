'use client';
import { useMemo, useState } from 'react';
import { Users, Search, Plus, Lock, Unlock, Pencil, Trash2 } from 'lucide-react';
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
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import { ROLE_LABELS } from '@/lib/constants';
import { formatDateTime } from '@/lib/format';
import type { User, UserRole } from '@/types';

interface DisplayUser extends User { studentRecordId?: string; }

export default function UsersPage() {
  const { users, students, addUser, updateUser, deleteUser, updateStudent } = useAppStore();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [lockTarget, setLockTarget] = useState<DisplayUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'organizer' as UserRole, phone: '', status: 'active' as 'active' | 'locked', password: '' });

  const allUsers = useMemo<DisplayUser[]>(() => [
    ...users,
    ...students.map((student) => ({
      id: student.userId, name: student.fullName, email: student.email, role: student.accountRole ?? ('student' as UserRole),
      status: student.status, createdAt: '', phone: student.phone, lastLogin: undefined, studentRecordId: student.id,
    })),
  ], [users, students]);
  const filtered = allUsers.filter((user) => {
    if (role !== 'all' && user.role !== role) return false;
    if (status !== 'all' && user.status !== status) return false;
    if (search) { const query = search.toLowerCase(); if (!user.name.toLowerCase().includes(query) && !user.email.toLowerCase().includes(query)) return false; }
    return true;
  });

  function openAdd() { setEditing(null); setForm({ name: '', email: '', role: 'organizer', phone: '', status: 'active', password: '' }); setOpen(true); }
  function openEdit(user: User) { setEditing(user); setForm({ name: user.name, email: user.email, role: user.role, phone: user.phone ?? '', status: user.status, password: '' }); setOpen(true); }
  async function handleSave() {
    if (!form.name.trim() || !form.email.trim()) { toast({ title: 'Vui lòng nhập họ tên và email', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const payload = { ...form, password: form.password || undefined };
      if (editing) { await updateUser(editing.id, payload); toast({ title: 'Đã cập nhật người dùng trong database' }); }
      else { await addUser(payload); toast({ title: 'Đã thêm người dùng vào database' }); }
      setOpen(false);
    } catch (error) { toast({ title: 'Không thể lưu người dùng', description: error instanceof Error ? error.message : 'Có lỗi xảy ra', variant: 'destructive' }); }
    finally { setSaving(false); }
  }
  async function setAccountStatus(target: DisplayUser, nextStatus: 'active' | 'locked') {
    try {
      if (target.role === 'student' && target.studentRecordId) await updateStudent(target.studentRecordId, { status: nextStatus });
      else await updateUser(target.id, { status: nextStatus });
      toast({ title: nextStatus === 'active' ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản' });
      setLockTarget(null);
    } catch (error) { toast({ title: 'Không thể cập nhật trạng thái', description: error instanceof Error ? error.message : 'Có lỗi xảy ra', variant: 'destructive' }); }
  }
  async function handleDelete() {
    if (!deleteTarget) return;
    try { await deleteUser(deleteTarget.id); toast({ title: 'Đã xóa người dùng khỏi database' }); setDeleteTarget(null); }
    catch (error) { toast({ title: 'Không thể xóa người dùng', description: error instanceof Error ? error.message : 'Có lỗi xảy ra', variant: 'destructive' }); }
  }

  const columns: Column<DisplayUser>[] = [
    { key: 'name', header: 'Họ tên', sortable: true, sortValue: (u) => u.name, render: (u) => <span className="font-medium">{u.name}</span> },
    { key: 'email', header: 'Email', sortable: true, sortValue: (u) => u.email, render: (u) => <span className="text-muted-foreground">{u.email}</span> },
    { key: 'role', header: 'Vai trò', sortable: true, sortValue: (u) => u.role, render: (u) => <span className="text-muted-foreground">{ROLE_LABELS[u.role]}</span> },
    { key: 'status', header: 'Trạng thái', render: (u) => <StatusBadge label={u.status === 'active' ? 'Hoạt động' : 'Khóa'} variant={u.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'} /> },
    { key: 'lastLogin', header: 'Đăng nhập cuối', render: (u) => <span className="text-xs text-muted-foreground">{u.lastLogin ? formatDateTime(u.lastLogin) : '—'}</span> },
    { key: 'actions', header: '', render: (u) => <div className="flex gap-1">{u.role !== 'student' && <Button size="sm" variant="ghost" onClick={() => openEdit(u)}><Pencil className="h-4 w-4" /></Button>}{u.status === 'active' ? <Button size="sm" variant="ghost" onClick={() => setLockTarget(u)}><Lock className="h-4 w-4 text-destructive" /></Button> : <Button size="sm" variant="ghost" onClick={() => void setAccountStatus(u, 'active')}><Unlock className="h-4 w-4 text-success" /></Button>}{u.role !== 'student' && <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(u)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}</div> },
  ];

  return <div className="space-y-6">
    <PageHeader title="Người dùng" description="Quản lý tài khoản người dùng"><Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" /> Thêm người dùng</Button></PageHeader>
    <Card><CardContent className="space-y-4 p-4"><div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Tìm theo tên hoặc email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div><Select value={role} onValueChange={setRole}><SelectTrigger className="h-9 sm:w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả vai trò</SelectItem>{Object.entries(ROLE_LABELS).map(([key, value]) => <SelectItem key={key} value={key}>{value}</SelectItem>)}</SelectContent></Select><Select value={status} onValueChange={setStatus}><SelectTrigger className="h-9 sm:w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả trạng thái</SelectItem><SelectItem value="active">Hoạt động</SelectItem><SelectItem value="locked">Khóa</SelectItem></SelectContent></Select></div>{filtered.length === 0 ? <EmptyState icon={Users} title="Không có người dùng" /> : <DataTable columns={columns} data={filtered} rowKey={(u) => `${u.role}-${u.id}`} pageSize={10} />}</CardContent></Card>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{editing ? 'Sửa người dùng' : 'Thêm người dùng'}</DialogTitle></DialogHeader><div className="grid gap-4 py-2"><div className="space-y-2"><Label>Họ tên *</Label><Input value={form.name} onChange={(e) => setForm((value) => ({ ...value, name: e.target.value }))} /></div><div className="space-y-2"><Label>Email *</Label><Input value={form.email} onChange={(e) => setForm((value) => ({ ...value, email: e.target.value }))} /></div><div className="space-y-2"><Label>Vai trò</Label><Select value={form.role} onValueChange={(value) => setForm((item) => ({ ...item, role: value as UserRole }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(ROLE_LABELS).filter(([key]) => key !== 'student').map(([key, value]) => <SelectItem key={key} value={key}>{value}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Điện thoại</Label><Input value={form.phone} onChange={(e) => setForm((value) => ({ ...value, phone: e.target.value }))} /></div><div className="space-y-2"><Label>{editing ? 'Mật khẩu mới (để trống nếu giữ nguyên)' : 'Mật khẩu (để trống dùng mặc định)'}</Label><Input type="password" value={form.password} onChange={(e) => setForm((value) => ({ ...value, password: e.target.value }))} /></div></div><DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button><Button onClick={handleSave} disabled={saving}>{saving ? 'Đang lưu...' : editing ? 'Lưu' : 'Thêm'}</Button></DialogFooter></DialogContent></Dialog>
    <ConfirmDialog open={!!lockTarget} onOpenChange={(value) => !value && setLockTarget(null)} title="Khóa tài khoản" description={`Khóa tài khoản "${lockTarget?.name}"?`} confirmLabel="Khóa" destructive onConfirm={() => lockTarget ? setAccountStatus(lockTarget, 'locked') : Promise.resolve()} />
    <ConfirmDialog open={!!deleteTarget} onOpenChange={(value) => !value && setDeleteTarget(null)} title="Xóa người dùng" description={`Xóa tài khoản "${deleteTarget?.name}"? Không thể xóa người phụ trách đang có sự kiện.`} confirmLabel="Xóa" destructive onConfirm={handleDelete} />
  </div>;
}
