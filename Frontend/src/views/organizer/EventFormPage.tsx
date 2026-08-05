'use client';
import { useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Save, Check, CalendarDays, Clock, Users, ClipboardList } from 'lucide-react';
import { useAppStore } from '@/hooks/useAppStore';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { SHIFT_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { WorkShift } from '@/types';

const STEPS = [
  { id: 1, label: 'Thông tin cơ bản', icon: ClipboardList },
  { id: 2, label: 'Thời gian & năng lực', icon: Clock },
  { id: 3, label: 'Yêu cầu & đối tượng', icon: Users },
];

const SHIFT_TIMES: Record<WorkShift, { start: string; end: string }> = {
  morning: { start: '07:00', end: '10:00' },
  afternoon: { start: '13:00', end: '16:00' },
  evening: { start: '17:00', end: '18:30' },
  fullday: { start: '07:00', end: '18:30' },
};

function toLocalDateInput(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toLocalDateTimeInput(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${toLocalDateInput(date)}T${hours}:${minutes}`;
}

function registrationDefaults(date: string, startTime: string, openedAt = new Date()) {
  const eventStart = new Date(`${date}T${startTime}:00`);
  const registrationClose = new Date(eventStart.getTime() - 60 * 60 * 1000);
  return {
    registrationOpen: toLocalDateTimeInput(openedAt),
    registrationClose: toLocalDateTimeInput(registrationClose),
    cancellationDeadline: toLocalDateTimeInput(registrationClose),
  };
}

export default function EventFormPage() {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const editId = params?.id;
  const { addEvent, updateEvent, faculties, classes, events, currentUser } = useAppStore();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const editingEvent = useMemo(() => (editId ? events.find((e) => e.id === editId) : null), [editId, events]);

  const [form, setForm] = useState(() => {
    if (editingEvent) {
      return {
        name: editingEvent.name, description: editingEvent.description, workContent: editingEvent.workContent,
        location: editingEvent.location, date: editingEvent.date, startTime: editingEvent.startTime, endTime: editingEvent.endTime,
        shift: editingEvent.shift, registrationOpen: toLocalDateTimeInput(editingEvent.registrationOpen), registrationClose: toLocalDateTimeInput(editingEvent.registrationClose),
        cancellationDeadline: toLocalDateTimeInput(editingEvent.cancellationDeadline), maxCapacity: editingEvent.maxCapacity, workdayCredit: editingEvent.workdayCredit,
        clothingRequirements: editingEvent.clothingRequirements, equipmentRequirements: editingEvent.equipmentRequirements,
        contactPerson: editingEvent.contactPerson, contactPhone: editingEvent.contactPhone,
        eligibleFacultyIds: editingEvent.eligibleFacultyIds, eligibleClassIds: editingEvent.eligibleClassIds,
      };
    }
    const date = toLocalDateInput();
    const shift = 'morning' as WorkShift;
    const times = SHIFT_TIMES[shift];
    return {
      name: '', description: '', workContent: '', location: '', date, startTime: times.start, endTime: times.end, shift,
      ...registrationDefaults(date, times.start), maxCapacity: 30, workdayCredit: 1,
      clothingRequirements: '', equipmentRequirements: '', contactPerson: currentUser?.name ?? '', contactPhone: '',
      eligibleFacultyIds: [] as string[], eligibleClassIds: [] as string[],
    };
  });

  const isStep1Valid = form.name.trim() && form.location.trim() && form.workContent.trim();
  const eventStartsAt = new Date(`${form.date}T${form.startTime}:00`);
  const registrationOpensAt = new Date(form.registrationOpen);
  const registrationClosesAt = new Date(form.registrationClose);
  const isStep2Valid = Boolean(
    form.date
    && form.maxCapacity > 0
    && form.endTime > form.startTime
    && eventStartsAt > new Date()
    && registrationClosesAt > registrationOpensAt
    && registrationClosesAt < eventStartsAt,
  );

  function changeShift(shift: WorkShift) {
    const times = SHIFT_TIMES[shift];
    setForm((current) => ({
      ...current,
      shift,
      startTime: times.start,
      endTime: times.end,
      ...registrationDefaults(current.date, times.start),
    }));
  }

  function changeEventDate(date: string) {
    setForm((current) => ({
      ...current,
      date,
      ...registrationDefaults(date, current.startTime),
    }));
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.date || !form.location.trim()) { toast({ title: 'Vui lòng điền các trường bắt buộc', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, { ...form });
        toast({ title: 'Cập nhật sự kiện thành công' });
        router.push(`/organizer/events/${editingEvent.id}`);
      } else {
        const ev = await addEvent({ ...form, status: 'pending' });
        toast({ title: 'Tạo sự kiện thành công', description: 'Sự kiện đang chờ quản trị viên duyệt' });
        router.push(`/organizer/events/${ev.id}`);
      }
    } catch (error) { toast({ title: 'Không thể lưu sự kiện', description: error instanceof Error ? error.message : 'Có lỗi xảy ra', variant: 'destructive' }); } finally { setSaving(false); }
  }

  function next() {
    if (step === 1 && !isStep1Valid) { toast({ title: 'Vui lòng điền tên, địa điểm và nội dung công việc', variant: 'destructive' }); return; }
    if (step === 2 && !isStep2Valid) { toast({ title: 'Thời gian sự kiện chưa hợp lệ', description: 'Hãy chọn ca hoặc ngày tương lai; thời gian đóng đăng ký phải sau lúc mở và trước khi sự kiện bắt đầu.', variant: 'destructive' }); return; }
    setStep((s) => Math.min(3, s + 1));
  }
  function prev() { setStep((s) => Math.max(1, s - 1)); }

  return <div className="space-y-6">
    <Button variant="ghost" size="sm" onClick={() => router.back()}><ArrowLeft className="mr-1 h-4 w-4" /> Quay lại</Button>
    <PageHeader title={editingEvent ? 'Chỉnh sửa sự kiện' : 'Tạo sự kiện mới'} description="Điền thông tin sự kiện ngày công theo từng bước" />

    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      {STEPS.map((s, i) => (
        <div key={s.id} className="flex flex-1 items-center gap-2">
          <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors',
            step > s.id ? 'border-success bg-success text-success-foreground' : step === s.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground')}>
            {step > s.id ? <Check className="h-4 w-4" /> : s.id}
          </div>
          <span className={cn('hidden text-sm font-medium sm:inline', step === s.id ? 'text-foreground' : 'text-muted-foreground')}>{s.label}</span>
          {i < STEPS.length - 1 && <div className={cn('h-0.5 flex-1', step > s.id ? 'bg-success' : 'bg-border')} />}
        </div>
      ))}
    </div>

    {step === 1 && <Card><CardHeader><CardTitle className="text-base">Thông tin cơ bản</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2"><Label>Tên sự kiện *</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="VD: Vệ sinh khuôn viên giảng đường A" /></div>
      <div className="space-y-2 sm:col-span-2"><Label>Mô tả</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
      <div className="space-y-2 sm:col-span-2"><Label>Nội dung công việc *</Label><Textarea rows={3} value={form.workContent} onChange={(e) => setForm((f) => ({ ...f, workContent: e.target.value }))} /></div>
      <div className="space-y-2"><Label>Địa điểm *</Label><Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} /></div>
      <div className="space-y-2"><Label>Ca làm việc</Label><Select value={form.shift} onValueChange={(value) => changeShift(value as WorkShift)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(SHIFT_LABELS).map(([key, label]) => { const times = SHIFT_TIMES[key as WorkShift]; return <SelectItem key={key} value={key}>{label} · {times.start}–{times.end}</SelectItem>; })}</SelectContent></Select></div>
    </CardContent></Card>}

    {step === 2 && <Card><CardHeader><CardTitle className="text-base">Thời gian & năng lực</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2"><Label>Ngày tổ chức *</Label><Input type="date" min={editingEvent ? undefined : toLocalDateInput()} value={form.date} onChange={(event) => changeEventDate(event.target.value)} /></div>
      <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Giờ bắt đầu</Label><Input type="time" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} /></div><div className="space-y-2"><Label>Giờ kết thúc</Label><Input type="time" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} /></div></div>
      <div className="space-y-2"><Label>Mở đăng ký</Label><Input type="datetime-local" value={form.registrationOpen} onChange={(e) => setForm((f) => ({ ...f, registrationOpen: e.target.value }))} /></div>
      <div className="space-y-2"><Label>Đóng đăng ký</Label><Input type="datetime-local" value={form.registrationClose} onChange={(e) => setForm((f) => ({ ...f, registrationClose: e.target.value }))} /></div>
      <div className="space-y-2"><Label>Hạn hủy đăng ký</Label><Input type="datetime-local" value={form.cancellationDeadline} onChange={(e) => setForm((f) => ({ ...f, cancellationDeadline: e.target.value }))} /></div>
      <div className="space-y-2"><Label>Sức chứa tối đa *</Label><Input type="number" min={1} value={form.maxCapacity} onChange={(e) => setForm((f) => ({ ...f, maxCapacity: Number(e.target.value) }))} /></div>
      <div className="space-y-2"><Label>Ngày công</Label><Input type="number" min={0.5} step={0.5} value={form.workdayCredit} onChange={(e) => setForm((f) => ({ ...f, workdayCredit: Number(e.target.value) }))} /></div>
    </CardContent></Card>}

    {step === 3 && <Card><CardHeader><CardTitle className="text-base">Yêu cầu & đối tượng</CardTitle></CardHeader><CardContent className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label>Trang phục</Label><Textarea rows={2} value={form.clothingRequirements} onChange={(e) => setForm((f) => ({ ...f, clothingRequirements: e.target.value }))} /></div>
        <div className="space-y-2"><Label>Thiết bị</Label><Textarea rows={2} value={form.equipmentRequirements} onChange={(e) => setForm((f) => ({ ...f, equipmentRequirements: e.target.value }))} /></div>
        <div className="space-y-2"><Label>Người liên hệ</Label><Input value={form.contactPerson} onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))} /></div>
        <div className="space-y-2"><Label>Điện thoại liên hệ</Label><Input value={form.contactPhone} onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))} /></div>
      </div>
      <div className="space-y-2"><Label>Khoa được tham gia</Label><div className="grid gap-2 sm:grid-cols-2">{faculties.map((f) => <label key={f.id} className="flex items-center gap-2 text-sm"><Checkbox checked={form.eligibleFacultyIds.includes(f.id)} onCheckedChange={(c) => setForm((p) => ({ ...p, eligibleFacultyIds: c ? [...p.eligibleFacultyIds, f.id] : p.eligibleFacultyIds.filter((x) => x !== f.id) }))} /><span>{f.name}</span></label>)}</div></div>
      <div className="space-y-2"><Label>Lớp được tham gia</Label><div className="grid gap-2 sm:grid-cols-2">{classes.map((c) => <label key={c.id} className="flex items-center gap-2 text-sm"><Checkbox checked={form.eligibleClassIds.includes(c.id)} onCheckedChange={(ck) => setForm((p) => ({ ...p, eligibleClassIds: ck ? [...p.eligibleClassIds, c.id] : p.eligibleClassIds.filter((x) => x !== c.id) }))} /><span>{c.name}</span></label>)}</div></div>
    </CardContent></Card>}

    <div className="flex items-center justify-between">
      <Button variant="outline" onClick={prev} disabled={step === 1}><ArrowLeft className="mr-2 h-4 w-4" /> Quay lại</Button>
      {step < 3 ? <Button onClick={next}>Tiếp tục <ArrowRight className="ml-2 h-4 w-4" /></Button> :
        <Button onClick={handleSubmit} disabled={saving}>{saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" /> : <><Save className="mr-2 h-4 w-4" /> {editingEvent ? 'Lưu thay đổi' : 'Lưu sự kiện'}</>}</Button>}
    </div>
  </div>;
}
