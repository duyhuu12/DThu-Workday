'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2, Search, Undo2, UserCheck, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, type Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getClassLeaderEvents, getClassStudents, setPreliminaryReview } from '@/services/classLeaderApi';
import { EVENT_STATUS_LABELS, REG_STATUS_LABELS, REG_STATUS_VARIANTS } from '@/lib/constants';
import { formatDate } from '@/lib/format';
import type { ClassLeaderEvent, ClassLeaderStudent, PreliminaryReviewStatus } from '@/types';

const PRELIMINARY_LABELS: Record<PreliminaryReviewStatus, string> = {
  unreviewed: 'Chưa xác nhận',
  confirmed: 'Đã xác nhận sơ bộ',
  needs_review: 'Cần kiểm tra',
};

const PRELIMINARY_VARIANTS: Record<PreliminaryReviewStatus, string> = {
  unreviewed: 'bg-muted text-muted-foreground',
  confirmed: 'bg-emerald-100 text-emerald-700',
  needs_review: 'bg-amber-100 text-amber-700',
};

export default function ClassRegistrationsPage() {
  const { toast } = useToast();
  const [events, setEvents] = useState<ClassLeaderEvent[]>([]);
  const [students, setStudents] = useState<ClassLeaderStudent[]>([]);
  const [eventId, setEventId] = useState('');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'all' | 'registered' | 'unregistered'>('all');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getClassLeaderEvents()
      .then((data) => {
        if (!active) return;
        setEvents(data);
        if (data.length > 0) setEventId(data[0].id);
      })
      .catch((error: unknown) => toast({
        title: 'Không thể tải danh sách sự kiện',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
        variant: 'destructive',
      }))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [toast]);

  async function loadStudents(selectedEventId: string) {
    if (!selectedEventId) {
      setStudents([]);
      return;
    }
    setLoading(true);
    try {
      setStudents(await getClassStudents(selectedEventId));
    } catch (error) {
      toast({
        title: 'Không thể tải trạng thái đăng ký',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadStudents(eventId); }, [eventId]);

  const selectedEvent = events.find((event) => event.id === eventId);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return students.filter((student) => {
      if (view === 'registered' && !student.registration) return false;
      if (view === 'unregistered' && student.registration) return false;
      if (!query) return true;
      return student.fullName.toLowerCase().includes(query) || student.studentCode.toLowerCase().includes(query);
    });
  }, [search, students, view]);

  async function handleReview(student: ClassLeaderStudent, status: PreliminaryReviewStatus) {
    const registrationId = student.registration?.id;
    if (!registrationId) return;
    setUpdatingId(registrationId);
    try {
      await setPreliminaryReview(registrationId, status);
      await loadStudents(eventId);
      toast({ title: 'Đã cập nhật xác nhận sơ bộ' });
    } catch (error) {
      toast({
        title: 'Không thể cập nhật',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
    }
  }

  const columns: Column<ClassLeaderStudent>[] = [
    { key: 'studentCode', header: 'Mã SV', sortable: true, sortValue: (student) => student.studentCode, render: (student) => <span className="font-mono text-xs">{student.studentCode}</span> },
    { key: 'fullName', header: 'Họ tên', sortable: true, sortValue: (student) => student.fullName, render: (student) => <span className="font-medium">{student.fullName}</span> },
    { key: 'registration', header: 'Trạng thái đăng ký', render: (student) => student.registration ? <StatusBadge label={REG_STATUS_LABELS[student.registration.status]} variant={REG_STATUS_VARIANTS[student.registration.status]} /> : <StatusBadge label="Chưa đăng ký" variant="bg-slate-100 text-slate-600" /> },
    { key: 'preliminary', header: 'Xác nhận sơ bộ', render: (student) => {
      const status = student.registration?.preliminaryStatus ?? 'unreviewed';
      return student.registration ? <StatusBadge label={PRELIMINARY_LABELS[status]} variant={PRELIMINARY_VARIANTS[status]} /> : <span className="text-muted-foreground">—</span>;
    } },
    { key: 'actions', header: 'Thao tác', render: (student) => {
      if (!student.registration) return <span className="text-xs text-muted-foreground">Chưa có đăng ký</span>;
      const disabled = updatingId === student.registration.id;
      return <div className="flex flex-wrap gap-1">
        <Button size="sm" variant="outline" disabled={disabled} onClick={() => void handleReview(student, 'confirmed')}><CheckCircle2 className="mr-1 h-3.5 w-3.5" />Xác nhận</Button>
        <Button size="sm" variant="outline" disabled={disabled} onClick={() => void handleReview(student, 'needs_review')}><XCircle className="mr-1 h-3.5 w-3.5" />Cần kiểm tra</Button>
        {student.registration.preliminaryStatus !== 'unreviewed' && <Button size="icon" variant="ghost" disabled={disabled} title="Bỏ xác nhận sơ bộ" onClick={() => void handleReview(student, 'unreviewed')}><Undo2 className="h-4 w-4" /></Button>}
      </div>;
    } },
  ];

  const registeredCount = students.filter((student) => !!student.registration).length;
  const confirmedCount = students.filter((student) => student.registration?.preliminaryStatus === 'confirmed').length;

  return <div className="space-y-6">
    <PageHeader title="Theo dõi đăng ký" description="Xem sinh viên đã/chưa đăng ký và xác nhận sơ bộ; không thay đổi trạng thái duyệt chính thức" />
    <Card><CardContent className="space-y-5 p-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(280px,1fr)_220px_minmax(240px,1fr)]">
        <div className="space-y-2"><Label>Sự kiện</Label><Select value={eventId} onValueChange={setEventId}><SelectTrigger><SelectValue placeholder="Chọn sự kiện" /></SelectTrigger><SelectContent>{events.map((event) => <SelectItem key={event.id} value={event.id}>{event.code} · {event.name} · {formatDate(event.date)}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2"><Label>Hiển thị</Label><Select value={view} onValueChange={(value) => setView(value as typeof view)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả sinh viên</SelectItem><SelectItem value="registered">Đã đăng ký</SelectItem><SelectItem value="unregistered">Chưa đăng ký</SelectItem></SelectContent></Select></div>
        <div className="space-y-2"><Label>Tìm kiếm</Label><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Mã hoặc họ tên..." className="pl-9" /></div></div>
      </div>

      {selectedEvent && <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3 text-sm"><span className="font-medium">{selectedEvent.name}</span><StatusBadge label={EVENT_STATUS_LABELS[selectedEvent.status]} variant="bg-blue-100 text-blue-700" /><span className="text-muted-foreground">Đã đăng ký: <strong className="text-foreground">{registeredCount}/{students.length}</strong></span><span className="text-muted-foreground">Xác nhận sơ bộ: <strong className="text-foreground">{confirmedCount}</strong></span></div>}

      {loading ? <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : events.length === 0 ? <div className="flex flex-col items-center py-16 text-center"><UserCheck className="mb-3 h-10 w-10 text-muted-foreground/50" /><p className="font-medium">Chưa có sự kiện áp dụng cho lớp</p></div> : <DataTable columns={columns} data={filtered} rowKey={(student) => student.id} pageSize={12} />}
    </CardContent></Card>
  </div>;
}
