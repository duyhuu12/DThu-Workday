'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, Search, Trash2, UserCheck } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, type Column } from '@/components/common/DataTable';
import { EmptyState } from '@/components/common/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import {
  assignClassLeader,
  getClassLeaderAssignments,
  removeClassLeader,
  type ClassLeaderAssignments,
} from '@/services/classLeaderApi';

type LeaderRow = ClassLeaderAssignments['leaders'][number];

export default function ClassLeadersPage() {
  const { toast } = useToast();
  const [data, setData] = useState<ClassLeaderAssignments | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [search, setSearch] = useState('');
  const [removeTarget, setRemoveTarget] = useState<LeaderRow | null>(null);

  async function load() {
    setLoading(true);
    try {
      setData(await getClassLeaderAssignments());
    } catch (error) {
      toast({
        title: 'Không thể tải cán bộ lớp',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const candidates = data?.candidates.filter((candidate) => candidate.currentRole !== 'class_leader') ?? [];
  const selectedCandidate = data?.candidates.find((candidate) => candidate.studentId === studentId);
  const leaders = useMemo(() => {
    const query = search.trim().toLowerCase();
    const rows = data?.leaders ?? [];
    if (!query) return rows;
    return rows.filter((leader) =>
      leader.fullName.toLowerCase().includes(query) ||
      (leader.studentCode || '').toLowerCase().includes(query) ||
      (leader.className || '').toLowerCase().includes(query),
    );
  }, [data, search]);

  async function handleAssign() {
    if (!selectedCandidate) return;
    setSaving(true);
    try {
      await assignClassLeader(selectedCandidate.studentId, selectedCandidate.classId);
      toast({ title: 'Đã phân công cán bộ lớp', description: `${selectedCandidate.fullName} quản lý ${selectedCandidate.className}.` });
      setOpen(false);
      setStudentId('');
      await load();
    } catch (error) {
      toast({
        title: 'Không thể phân công',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!removeTarget) return;
    try {
      await removeClassLeader(removeTarget.userId);
      toast({ title: 'Đã hủy phân công cán bộ lớp' });
      setRemoveTarget(null);
      await load();
    } catch (error) {
      toast({
        title: 'Không thể hủy phân công',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
        variant: 'destructive',
      });
    }
  }

  const columns: Column<LeaderRow>[] = [
    { key: 'studentCode', header: 'Mã SV', sortable: true, sortValue: (leader) => leader.studentCode || '', render: (leader) => leader.studentCode || '—' },
    { key: 'fullName', header: 'Họ tên', sortable: true, sortValue: (leader) => leader.fullName, render: (leader) => <div><p className="font-medium">{leader.fullName}</p><p className="text-xs text-muted-foreground">{leader.email}</p></div> },
    { key: 'className', header: 'Lớp quản lý', sortable: true, sortValue: (leader) => leader.className || '', render: (leader) => leader.className || <span className="text-destructive">Chưa phân lớp</span> },
    { key: 'facultyName', header: 'Khoa', render: (leader) => leader.facultyName || '—' },
    { key: 'actions', header: '', render: (leader) => <Button size="sm" variant="ghost" onClick={() => setRemoveTarget(leader)}><Trash2 className="mr-1 h-4 w-4 text-destructive" />Hủy phân công</Button> },
  ];

  return <div className="space-y-6">
    <PageHeader title="Cán bộ lớp" description="Phân công sinh viên làm cán bộ/lớp trưởng cho đúng lớp đang học">
      <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Phân công</Button>
    </PageHeader>
    <Card><CardContent className="space-y-4 p-4">
      <div className="relative max-w-xl"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm cán bộ lớp..." className="pl-9" /></div>
      {loading ? <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : leaders.length === 0 ? <EmptyState icon={UserCheck} title="Chưa có cán bộ lớp" /> : <DataTable columns={columns} data={leaders} rowKey={(leader) => leader.userId} pageSize={12} />}
    </CardContent></Card>

    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Phân công cán bộ lớp</DialogTitle></DialogHeader><div className="space-y-4 py-2"><div className="space-y-2"><Label>Sinh viên</Label><Select value={studentId} onValueChange={setStudentId}><SelectTrigger><SelectValue placeholder="Chọn sinh viên" /></SelectTrigger><SelectContent>{candidates.map((candidate) => <SelectItem key={candidate.studentId} value={candidate.studentId}>{candidate.studentCode} · {candidate.fullName} · {candidate.className}</SelectItem>)}</SelectContent></Select></div>{selectedCandidate && <div className="rounded-lg border bg-muted/30 p-3 text-sm"><p><strong>Lớp quản lý:</strong> {selectedCandidate.className}</p><p><strong>Khoa:</strong> {selectedCandidate.facultyName}</p><p className="mt-2 text-xs text-muted-foreground">Hệ thống chỉ cho phép sinh viên quản lý đúng lớp đang học.</p></div>}</div><DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button><Button onClick={handleAssign} disabled={saving || !selectedCandidate}>{saving ? 'Đang lưu...' : 'Phân công'}</Button></DialogFooter></DialogContent></Dialog>
    <ConfirmDialog open={!!removeTarget} onOpenChange={(value) => !value && setRemoveTarget(null)} title="Hủy phân công cán bộ lớp" description={`Tài khoản ${removeTarget?.fullName} sẽ trở lại vai trò Sinh viên và không còn truy cập dữ liệu lớp.`} confirmLabel="Hủy phân công" destructive onConfirm={handleRemove} />
  </div>;
}
