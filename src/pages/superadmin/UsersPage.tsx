'use client';
import { useMemo, useState } from 'react';
import { Users, Search, Plus, Lock, Unlock, Pencil } from 'lucide-react';
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

export default function UsersPage() {
  const { users, students, addUser, updateUser, addActivityLog } = useAppStore();
  const { toast } = useToast();
  const [search, setSearch] = useState(''); const [role, setRole] = useState('all'); const [status, setStatus] = useState('all');
  const [open, setOpen] = useState(false); const [editing, setEditing] = useState<User | null>(null);
  const [lockTarget, setLockTarget] = useState<User | null>(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'student' as UserRole, phone: '', status: 'active' as 'active' | 'locked' });

  const allUsers = useMemo(() => [...users, ...students.map((s) => ({ id: s.userId, name: s.fullName, email: s.email, role: 'student' as UserRole, status: s.status, createdAt: '', phone: s.phone, lastLogin: undefined }))], [users, students]);
  const filtered = allUsers.filter((u) => { if (role !== 'all' && u.role !== role) return false; if (status !== 'all' && u.status !== status) return false; if (search) { const q = search.toLowerCase(); if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false; } return true; });

  const columns: Column<typeof allUsers[number]>[] = [
    { key: 'name', header: 'Họ tên', sortable: true, sortValue: (u) => u.name, render: (u) => <span className="font-medium">{u.name}</span> },
    { key: 'email', header: 'Email', sortable: true, sortValue: (u) => u.email, render: (u) => <span className="text-muted-foreground">{u.email}</span> },
    { key: 'role', header: 'Vai trò', sortable: true, sortValue: (u) => u.role, render: (u) => <span className="text-muted-foreground">{ROLE_LABELS[u.role]}</span> },
    { key: 'status', header: 'Trạng thái', render: (u) => <StatusBadge label={u.status === 'active' ? 'Hoạt động' : 'Khóa'} variant={u.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'} /> },
    { key: 'lastLogin', header: 'Đăng nhập cuối', render: (u) => <span className="text-xs text-muted-foreground">{u.lastLogin ? formatDateTime(u.lastLogin) : '—'}</span> },
    { key: 'actions', header: '', render: (u) => <div className="flex gap-1">{u.status === 'active' ? <Button size="sm" variant="ghost" onClick={() => setLockTarget(u)}><Lock className="h-4 w-4 text-destructive" /></Button> : <Button size="sm" variant="ghost" onClick={() => { updateUser(u.id, { status: 'active' }); addActivityLog({ action: 'Mở khóa tài khoản', affectedItem: u.name, oldValue: 'locked', newValue: 'active' }); toast({ title: 'Đã mở khóa' }); }}><Unlock className="h-4 w-4 text-success" /></Button>}</div> },
  ];

  function openAdd() { setEditing(null); setForm({ name: '', email: '', role: 'organizer', phone: '', status: 'active' }); setOpen(true); }
  async function handleSave() { if (!form.name.trim() || !form.email.trim()) { toast({ title: 'Vui lòng điền đầy đủ', variant: 'destructive' }); return; } await addUser({ ...form }); toast({ title: 'Đã thêm người dùng' }); setOpen(false); }
  async function handleLock() { if (!lockTarget) return; await updateUser(lockTarget.id, { status: 'locked' }); addActivityLog({ action: 'Khóa tài khoản', affectedItem: lockTarget.name, oldValue: 'active', newValue: 'locked' }); toast({ title: 'Đã khóa tài khoản' }); setLockTarget(null); }

  return <div className="space-y-6">
    <PageHeader title="Người dùng" description="Quản lý tài khoản người dùng"><Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" /> Thêm người dùng</Button></PageHeader>
    <Card><CardContent className="space-y-4 p-4">
      <div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Tìm theo tên hoặc email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div><Select value={role} onValueChange={setRole}><SelectTrigger className="h-9 sm:w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả vai trò</SelectItem>{Object.entries(ROLE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select><Select value={status} onValueChange={setStatus}><SelectTrigger className="h-9 sm:w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả trạng thái</SelectItem><SelectItem value="active">Hoạt động</SelectItem><SelectItem value="locked">Khóa</SelectItem></SelectContent></Select></div>
      {filtered.length === 0 ? <EmptyState icon={Users} title="Không có người dùng" /> : <DataTable columns={columns} data={filtered} rowKey={(u) => u.id} pageSize={10} />}
    </CardContent></Card>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Thêm người dùng</DialogTitle></DialogHeader><div className="grid gap-4 py-2">
      <div className="space-y-2"><Label>Họ tên *</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
      <div className="space-y-2"><Label>Email *</Label><Input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></div>
      <div className="space-y-2"><Label>Vai trò</Label><Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v as UserRole }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(ROLE_LABELS).filter(([k]) => k !== 'student').map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2"><Label>Điện thoại</Label><Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></div>
    </div><DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button><Button onClick={handleSave}>Thêm</Button></DialogFooter></DialogContent></Dialog>
    <ConfirmDialog open={!!lockTarget} onOpenChange={(o) => !o && setLockTarget(null)} title="Khóa tài khoản" description={`Khóa tài khoản "${lockTarget?.name}"?`} confirmLabel="Khóa" destructive onConfirm={handleLock} />
  </div>;
}
