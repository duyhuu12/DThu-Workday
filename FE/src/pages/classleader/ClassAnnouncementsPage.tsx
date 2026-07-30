'use client';

import { useEffect, useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getClassLeaderEvents, sendClassAnnouncement } from '@/services/classLeaderApi';
import { formatDate } from '@/lib/format';
import type { ClassLeaderEvent } from '@/types';

export default function ClassAnnouncementsPage() {
  const { toast } = useToast();
  const [events, setEvents] = useState<ClassLeaderEvent[]>([]);
  const [target, setTarget] = useState<'all' | 'insufficient' | 'unregistered'>('all');
  const [eventId, setEventId] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    getClassLeaderEvents()
      .then(setEvents)
      .catch((error: unknown) => toast({
        title: 'Không thể tải sự kiện',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
        variant: 'destructive',
      }));
  }, [toast]);

  async function handleSubmit() {
    if (!title.trim() || !message.trim()) {
      toast({ title: 'Vui lòng nhập tiêu đề và nội dung', variant: 'destructive' });
      return;
    }
    if (target === 'unregistered' && !eventId) {
      toast({ title: 'Vui lòng chọn sự kiện', variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      const sent = await sendClassAnnouncement({ target, title, message, eventId: eventId || undefined });
      toast({ title: 'Đã gửi thông báo', description: `${sent} sinh viên đã nhận thông báo.` });
      setTitle('');
      setMessage('');
    } catch (error) {
      toast({
        title: 'Gửi thông báo thất bại',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  }

  return <div className="space-y-6">
    <PageHeader title="Gửi thông báo lớp" description="Thông báo chỉ được gửi đến sinh viên thuộc lớp được phân công" />
    <Card><CardContent className="mx-auto max-w-3xl space-y-5 p-6">
      <div className="space-y-2"><Label>Nhóm nhận thông báo</Label><Select value={target} onValueChange={(value) => setTarget(value as typeof target)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả sinh viên trong lớp</SelectItem><SelectItem value="insufficient">Sinh viên chưa đủ ngày công</SelectItem><SelectItem value="unregistered">Sinh viên chưa đăng ký một sự kiện</SelectItem></SelectContent></Select></div>
      {target === 'unregistered' && <div className="space-y-2"><Label>Sự kiện cần nhắc đăng ký</Label><Select value={eventId} onValueChange={setEventId}><SelectTrigger><SelectValue placeholder="Chọn sự kiện" /></SelectTrigger><SelectContent>{events.map((event) => <SelectItem key={event.id} value={event.id}>{event.code} · {event.name} · {formatDate(event.date)}</SelectItem>)}</SelectContent></Select></div>}
      <div className="space-y-2"><Label>Tiêu đề</Label><Input maxLength={255} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ví dụ: Nhắc đăng ký lao động cuối tuần" /></div>
      <div className="space-y-2"><Label>Nội dung</Label><Textarea rows={7} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Nhập nội dung thông báo gửi đến sinh viên..." /></div>
      <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">Cán bộ lớp chỉ được gửi thông báo và nhắc nhở. Chức năng này không thay đổi đăng ký, điểm danh hoặc ngày công của sinh viên.</div>
      <Button onClick={handleSubmit} disabled={sending}>{sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}Gửi thông báo</Button>
    </CardContent></Card>
  </div>;
}
