'use client';

import { useEffect, useMemo, useState } from 'react';
import { Award, Loader2, Send } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, type Column } from '@/components/common/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { getClassStudents, remindInsufficientStudents } from '@/services/classLeaderApi';
import type { ClassLeaderStudent } from '@/types';

export default function WorkdayRemindersPage() {
  const { toast } = useToast();
  const [students, setStudents] = useState<ClassLeaderStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('Bạn chưa tích lũy đủ ngày công theo yêu cầu. Vui lòng theo dõi và đăng ký các đợt lao động phù hợp.');

  useEffect(() => {
    let active = true;
    getClassStudents()
      .then((data) => { if (active) setStudents(data); })
      .catch((error: unknown) => toast({
        title: 'Không thể tải tiến độ ngày công',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
        variant: 'destructive',
      }))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [toast]);

  const insufficient = useMemo(() => students.filter((student) => !student.hasEnoughWorkdays), [students]);

  async function handleSend() {
    setSending(true);
    try {
      const sent = await remindInsufficientStudents(message);
      toast({ title: 'Đã gửi nhắc nhở', description: `${sent} sinh viên chưa đủ ngày công đã nhận thông báo.` });
    } catch (error) {
      toast({
        title: 'Không thể gửi nhắc nhở',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  }

  const columns: Column<ClassLeaderStudent>[] = [
    { key: 'studentCode', header: 'Mã SV', sortable: true, sortValue: (student) => student.studentCode },
    { key: 'fullName', header: 'Họ tên', sortable: true, sortValue: (student) => student.fullName, render: (student) => <span className="font-medium">{student.fullName}</span> },
    { key: 'progress', header: 'Tiến độ', render: (student) => {
      const percent = student.requiredWorkdays > 0 ? Math.min(100, Math.round(student.accumulatedWorkdays / student.requiredWorkdays * 100)) : 0;
      return <div className="min-w-52 space-y-1"><div className="flex justify-between text-xs"><span>{student.accumulatedWorkdays}/{student.requiredWorkdays} ngày</span><span className="font-medium text-destructive">Thiếu {student.missingWorkdays}</span></div><Progress value={percent} className="h-2" /></div>;
    } },
    { key: 'contact', header: 'Liên hệ', render: (student) => <div className="text-xs"><p>{student.email}</p><p className="text-muted-foreground">{student.phone || 'Chưa có số điện thoại'}</p></div> },
  ];

  return <div className="space-y-6">
    <PageHeader title="Nhắc nhở ngày công" description="Gửi thông báo đến sinh viên trong lớp chưa đạt số ngày công yêu cầu" />
    <Card><CardContent className="space-y-4 p-5">
      <div className="rounded-lg border bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200"><strong>{insufficient.length}</strong> sinh viên hiện chưa đủ ngày công. Chức năng này chỉ gửi nhắc nhở, không điều chỉnh số ngày công.</div>
      <div className="space-y-2"><label className="text-sm font-medium">Nội dung nhắc nhở</label><Textarea rows={4} value={message} onChange={(event) => setMessage(event.target.value)} /></div>
      <Button onClick={handleSend} disabled={sending || loading || insufficient.length === 0 || !message.trim()}>{sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}Gửi đến sinh viên chưa đủ ngày công</Button>
    </CardContent></Card>
    <Card><CardContent className="p-4">{loading ? <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : insufficient.length === 0 ? <div className="flex flex-col items-center py-16 text-center"><Award className="mb-3 h-10 w-10 text-emerald-600" /><p className="font-medium">Tất cả sinh viên đã đủ ngày công</p></div> : <DataTable columns={columns} data={insufficient} rowKey={(student) => student.id} pageSize={12} />}</CardContent></Card>
  </div>;
}
